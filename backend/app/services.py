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
            "content": "You are ATLAS. Output distinct files using markdown with the filename in bold, exactly like: **`index.html`**\n```html\ncode\n```. Always provide full HTML for web previews. Separate HTML, CSS, and JS. Use Mermaid JS for diagrams."
        }
    ]

    recent_history = state.history[-6:]
    for msg in recent_history:
        content = str(msg.content)
        if len(content) > 1000:
            content = content[:1000] + "\n\n...[Truncated]"
            
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

    enforced_prompt = request.message + "\n\n[SYSTEM REMINDER: Format every file exactly as **`filename.ext`** followed immediately by the markdown code block. If building a web app, always include the full index.html file.]"
    
    user_content = [{"type": "text", "text": enforced_prompt}]
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