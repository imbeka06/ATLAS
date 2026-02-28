import os
from dotenv import load_dotenv
from openai import OpenAI
from .models import ProjectState, ProjectPhase, UserRequest

load_dotenv()

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "missing_key"),
    base_url="https://api.deepseek.com"
)

openai_client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "missing_key")
)

def analyze_intent_and_respond(request: UserRequest) -> dict:
    state = request.current_state
    requires_vision = request.attachment and request.attachment.type.startswith('image/')
    
    # SMARTER SYSTEM PROMPT
    # SMARTER SYSTEM PROMPT
    system_prompt = (
        "You are ATLAS, an elite AI Solutions Architect. "
        "Every response MUST strictly follow this EXACT 4-part structure:\n\n"
        "## 1. SRS Documentation\n"
        "(Write a formal, static Software Requirements Specification.)\n\n"
        "## 2. Architecture Diagrams\n"
        "(Provide ERDs, DFDs, or flowcharts using ONLY Mermaid JS: ```mermaid...```)\n\n"
        "## 3. Step-by-Step Explanation\n"
        "(Provide a highly detailed step-by-step tutorial including terminal commands, execution order, and rationale.)\n\n"
        "## 4. Implementation\n"
        "(Provide FULL code files formatted EXACTLY as: **`filename.ext`** followed by the code block. "
        "CRITICAL: Adapt to the project type! If it is a Web UI, output full index.html and style.css. "
        "REACT RULE: If building a React app, NEVER use create-react-app or react-scripts. Either use Vite, or build it in a single index.html using React/Babel CDNs for instant loading. "
        "If it is a Backend/Python/API project, ONLY output the relevant backend files like main.py, requirements.txt, etc. Do not invent random HTML files if the user didn't ask for a web interface.)"
        "CRITICAL SMART UPDATES: If the user is asking for a change or fix to an existing project, ONLY output the specific files that are changing. Do NOT rewrite files that remain exactly the same. The system will automatically merge your updated files with the existing codebase.)"
    )

    messages = [{"role": "system", "content": system_prompt}]
    recent_history = state.history[-6:]

    for msg in recent_history:
        content = str(msg.content)
        if len(content) > 1500:
            content = content[:1500] + "\n\n...[Old Code Truncated]..."
            
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

    # SMARTER ENFORCER PROMPT
    enforced_user_prompt = (
        f"{request.message}\n\n"
        "IMPORTANT: You MUST generate all 4 sections. Under Implementation, provide COMPLETE files, not snippets. "
        "If building a frontend, ensure the complete HTML/CSS is present. If building a backend, only provide backend code."
    )
    
    user_content = [{"type": "text", "text": enforced_user_prompt}]
    
    if requires_vision:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": request.attachment.data}
        })
        
    messages.append({"role": "user", "content": user_content})

    if requires_vision:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=4000,
            temperature=0.7
        )
        used_brain = "gpt-4o"
    else:
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