/** Flavor accompanies, and never replaces, the exact answered count. */
export function quizProgressLine(answered: number): string {
  if (answered < 5) return "请按本人作答，厂家不接受理想型代检。";
  if (answered < 10) return "已找到几颗可疑螺丝。先别认领，继续答题。";
  if (answered < 15) return "检测过半。工程师的眉头已经有了自己的工位。";
  return "快查完了。厂家正在研究如何礼貌地说“原来如此”。";
}
