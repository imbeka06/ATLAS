import os
from dotenv import load_dotenv
from openai import OpenAI
from .models import ProjectState, ProjectPhase, UserRequest

load_dotenv()

# 1. Initialize BOTH Brains
deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "missing_key"),
    base_url="https://api.deepseek.com"
)

openai_client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "missing_key")
)

def analyze_intent_and_respond(request: UserRequest) -> dict:
    state = request.current_state
    
    # 2. The Router Logic: Determine if the request requires vision capabilities
    requires_vision = request.attachment and request.attachment.type.startswith('image/')
    
    system_prompt = (
        "You are ATLAS, an elite AI Solutions Architect. "
        "Every response MUST strictly follow this structure:\n"
        "1. **## SRS & Documentation** (Analyze the request)\n"
        "2. **## Architecture** (Update Mermaid diagrams)\n"
        "3. **## Implementation** (Provide FULL code files)\n\n"
        "CRITICAL RULES:\n"
        "- NEVER output snippets. Always output the FULL content of every file (e.g., the complete index.html) so the preview works.\n"
        "- File format: **`filename.ext`** followed by the code block.\n"
        "- For web apps, always output 'index.html', 'style.css', and 'script.js'."
    )

    messages = [{"role": "system", "content": system_prompt}]
    recent_history = state.history[-6:]

    # 3. Smart History Parsing
    for msg in recent_history:
        content = str(msg.content)
        if len(content) > 1500:
            content = content[:1500] + "\n\n...[Old Code Truncated to save memory]..."
            
        # If the history contains an image, we only pass it if we are using OpenAI right now
        has_historical_image = getattr(msg, 'attachment', None) and msg.attachment.type.startswith('image/')
        
        if has_historical_image and requires_vision:
            messages.append({
                "role": msg.role,
                "content": [
                    {"type": "text", "text": content},
                    {"type": "image_url", "image_url": {"url": msg.attachment.data}}
                ]
            })
        else:
            if has_historical_image:
                content += "\n[Image omitted because current task does not require vision]"
            messages.append({"role": msg.role, "content": content})

    enforced_user_prompt = (
        f"{request.message}\n\n"
        "IMPORTANT: Regenerate the COMPLETE 'index.html' and 'style.css' files. "
        "Do not just show the diffs. The preview will break if you don't provide the full code."
    )
    
    user_content = [{"type": "text", "text": enforced_user_prompt}]
    
    if requires_vision:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": request.attachment.data}
        })
        
    messages.append({"role": "user", "content": user_content})

    # 4. The Traffic Cop: Route the request to the correct brain
    if requires_vision:
        # Send to OpenAI
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=4000,
            temperature=0.7
        )
        used_brain = "gpt-4o"
    else:
        # Send to DeepSeek
        response = deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            max_tokens=8000,
            temperature=0.7
        )
        used_brain = "deepseek-chat"

    reply = response.choices[0].message.content

    if "```mermaid" in reply:
        state.phase = ProjectPhase.ARCHITECTURE
    elif "```" in reply:
        state.phase = ProjectPhase.CODING

    return {
        "reply": reply,
        "updated_state": state,
        "model_used": used_brain
    }