"""
Logging configuration using Loguru
"""
import sys
from loguru import logger
from pathlib import Path
from typing import Optional

from ..config.settings import settings


def setup_logger(
    log_level: str = settings.log_level,
    log_file: Optional[str] = None,
    rotation: str = "100 MB",
    retention: str = "10 days",
    compression: str = "zip"
) -> None:
    """
    Configure loguru logger for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional path to log file
        rotation: When to rotate log file
        retention: How long to keep old log files
        compression: Compression format for old logs
    """
    # Remove default handler
    logger.remove()

    # Add stdout handler with formatting
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=log_level,
        colorize=True,
    )

    # Add file handler if specified
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        logger.add(
            log_file,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
            level=log_level,
            rotation=rotation,
            retention=retention,
            compression=compression,
            enqueue=True,  # Thread-safe
        )

        logger.info(f"Logging to file: {log_file}")

    logger.info(f"Logger configured with level: {log_level}")


def get_logger(name: str):
    """
    Get a logger instance for a specific module.

    Args:
        name: Module name (usually __name__)

    Returns:
        Configured logger instance
    """
    return logger.bind(name=name)


# Initialize default logger on import
setup_logger()
