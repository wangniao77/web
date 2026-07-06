import logging
import sys

from core.config import get_settings

settings = get_settings()


def setup_logger(name: str = "app") -> logging.Logger:
    """配置并返回应用日志器。"""

    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    level = logging.DEBUG if settings.app_debug else logging.INFO
    logger.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    logger.addHandler(handler)
    return logger


logger = setup_logger()
