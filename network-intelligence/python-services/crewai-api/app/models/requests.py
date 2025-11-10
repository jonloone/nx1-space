"""
Request and Response Models for CrewAI API
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class CrewRequest(BaseModel):
    """Request to execute a crew"""
    query: str = Field(..., description="User's natural language query")
    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional context (map state, selected location, etc.)"
    )
    crew_type: Optional[str] = Field(
        "auto",
        description="Crew to use: 'route', 'site', 'investigation', 'auto'"
    )
    verbose: bool = Field(False, description="Enable verbose logging")


class TaskResult(BaseModel):
    """Result from individual task execution"""
    task_id: str
    agent_name: str
    output: Any
    success: bool
    duration_ms: Optional[int] = None
    tokens_used: Optional[int] = None


class CrewResponse(BaseModel):
    """Response from crew execution"""
    success: bool
    output: str = Field(..., description="Final synthesized intelligence")
    task_results: List[TaskResult] = Field(
        default_factory=list,
        description="Results from each task/agent"
    )
    artifacts: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Chat artifacts (route-analysis, imagery-analysis, etc.)"
    )
    actions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Map actions (flyTo, addMarkers, etc.)"
    )
    total_duration_ms: Optional[int] = None
    total_tokens: Optional[int] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    crews_available: List[str]
