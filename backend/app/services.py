import os
from dotenv import load_dotenv
from openai import OpenAI
from .models import ProjectState, ProjectPhase, UserRequest

load_dotenv()

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "missing_key"),
    base_url="https://api.deepseek.com"
)

def analyze_intent_and_respond(request: UserRequest) -> dict:
    state = request.current_state
    messages = [
        {
            "role": "system",
            "content": "You are ATLAS, an expert AI software architect. When generating code, output distinct files using markdown with the filename in bold, like: **`index.html`** \n```html\n code \n```. For web projects, strictly separate HTML, CSS, and JS into distinct files. For diagrams, always use Mermaid JS (ERD, DFD, flowcharts). Separate SRS documentation clearly from code."
        }
    ]

    recent_history = state.history[-4:]
    for msg in recent_history:
        content = str(msg.content)
        if len(content) > 1000:
            content = content[:1000] + "\n... [Code Truncated for Memory]"
            
        if msg.attachment:
            messages.append({
                "role": msg.role,
                "content": [
                    {"type": "text", "text": content},
                    {"type": "image_url", "image_url": {"url": msg.attachment.data}}
                ]
            })
        else:
            messages.append({"role": msg.role, "content": content})

    user_content = [{"type": "text", "text": request.message}]
    if request.attachment:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": request.attachment.data}
        })
    messages.append({"role": "user", "content": user_content})

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