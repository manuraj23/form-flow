export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  type: string;       // "question" | "form" | "error"
  message: string;
  sessionId: string;
  formId?: string;
  complete: boolean;
}
