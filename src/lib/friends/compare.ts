import { DIMENSIONS } from "@/data/dimensions";
import { DIMENSION_IDS, type DimensionId, type Scores } from "@/lib/domain";
import { validateScores } from "@/lib/scoring";
import { publicIdentity } from "@/lib/sharing/snapshot";

const INCIDENTS: Record<
  DimensionId,
  { title: string; more: string; less: string; repair: string }
> = {
  energy: {
    title: "供电地址疑似填反",
    more: "你给电池留了私人插座，朋友却在它旁边画了一张饭桌。",
    less: "你把相处列进充电方案，朋友却给你预留了一间安静休息室。",
    repair: "下次散场直接问：还想一起坐坐，还是先给你一段独处时间？",
  },
  expression: {
    title: "机身字幕存在时差",
    more: "自评部门还在整理内部文件，朋友的收音设备已经开始录节目。",
    less: "你觉得心情已经播出，朋友那边却还在等第一行字幕。",
    repair: "试着补一句：我现在更想被听见，还是先让我整理一下？",
  },
  navigation: {
    title: "路线图与实况不符",
    more: "你交的是行程单，朋友收到的像一张可随时拐弯的藏宝图。",
    less: "你说路线随缘，朋友却觉得你的随缘已经提前排好了班。",
    repair: "出门前约好哪些事先定，哪些地方可以现场变更。",
  },
  connection: {
    title: "握手速度发生争议",
    more: "你还在办理关系试用手续，朋友觉得你早已递出了熟人通行证。",
    less: "你以为已经接上新频道，朋友觉得这台设备仍在缓慢调频。",
    repair: "把客气和熟悉分开聊，问问彼此通常需要几次相处。",
  },
};

export function compareObservations(self: Scores, observer: Scores) {
  validateScores(self);
  validateScores(observer);
  const dimensions = DIMENSIONS.map((dimension) => ({
    ...dimension,
    self: self[dimension.id],
    observer: observer[dimension.id],
    delta: observer[dimension.id] - self[dimension.id],
    gap: Math.abs(observer[dimension.id] - self[dimension.id]),
  }));
  // Fixed axis order breaks ties. This is coordinate agreement, never relationship quality.
  const ranked = [...dimensions].sort(
    (a, b) =>
      b.gap - a.gap ||
      DIMENSION_IDS.indexOf(a.id) - DIMENSION_IDS.indexOf(b.id),
  );
  const biggest = ranked[0];
  const closest = [...dimensions].sort(
    (a, b) =>
      a.gap - b.gap ||
      DIMENSION_IDS.indexOf(a.id) - DIMENSION_IDS.indexOf(b.id),
  )[0];
  const synchronization =
    Math.round((100 - dimensions.reduce((sum, d) => sum + d.gap, 0) / 4) * 10) /
    10;
  const incident = INCIDENTS[biggest.id];
  const aligned = biggest.gap === 0;
  const mild = biggest.gap < 25;
  const opposite =
    (biggest.self < 40 && biggest.observer > 60) ||
    (biggest.self > 60 && biggest.observer < 40);
  const relative: Record<DimensionId, [string, string]> = {
    energy: [
      "朋友给你的供电方案，多接了几张人类座位。自评部门表示还得看当天电量。",
      "朋友从你的充电站搬走了几张椅子，给安静多留了一点插座。",
    ],
    expression: [
      "朋友那边收到的机身字幕，比你以为的还要及时。厂家决定先检查两边的播出表。",
      "在朋友那份说明书里，机身字幕比自评晚开播了一会儿。双方正在校准台词时差。",
    ],
    navigation: [
      "朋友画的路线图比你那张多了几个岔口。本人声明：并非所有拐弯都写进自述。",
      "朋友在路线图上多画了几根直线，还顺手给转弯标了时间。",
    ],
    connection: [
      "朋友把你的熟络按钮调得更快，厂家正在核对客气和熟悉是否用了同一个插口。",
      "朋友那张图纸上，握手手续比你自己写的多了两道。",
    ],
  };
  return {
    version: "compare-1" as const,
    self: publicIdentity(self),
    observer: publicIdentity(observer),
    dimensions,
    synchronization,
    biggest,
    closest,
    title: aligned
      ? "两份图纸暂未打架"
      : mild
        ? "图纸出现轻微错位"
        : incident.title,
    code: aligned
      ? "OBS-000"
      : `OBS-${String(DIMENSION_IDS.indexOf(biggest.id) + 1).padStart(2, "0")}-${biggest.delta > 0 ? "UP" : "DOWN"}`,
    summary: aligned
      ? "八份旁观记录与二十份自述落在同一组坐标。厂家第一次有点插不上话。"
      : mild
        ? "两份图纸大体对得上，边角仍有一点各自的画法。暂不需要拆机，聊天即可。"
        : opposite
          ? biggest.delta > 0
            ? incident.more
            : incident.less
          : relative[biggest.id][biggest.delta > 0 ? 0 : 1],
    repair: aligned
      ? "相同坐标不代表所有场景都一样，下次遇到具体小事，仍然可以直接问本人。"
      : incident.repair,
    closestLabel: closest.gap <= 15 ? "较一致之处" : "相对接近",
    closestText:
      closest.gap === 0
        ? `${closest.name}的坐标完全相同。这一页的两位记录员用了同一把尺子。`
        : closest.gap <= 15
          ? `最接近的是${closest.name}，相差${closest.gap}分。这一页的两位记录员暂时没有互相退稿。`
          : `差异最小的是${closest.name}，仍相差${closest.gap}分。本次没有很接近的坐标，厂家不强行安排默契。`,
    disclaimer:
      "同步率只表示这两组坐标的接近程度，不衡量友情、准确率或谁更了解谁。两台设备都是邀请者的不同视角。",
  };
}
