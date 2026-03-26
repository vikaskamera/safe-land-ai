import time
from fastapi import Request
from core.logger import logger
from starlette.middleware.base import BaseHTTPMiddleware

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = round((time.time() - start) * 1000, 2)
        logger.info(
            f"{request.method} {request.url.path} "
            f"| status={response.status_code} | {duration}ms "
            f"| ip={request.client.host if request.client else 'unknown'}"
        )
        return response
