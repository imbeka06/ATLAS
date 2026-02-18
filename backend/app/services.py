import os
from openai import OpenAI
from .models import ProjectState, ProjectPhase

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

def analyze_intent_and_respond(message: str, state: ProjectState) -> dict:
    messages = [
        {"role": "system", "content": "You are ATLAS, an expert AI software architect. When generating code, always format it clearly using markdown with the filename in bold, like this: **`frontend/app.tsx`** \n```tsx\n code here \n```"}
    ]

    recent_history = state.history[-4:]
    
    for msg in recent_history:
        content = str(msg["content"])
        if len(content) > 1000:
            content = content[:1000] + "\n... [Code Truncated for Memory]"
        messages.append({"role": msg.get("role", "user"), "content": content})

    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        max_tokens=4000,
        temperature=0.7
    )

    reply = response.choices[0].message.content

    if "```mermaid" in reply:
        state.phase = ProjectPhase.ARCHITECTURE
    elif "```" in reply:
        state.phase = ProjectPhase.CODING

    return {
        "reply": reply,
        "updated_state": state,
        "model_used": "deepseek-chat"
    }