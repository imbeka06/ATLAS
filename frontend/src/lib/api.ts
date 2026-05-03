import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export type Attachment = {
  name: string;
  data: string;
  type: string;
};

export type Message = {
  role: string;
  content: string;
  attachment?: Attachment;
};

export type ProjectState = {
  id: string;
  name: string;
  phase: 'discovery' | 'architecture' | 'coding';
  tech_stack: string[];
  history: Message[];
};

export type AIResponse = {
  reply: string;
  updated_state: ProjectState;
  model_used: string; 
};

export const sendMessage = async (message: string, currentState: ProjectState, attachment?: Attachment) => {
  const response = await axios.post<AIResponse>(`${API_URL}/chat`, {
    project_id: currentState.id,
    message,
    current_state: currentState,
    attachment
  });
  return response.data;
};