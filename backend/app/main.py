from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import UserRequest, AIResponse, Message
from .services import analyze_intent_and_respond

app = FastAPI(title="ARCHITECT.AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat", response_model=AIResponse)
async def chat_endpoint(request: UserRequest):
    try:
        result = analyze_intent_and_respond(request)
        
        updated_state = result["updated_state"]
        updated_state.history.append(Message(role="user", content=request.message, attachment=request.attachment))
        updated_state.history.append(Message(role="assistant", content=result["reply"]))
        
        return AIResponse(
            reply=result["reply"],
            updated_state=updated_state,
            model_used=result["model_used"]
        )
            
    except Exception as e:
        print(f"SERVER ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ARCHITECT.AI is online"}