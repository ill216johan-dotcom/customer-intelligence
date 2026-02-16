"""
SQLAlchemy models for the Customer Intelligence Platform.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
import enum

from sqlalchemy import (
    String, Text, Integer, BigInteger, Boolean, Date, DateTime,
    ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from pgvector.sqlalchemy import Vector

from app.db.database import Base


# ==========================================
# Enums
# ==========================================

class CallSource(str, enum.Enum):
    JITSI = "jitsi"
    BITRIX = "bitrix"
    MANUAL = "manual"


class MessageSource(str, enum.Enum):
    TELEGRAM = "telegram"
    EMAIL = "email"
    BITRIX = "bitrix"
    WHATSAPP = "whatsapp"


class MessageDirection(str, enum.Enum):
    INCOMING = "incoming"
    OUTGOING = "outgoing"


class AlertType(str, enum.Enum):
    HIGH_RESERVES = "high_reserves"
    POTENTIAL_LEAVE = "potential_leave"
    PAYMENT_OVERDUE = "payment_overdue"
    CUSTOM = "custom"


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


# ==========================================
# Models
# ==========================================

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, server_default="uuid_generate_v4()")
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.MANAGER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    
    # Relationships
    notes: Mapped[List["Note"]] = relationship(back_populates="author", foreign_keys="Note.author_id")


class Customer(Base):
    __tablename__ = "customers"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, server_default="uuid_generate_v4()")
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    telegram_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    telegram_username: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Business Info
    products: Mapped[Optional[str]] = mapped_column(Text)
    marketplaces: Mapped[Optional[dict]] = mapped_column(JSONB, default=list)
    working_since: Mapped[Optional[date]] = mapped_column(Date)
    
    # Pain Points & History
    pains: Mapped[Optional[str]] = mapped_column(Text)
    conflicts: Mapped[Optional[str]] = mapped_column(Text)
    
    # External IDs
    wms_client_id: Mapped[Optional[str]] = mapped_column(String(100))
    bitrix_contact_id: Mapped[Optional[int]] = mapped_column(Integer)
    
    # AI Summary
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    
    # Relationships
    calls: Mapped[List["Call"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    messages: Mapped[List["Message"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    notes: Mapped[List["Note"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship(back_populates="customer", cascade="all, delete-orphan")


class Call(Base):
    __tablename__ = "calls"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, server_default="uuid_generate_v4()")
    customer_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    
    # Call Info
    source: Mapped[CallSource] = mapped_column(SQLEnum(CallSource), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255))
    meeting_id: Mapped[Optional[str]] = mapped_column(String(255))
    
    # Timing
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    duration: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Participants
    participants: Mapped[Optional[dict]] = mapped_column(JSONB, default=list)
    
    # Content
    transcript: Mapped[Optional[str]] = mapped_column(Text)
    transcript_with_speakers: Mapped[Optional[dict]] = mapped_column(JSONB)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    key_points: Mapped[Optional[dict]] = mapped_column(JSONB, default=list)
    action_items: Mapped[Optional[dict]] = mapped_column(JSONB, default=list)
    
    # Files
    audio_url: Mapped[Optional[str]] = mapped_column(String(500))
    audio_filename: Mapped[Optional[str]] = mapped_column(String(255))
    
    # RAG
    embedding = mapped_column(Vector(1024))
    
    # Status
    processing_status: Mapped[str] = mapped_column(String(50), default="pending")
    processing_error: Mapped[Optional[str]] = mapped_column(Text)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    
    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship(back_populates="calls")


class Message(Base):
    __tablename__ = "messages"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, server_default="uuid_generate_v4()")
    customer_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    
    # Message Info
    source: Mapped[MessageSource] = mapped_column(SQLEnum(MessageSource), nullable=False)
    direction: Mapped[MessageDirection] = mapped_column(SQLEnum(MessageDirection), nullable=False)
    
    # Sender
    sender_name: Mapped[Optional[str]] = mapped_column(String(255))
    sender_id: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Chat grouping
    chat_id: Mapped[Optional[str]] = mapped_column(String(100))
    thread_id: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Timing
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # RAG
    embedding = mapped_column(Vector(1024))
    
    # Metadata
    raw_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    
    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship(back_populates="messages")


class Note(Base):
    __tablename__ = "notes"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, server_default="uuid_generate_v4()")
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    author_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # RAG
    embedding = mapped_column(Vector(1024))
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    
    # Relationships
    customer: Mapped["Customer"] = relationship(back_populates="notes")
    author: Mapped[Optional["User"]] = relationship(back_populates="notes", foreign_keys=[author_id])


class Alert(Base):
    __tablename__ = "alerts"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, server_default="uuid_generate_v4()")
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    
    type: Mapped[AlertType] = mapped_column(SQLEnum(AlertType), nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(SQLEnum(AlertSeverity), default=AlertSeverity.MEDIUM)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text)
    
    trigger_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_by: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id"))
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_by: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id"))
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    resolution_note: Mapped[Optional[str]] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    
    # Relationships
    customer: Mapped["Customer"] = relationship(back_populates="alerts")
