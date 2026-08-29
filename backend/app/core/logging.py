import logging


def configure_logging() -> None:
    """Configure conservative application logging without sensitive values."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
