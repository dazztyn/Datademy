
export interface OpcionLikert 
{
  value: string;
}

export interface ChoiceQuestion 
{
  options: OpcionLikert[];
}

export interface Question 
{
  questionId: string;
  choiceQuestion?: ChoiceQuestion;
}

export interface QuestionItem 
{
  question: Question;
}

export interface FormItem 
{
  title?: string;
  pageBreakItem?: Record<string, never>;
  questionItem?: QuestionItem;
}

export interface GoogleFormDiseno 
{
  items?: FormItem[];
}