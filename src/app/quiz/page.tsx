import { routeMetadata } from "@/lib/metadata";
import { QuizExperience } from "@/features/quiz/quiz-experience";
import "@/styles/quiz.css";

export const metadata = routeMetadata("检测你的出厂设置", "/quiz", true);

export default function QuizPage() {
  return <QuizExperience />;
}
