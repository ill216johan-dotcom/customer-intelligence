"""
Customer Intelligence Platform - FastAPI Backend
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import customers, calls, messages, notes, alerts, chat, auth, llm
from app.db.database import init_db
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Customer Intelligence API",
    description="Единая платформа управления информацией о клиентах фулфилмента",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(chat.router, prefix="/api/chat", tags=["RAG Chat"])
app.include_router(llm.router, prefix="/api/llm", tags=["LLM"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Customer Intelligence API",
        "version": "0.1.0",
    }


@app.get("/health")
async def health():
    """Health check for load balancers."""
    return {"status": "healthy"}
