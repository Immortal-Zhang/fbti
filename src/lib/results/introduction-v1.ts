import { DIMENSIONS } from "@/data/dimensions";
import type { PersonalityType, ScoredResult } from "@/lib/domain";

/** A catalogue index must never turn a middle score into an extreme claim. */
export function getResultIntroduction(
  result: ScoredResult,
  device: PersonalityType,
) {
  const middle = DIMENSIONS.filter(
    ({ id }) => result.readings[id].band === "middle",
  );
  if (middle.length === 0) {
    return {
      description: device.description,
      tags: [...device.tags],
      balanced: false,
    };
  }
  const distinct = DIMENSIONS.filter(
    ({ id }) => result.readings[id].band !== "middle",
  )
    .sort(
      (a, b) =>
        result.readings[b.id].intensity - result.readings[a.id].intensity,
    )
    .map(({ id, lowLabel, highLabel }) =>
      result.scores[id] < 50 ? lowLabel : highLabel,
    );
  return {
    description:
      middle.length === 4
        ? "四条坐标都留在中间带：可以认真安排，也可以跟着生活切换模式。"
        : `${middle.map(({ name }) => name).join("、")}保留切换余地；你的设置，不必每次都一样。`,
    tags: [...distinct.slice(0, 2), "弹性模式", "保留余地", "随场景调整"].slice(
      0,
      3,
    ),
    balanced: true,
  };
}

