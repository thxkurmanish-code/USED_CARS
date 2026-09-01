import io
import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import get_settings

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

UPLOAD_DIR = Path("uploads")


class StorageService:
    @staticmethod
    def ensure_upload_dir() -> Path:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        return UPLOAD_DIR

    @staticmethod
    def _get_s3_client():
        settings = get_settings()
        if not HAS_BOTO3 or not settings.s3_bucket_name:
            return None
        
        kwargs = {}
        if settings.s3_endpoint_url:
            kwargs["endpoint_url"] = settings.s3_endpoint_url
        if settings.s3_access_key_id and settings.s3_secret_access_key:
            kwargs["aws_access_key_id"] = settings.s3_access_key_id
            kwargs["aws_secret_access_key"] = settings.s3_secret_access_key
        if settings.s3_region_name:
            kwargs["region_name"] = settings.s3_region_name

        return boto3.client("s3", **kwargs)

    @staticmethod
    def save_image(file: UploadFile, listing_id: uuid.UUID) -> tuple[str, str, int, int | None, int | None]:
        """
        Validates and saves an uploaded image file of ANY size.
        Supports both S3 Object Storage (production) and local disk storage (fallback/development).
        Returns (storage_key, content_type, byte_size, width, height)
        """
        contents = file.file.read()
        if not contents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        width, height = None, None
        content_type = file.content_type or "image/jpeg"
        ext = Path(file.filename or "photo.jpg").suffix.lower()
        if not ext or len(ext) > 10:
            ext = ".jpg"

        final_contents = contents

        # Auto-optimize/resize large images if PIL is available
        if HAS_PIL:
            try:
                with Image.open(io.BytesIO(contents)) as img:
                    width, height = img.size
                    max_dimension = 2048
                    if img.width > max_dimension or img.height > max_dimension:
                        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                        width, height = img.size

                    if img.mode in ("RGBA", "P", "LA"):
                        img = img.convert("RGB")

                    out = io.BytesIO()
                    img.save(out, format="JPEG", quality=85, optimize=True)
                    final_contents = out.getvalue()
                    content_type = "image/jpeg"
                    ext = ".jpg"
            except Exception:
                final_contents = contents

        byte_size = len(final_contents)
        file_id = uuid.uuid4()
        settings = get_settings()
        s3_client = StorageService._get_s3_client()

        # If S3 is configured, upload directly to S3 bucket
        if s3_client and settings.s3_bucket_name:
            s3_key = f"listings/{listing_id}/{file_id}{ext}"
            try:
                s3_client.put_object(
                    Bucket=settings.s3_bucket_name,
                    Key=s3_key,
                    Body=final_contents,
                    ContentType=content_type,
                )
                if settings.s3_public_custom_domain:
                    storage_key = f"{settings.s3_public_custom_domain.rstrip('/')}/{s3_key}"
                else:
                    storage_key = f"s3://{settings.s3_bucket_name}/{s3_key}"
                return storage_key, content_type, byte_size, width, height
            except Exception as e:
                # Log error and fall back to local disk storage
                print(f"[STORAGE WARNING] S3 Upload failed ({e}), falling back to local storage.")

        # Local disk storage fallback
        listing_dir = StorageService.ensure_upload_dir() / str(listing_id)
        listing_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{file_id}{ext}"
        target_path = listing_dir / filename
        with open(target_path, "wb") as f:
            f.write(final_contents)

        storage_key = f"/uploads/{listing_id}/{filename}"
        return storage_key, content_type, byte_size, width, height

    @staticmethod
    def delete_image(storage_key: str) -> None:
        settings = get_settings()
        s3_client = StorageService._get_s3_client()

        if s3_client and settings.s3_bucket_name and ("s3://" in storage_key or "listings/" in storage_key):
            try:
                s3_key = storage_key.split("listings/")[-1]
                s3_client.delete_object(Bucket=settings.s3_bucket_name, Key=f"listings/{s3_key}")
                return
            except Exception:
                pass

        if storage_key.startswith("/uploads/"):
            relative_path = storage_key.lstrip("/")
            file_path = Path(relative_path)
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass
