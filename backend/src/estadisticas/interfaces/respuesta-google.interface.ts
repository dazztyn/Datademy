
export interface TextAnswerDetail 
{
  value: string;
}

export interface TextAnswers 
{
  answers: TextAnswerDetail[];
}

export interface AnswerItem 
{
  textAnswers: TextAnswers;
}

export interface GoogleFormRespuesta 
{
  responseId: string;
  createTime?: string;
  answers: Record<string, AnswerItem>; 
}