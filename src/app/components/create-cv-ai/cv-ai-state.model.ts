import { AiCvContent} from '../../models/cv-content.model';

export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
}

export interface CvAiState {
  currentStructure: AiCvContent | null; // ZMIANA: tutaj trzymamy dane z AI
  previousStructure: AiCvContent | null;
  chatHistory: ChatMessage[];
  status: 'idle' | 'generating' | 'reviewing' | 'accepted';
}
