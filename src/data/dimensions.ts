import type { Dimension } from "@/lib/domain";

/** Original entertainment axes. High/low are positions, never better/worse. */
export const DIMENSIONS: readonly Dimension[] = [
  {
    id: "energy",
    index: "01",
    name: "续航接口",
    lowLabel: "独处回血",
    highLabel: "互动回血",
    color: "#3160F4",
    description:
      "电量见底时，你更想关上门，还是找人一起把日子聊亮？它描述恢复方式，不评价社交能力。",
  },
  {
    id: "expression",
    index: "02",
    name: "情绪输出",
    lowLabel: "内部缓存",
    highLabel: "实时表达",
    color: "#E37D50",
    description:
      "心里有了动静，是先留在内部整理，还是很快让对方知道？安静不代表没有感受。",
  },
  {
    id: "navigation",
    index: "03",
    name: "行动导航",
    lowLabel: "预设路线",
    highLabel: "灵感导航",
    color: "#79934B",
    description:
      "面对可以自己安排的日常，你偏向先定路径，还是跟着现场的新线索走？两边都能抵达。",
  },
  {
    id: "connection",
    index: "04",
    name: "关系握手",
    lowLabel: "慢热防护",
    highLabel: "快速连接",
    color: "#A280BC",
    description:
      "一段新关系出现时，你需要多少次接触才愿意靠近？这与喜欢独处或热闹是两回事。",
  },
];
