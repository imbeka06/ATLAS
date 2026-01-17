from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import UserRequest, AIResponse
from .services import analyze_intent_and_respond

app = FastAPI(title="ARCHITECT.AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat", response_model=AIResponse)
async def chat_endpoint(request: UserRequest):
    try:
        result = analyze_intent_and_respond(request.message, request.current_state)
        
        updated_state = result["updated_state"]
        updated_state.history.append({"role": "user", "content": request.message})
        updated_state.history.append({"role": "assistant", "content": result["reply"]})
        
        return AIResponse(
            reply=result["reply"],
            updated_state=updated_state,
            model_used=result["model_used"]
        )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))