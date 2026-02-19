from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class ProjectPhase(str, Enum):
    DISCOVERY = "discovery"
    ARCHITECTURE = "architecture"
    CODING = "coding"

class Attachment(BaseModel):
    name: str
    data: str 
    type: str

class Message(BaseModel):
    role: str
    content: str
    attachment: Optional[Attachment] = None

class ProjectState(BaseModel):
    id: str
    name: str
    phase: ProjectPhase
    tech_stack: List[str]
    history: List[Message]

class UserRequest(BaseModel):
    project_id: str
    message: str
    current_state: ProjectState
    attachment: Optional[Attachment] = None

class AIResponse(BaseModel):
    reply: str
    updated_state: ProjectState
    model_used: str