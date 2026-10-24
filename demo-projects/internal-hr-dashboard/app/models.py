"""
HR Dashboard data models — uses SQLAlchemy ORM with parameterized queries.
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_number = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    department = Column(String(100))
    position = Column(String(100))
    salary = Column(Float)
    hire_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    manager_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    head_id = Column(String(36), nullable=True)
    budget = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(36), nullable=False)
    leave_type = Column(String(50), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    reviewed_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(String(100))
    ip_address = Column(String(45))
    timestamp = Column(DateTime, default=datetime.utcnow)
