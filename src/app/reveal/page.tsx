import { routeMetadata } from "@/lib/metadata";
import { RevealExperience } from "@/features/result/reveal-experience";
import "@/styles/result.css";

export const metadata = routeMetadata("出厂设置揭晓", "/reveal", true);

export default function RevealPage() {
  return <RevealExperience />;
}
