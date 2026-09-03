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
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

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
    def _is_cloudinary_configured() -> bool:
        settings = get_settings()
        return bool(
            HAS_CLOUDINARY
            and settings.cloudinary_cloud_name
            and settings.cloudinary_api_key
            and settings.cloudinary_api_secret
        )

    @staticmethod
    def _configure_cloudinary() -> bool:
        if not StorageService._is_cloudinary_configured():
            return False
        settings = get_settings()
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        return True

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
    def save_image(file: UploadFile, listing_id: uuid.UUID) -> tuple[str, str | None, str, int, int | None, int | None]:
        """
        Validates and saves an uploaded image file.
        Primary production storage: Cloudinary Object Storage.
        Returns (storage_key, public_id, content_type, byte_size, width, height)
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

        # 1. CLOUDINARY UPLOAD (Primary Cloud Provider)
        if StorageService._configure_cloudinary():
            try:
                upload_res = cloudinary.uploader.upload(
                    final_contents,
                    folder=f"dream_car_bazaar/listings/{listing_id}",
                    public_id=str(file_id),
                    resource_type="image",
                    overwrite=True,
                )
                storage_key = upload_res.get("secure_url") or upload_res.get("url")
                public_id = upload_res.get("public_id")
                width = upload_res.get("width") or width
                height = upload_res.get("height") or height
                byte_size = upload_res.get("bytes") or byte_size

                if not storage_key:
                    raise Exception("Cloudinary did not return a valid image URL.")

                return storage_key, public_id, content_type, byte_size, width, height
            except Exception as e:
                print(f"[STORAGE ERROR] Cloudinary upload failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload image to Cloudinary: {str(e)}"
                )

        # 2. S3 FALLBACK (if S3 credentials configured)
        s3_client = StorageService._get_s3_client()
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
                    domain = settings.s3_public_custom_domain.rstrip("/")
                    storage_key = f"{domain}/{s3_key}"
                    if not storage_key.startswith("http://") and not storage_key.startswith("https://"):
                        storage_key = f"https://{storage_key}"
                elif settings.s3_endpoint_url:
                    endpoint = settings.s3_endpoint_url.rstrip("/")
                    storage_key = f"{endpoint}/{settings.s3_bucket_name}/{s3_key}"
                else:
                    storage_key = f"https://{settings.s3_bucket_name}.s3.{settings.s3_region_name}.amazonaws.com/{s3_key}"

                return storage_key, s3_key, content_type, byte_size, width, height
            except Exception as e:
                print(f"[STORAGE ERROR] S3 Upload failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload image to cloud storage: {str(e)}"
                )

        # 3. PRODUCTION ENFORCEMENT — Require cloud storage in production
        if settings.app_env == "production":
            print("[STORAGE ERROR] Cloud image storage is not configured in production.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloud image storage (Cloudinary) is not configured in production environment. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Render environment settings."
            )

        # 4. Local disk storage (Development fallback only)
        listing_dir = StorageService.ensure_upload_dir() / str(listing_id)
        listing_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{file_id}{ext}"
        target_path = listing_dir / filename
        with open(target_path, "wb") as f:
            f.write(final_contents)

        storage_key = f"/uploads/{listing_id}/{filename}"
        return storage_key, None, content_type, byte_size, width, height

    @staticmethod
    def delete_image(storage_key: str, public_id: str | None = None) -> None:
        settings = get_settings()

        # 1. Cloudinary Delete
        if StorageService._configure_cloudinary():
            pid = public_id
            if not pid and ("res.cloudinary.com" in storage_key or "cloudinary" in storage_key):
                try:
                    parts = storage_key.split("/upload/")
                    if len(parts) > 1:
                        after_upload = parts[1]
                        subparts = after_upload.split("/", 1)
                        if subparts[0].startswith("v") and len(subparts) > 1:
                            file_path = subparts[1]
                        else:
                            file_path = after_upload
                        pid = file_path.rsplit(".", 1)[0]
                except Exception:
                    pid = None

            if pid:
                try:
                    cloudinary.uploader.destroy(pid)
                    return
                except Exception as e:
                    print(f"[STORAGE WARNING] Cloudinary destroy failed for {pid}: {e}")

        # 2. S3 Delete Fallback
        s3_client = StorageService._get_s3_client()
        if s3_client and settings.s3_bucket_name and ("s3://" in storage_key or "listings/" in storage_key):
            try:
                s3_key = storage_key.split("listings/")[-1]
                s3_client.delete_object(Bucket=settings.s3_bucket_name, Key=f"listings/{s3_key}")
                return
            except Exception:
                pass

        # 3. Local File Delete
        if storage_key.startswith("/uploads/"):
            relative_path = storage_key.lstrip("/")
            file_path = Path(relative_path)
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass
