import { routeMetadata } from "@/lib/metadata";
import { ShareExperience } from "@/features/sharing/share-experience";
import "@/styles/release.css";
export const metadata = routeMetadata("档案印制室", "/share", true);
export default function SharePage() {
  return <ShareExperience />;
}
