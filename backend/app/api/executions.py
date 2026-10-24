from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.database import get_db
from app.models import Execution
from app.schemas import ExecutionOut

router = APIRouter(prefix="/executions", tags=["Executions"])

@router.get("", response_model=List[ExecutionOut])
async def list_executions(workflow_id: str = None, limit: int = 20, db: AsyncSession = Depends(get_db)):
    query = select(Execution).order_by(desc(Execution.started_at)).limit(limit)
    if workflow_id:
        query = query.where(Execution.workflow_id == workflow_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{execution_id}", response_model=ExecutionOut)
async def get_execution(execution_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Execution).where(Execution.id == execution_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Execution not found")
    return item
