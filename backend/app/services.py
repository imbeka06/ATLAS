import os
from openai import OpenAI
from dotenv import load_dotenv
from .models import ProjectState, ProjectPhase

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"), 
    base_url="https://api.deepseek.com"
)

def get_best_model_for_task(message: str, phase: ProjectPhase):
    msg_lower = message.lower()
    
    # TRIGGER: Coding or Math -> DeepSeek (Best Performance & Cost)
    if any(k in msg_lower for k in ["code", "function", "api", "script", "endpoint"]):
        return deepseek_client, "deepseek-chat"
    
    if any(k in msg_lower for k in ["calculate", "math", "formula", "algorithm"]):
        return deepseek_client, "deepseek-reasoner"

    # TRIGGER: Discovery or SRS -> GPT-4o (Best Reasoning & Formatting)
    if phase == ProjectPhase.DISCOVERY or "srs" in msg_lower or "plan" in msg_lower:
        return openai_client, "gpt-4o"

    # DEFAULT: DeepSeek (Good default for general chat)
    return deepseek_client, "deepseek-chat"

def analyze_intent_and_respond(message: str, state: ProjectState) -> dict:
    client, model_name = get_best_model_for_task(message, state.phase)

    messages = [
        {"role": "system", "content": f"You are ARCHITECT.AI. Phase: {state.phase}. Stack: {state.tech_stack}"},
    ]
    
    messages.extend(state.history[-5:]) 
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=model_name,
        messages=messages,
        temperature=0.2 if "deepseek" in model_name else 0.7
    )

    ai_text = response.choices[0].message.content
    
    if "architecture" in message.lower() or "diagram" in message.lower():
        state.phase = ProjectPhase.ARCHITECTURE
    if "generate code" in message.lower():
        state.phase = ProjectPhase.CODING

    return {
        "reply": ai_text,
        "updated_state": state,
        "model_used": model_name
    }