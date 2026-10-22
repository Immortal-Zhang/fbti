import { routeMetadata } from "@/lib/metadata";
import { FriendExperience } from "@/features/friends/friend-experience";
import "@/styles/quiz.css";
import "@/styles/release.css";
export const metadata = routeMetadata(
  "你真的了解这台人类设备吗",
  "/friends",
  true,
);
export default function FriendPage() {
  return <FriendExperience />;
}
