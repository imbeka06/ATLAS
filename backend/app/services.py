import os
from openai import OpenAI
from dotenv import load_dotenv
from .models import ProjectState, ProjectPhase
from .prompts import SYSTEM_PROMPT

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"), 
    base_url="https://api.deepseek.com"
)

def get_best_model_for_task(message: str, phase: ProjectPhase):
    msg_lower = message.lower()
    
    if any(k in msg_lower for k in ["code", "function", "api", "script", "endpoint"]):
        return deepseek_client, "deepseek-chat"
    
    if any(k in msg_lower for k in ["calculate", "math", "formula", "algorithm"]):
        return deepseek_client, "deepseek-reasoner"

    if phase == ProjectPhase.DISCOVERY or "srs" in msg_lower or "plan" in msg_lower:
        return openai_client, "gpt-4o"

    return deepseek_client, "deepseek-chat"

def analyze_intent_and_respond(message: str, state: ProjectState) -> dict:
    client, model_name = get_best_model_for_task(message, state.phase)

    
    formatted_system_prompt = SYSTEM_PROMPT.format(
        phase=state.phase.value,
        stack=", ".join(state.tech_stack) if state.tech_stack else "None selected"
    )

    messages = [
        {"role": "system", "content": formatted_system_prompt},
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