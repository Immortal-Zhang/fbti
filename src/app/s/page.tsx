import { routeMetadata } from "@/lib/metadata";
import { PublicReportExperience } from "@/features/sharing/share-experience";
import "@/styles/release.css";
export const metadata = routeMetadata("公开出厂摘要", "/s", true);
export default function PublicPage() {
  return <PublicReportExperience />;
}
