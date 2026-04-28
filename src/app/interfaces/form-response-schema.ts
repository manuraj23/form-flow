export interface FormResponseData {
  responseId: string;
  form: any;
  response: Record<string, any>;
  submittedAt: Date;
  submittedBy: string;
  score: number; // must exist
  username : string;
}