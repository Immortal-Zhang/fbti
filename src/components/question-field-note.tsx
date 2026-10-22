import { questionFieldNote } from "@/data/creative/question-notes";

export function QuestionFieldNote({ questionId }: { questionId: string }) {
  const note = questionFieldNote(questionId);
  if (!note) return null;
  return (
    <p className="field-observation" data-question-field-note={questionId}>
      <span>观察员旁注</span>
      {note}
    </p>
  );
}
