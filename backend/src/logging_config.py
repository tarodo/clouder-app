import logging
import sys


class HealthCheckFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # For uvicorn.access, the message is the request line
        # e.g., '172.23.0.1:52020 - "GET /docs HTTP/1.1" 200'
        # We can check for "/docs" to filter health checks.
        return record.getMessage().find("/docs") == -1


LOG_LEVEL = logging.INFO

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "health_check_filter": {
            "()": "src.logging_config.HealthCheckFilter",
        }
    },
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "stream": sys.stdout,
        },
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "uvicorn.access": {"handlers": ["console"], "propagate": False, "filters": ["health_check_filter"]},
        "uvicorn.error": {"handlers": ["console"], "propagate": False},
    },
} 