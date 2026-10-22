import { routeMetadata } from "@/lib/metadata";
import { InviteExperience } from "@/features/friends/invite-experience";
import "@/styles/release.css";
export const metadata = routeMetadata("邀请朋友观察", "/invite", true);
export default function InvitePage() {
  return <InviteExperience />;
}
