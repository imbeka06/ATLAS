import axios from 'axios';

const API_URL = 'http://localhost:8000';

export type ProjectState = {
  name: string;
  phase: 'discovery' | 'architecture' | 'coding';
  tech_stack: string[];
  history: { role: string; content: string }[];
};

export type AIResponse = {
  reply: string;
  updated_state: ProjectState;
  model_used: string; 
};

export const sendMessage = async (message: string, currentState: ProjectState) => {
  const response = await axios.post<AIResponse>(`${API_URL}/chat`, {
    project_id: "demo-1",
    message,
    current_state: currentState
  });
  return response.data;
};