from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON
from app.database import Base
import uuid

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, default="Untitled Workflow")
    description = Column(Text, nullable=True, default="")
    graph_data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Execution(Base):
    __tablename__ = "executions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="idle")  # idle, running, success, failed, cancelled
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    finished_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True, default=0)
    node_results = Column(JSON, nullable=False, default=dict)
    logs = Column(JSON, nullable=False, default=list)
