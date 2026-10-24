import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Dict, Any
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models import Workflow, Execution
from app.schemas import WorkflowCreate, WorkflowUpdate, WorkflowOut
from app.engine.executor import WorkflowExecutor
from app.config import settings

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.get("", response_model=List[WorkflowOut])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).order_by(desc(Workflow.updated_at)))
    return result.scalars().all()

@router.post("", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
async def create_workflow(payload: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    wf = Workflow(
        name=payload.name,
        description=payload.description,
        graph_data=payload.graph_data.model_dump()
    )
    db.add(wf)
    await db.commit()
    await db.refresh(wf)
    return wf

@router.get("/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf

@router.put("/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(workflow_id: str, payload: WorkflowUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if payload.name is not None:
        wf.name = payload.name
    if payload.description is not None:
        wf.description = payload.description
    if payload.graph_data is not None:
        wf.graph_data = payload.graph_data.model_dump()

    await db.commit()
    await db.refresh(wf)
    return wf

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    await db.delete(wf)
    await db.commit()
    return None

@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: str,
    execution_params: Dict[str, Any] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes a workflow with real-time Server-Sent Events (SSE) updates.
    Persists execution history in the database.
    """
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    graph_data = wf.graph_data or {}
    nodes = graph_data.get("nodes", [])
    edges = graph_data.get("edges", [])
    params = execution_params or {}
    workflow_inputs = params.get("inputs", {})
    provider_settings = params.get("provider_settings", {})

    executor = WorkflowExecutor(
        nodes=nodes,
        edges=edges,
        workflow_inputs=workflow_inputs,
        provider_settings=provider_settings
    )

    execution_record = Execution(
        workflow_id=workflow_id,
        status="running",
        node_results={},
        logs=[]
    )
    db.add(execution_record)
    await db.commit()
    await db.refresh(execution_record)

    async def event_generator():
        try:
            async for event in executor.execute_workflow_stream():
                event_type = event.get("type")
                if event_type == "workflow_completed":
                    execution_record.status = "success"
                    execution_record.duration_ms = event.get("duration_ms", 0)
                    execution_record.node_results = event.get("node_results", {})
                    execution_record.logs = event.get("logs", [])
                    await db.commit()
                elif event_type == "workflow_failed":
                    execution_record.status = "failed"
                    execution_record.duration_ms = event.get("duration_ms", 0)
                    execution_record.logs = executor.node_logs
                    await db.commit()
                
                # Yield SSE message
                yield {
                    "event": "message",
                    "data": json.dumps(event)
                }
        except Exception as e:
            execution_record.status = "failed"
            execution_record.logs = executor.node_logs
            await db.commit()
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "workflow_failed",
                    "error": str(e)
                })
            }

    return EventSourceResponse(event_generator())
