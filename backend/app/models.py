from pydantic import BaseModel
from typing import List, Optional, Dict, Literal
from enum import Enum

class ProjectPhase(str, Enum):
    DISCOVERY = "discovery"
    ARCHITECTURE = "architecture"
    CODING = "coding"

class ProjectState(BaseModel):
    name: str = "Untitled Project"
    phase: ProjectPhase = ProjectPhase.DISCOVERY
    tech_stack: List[str] = []
    requirements: List[str] = []
    history: List[Dict[str, str]] = []

class UserRequest(BaseModel):
    project_id: str
    message: str
    current_state: ProjectState

class AIResponse(BaseModel):
    reply: str
    updated_state: ProjectState
    model_used: str