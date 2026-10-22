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
        ? "四条坐标都留在中间带：四个部门轮流值班，厂家暂时没收回任何一把钥匙。"
        : `${middle.map(({ name }) => name).join("、")}仍在轮班；这里没有终身岗位，谁上场得看今天的具体情况。`,
    tags: [...distinct.slice(0, 2), "弹性模式", "保留余地", "随场景调整"].slice(
      0,
      3,
    ),
    balanced: true,
  };
}

