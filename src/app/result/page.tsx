import { routeMetadata } from "@/lib/metadata";
import { ResultExperience } from "@/features/result/result-experience";
import "@/styles/result.css";
import "@/styles/personal-manual.css";

export const metadata = routeMetadata("我的完整说明书", "/result", true);

export default function ResultPage() {
  return <ResultExperience />;
}
