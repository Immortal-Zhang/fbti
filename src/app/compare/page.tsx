import { routeMetadata } from "@/lib/metadata";
import { ComparisonExperience } from "@/features/friends/comparison-experience";
import "@/styles/release.css";
export const metadata = routeMetadata("双视角观察与事故报告", "/compare", true);
export default function ComparePage() {
  return <ComparisonExperience />;
}
