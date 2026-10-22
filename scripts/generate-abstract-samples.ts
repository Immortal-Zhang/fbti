import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { it, expect } from "vitest";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { ABSTRACT_COPY_RULES as PERSONAL_COPY_RULES } from "@/data/creative";
import { DIMENSION_IDS, type Answer, type Scores } from "@/lib/domain";
import { generatePersonalManual } from "@/lib/personal-manual/generate";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";

function trajectory(values: readonly number[]): Answer[] {
  const position = { energy: 0, expression: 0, navigation: 0, connection: 0 };
  return SELF_QUESTIONS.map((question) => {
    const value = values[position[question.dimension]++];
    return { questionId: question.id, optionId: question.options.find((option) => option.value === (question.reverse ? 4 - value : value))!.id };
  });
}

it("writes explicit fictional sample reports for human editorial review", () => {
  const directory = fileURLToPath(new URL("../docs/qa/abstract-copy/samples/", import.meta.url));
  mkdirSync(directory, { recursive: true });
  const fixtures = [
    ...PERSONALITY_TYPES.map((device) => ({ id: device.id, label: `${device.name} · 25/75 型号代表`, answers: sampleAnswers(sampleScores(device.key)) })),
    ...[0, 40, 50, 60, 100].map((value) => ({ id: `boundary-${value}`, label: `四维 ${value} 分边界`, answers: sampleAnswers(Object.fromEntries(DIMENSION_IDS.map((id) => [id, value])) as Scores) })),
    { id: "trajectory-even", label: "同分轨迹 A · 每维 [2,2,2,2,2]", answers: trajectory([2, 2, 2, 2, 2]) },
    { id: "trajectory-varied", label: "同分轨迹 B · 每维 [0,4,0,4,2]", answers: trajectory([0, 4, 0, 4, 2]) },
  ];
  const index = fixtures.map((fixture) => {
    const manual = generatePersonalManual(fixture.answers, "pm-2");
    expect(manual.chapters).toHaveLength(13);
    expect(manual.chapters.flatMap(({ entries }) => entries)).toHaveLength(37);
    const artifact = { fixture: { id: fixture.id, label: fixture.label, fictional: true }, answers: fixture.answers, manual };
    writeFileSync(`${directory}${fixture.id}.json`, `${JSON.stringify(artifact, null, 2)}\n`);
    const paragraphs = [
      `# ${fixture.label}`,
      "此报告来自明确构造的虚构回答，用于检查覆盖、个性化与文案。不是用户画像，也不是科学测量结果。",
      `设备：${manual.device.name}（${manual.device.id}） · 型号索引 ${manual.result.typeKey} · ${manual.serial}`,
      `版本：说明书 ${manual.version} / 评分 ${manual.scoringVersion}；四维分数：${JSON.stringify(manual.result.scores)}`,
      `关键词：${manual.keywords.join(" / ")}`,
      `主题颜色：${manual.device.color} / ${manual.device.ink}；原创设备形态：${manual.device.shape}`,
      `认证标识：${manual.certification.mark} · ${manual.certification.label}。${manual.certification.disclaimer}`,
      ...manual.chapters.flatMap((chapter) => [
        `## ${chapter.number} ${chapter.title}`,
        chapter.subtitle,
        ...chapter.entries.flatMap((entry) => [
          `### ${entry.label}`,
          entry.text,
          `来源：\`${entry.source.ruleId}\`；语义主题：\`${entry.source.topic}\`；匹配条件：\`${JSON.stringify(entry.source.conditions)}\`；声明：\`${JSON.stringify(entry.source.claims)}\`。`,
        ]),
      ]),
      "## 原始样例回答",
      "```json\n" + JSON.stringify(fixture.answers, null, 2) + "\n```",
    ];
    writeFileSync(`${directory}${fixture.id}.md`, `${paragraphs.join("\n\n")}\n`);
    return { id: fixture.id, label: fixture.label, typeKey: manual.result.typeKey, scores: manual.result.scores, serial: manual.serial, chapters: manual.chapters.length, entries: 37 };
  });
  const changedChapters = (first: Answer[], second: Answer[]) => {
    const a = generatePersonalManual(first, "pm-2");
    const b = generatePersonalManual(second, "pm-2");
    return a.chapters.filter((chapter, index) => chapter.entries.some((entry, position) => entry.text !== b.chapters[index].entries[position].text)).map(({ id }) => id);
  };
  writeFileSync(`${directory}engine-summary.json`, `${JSON.stringify({
    scoringVersion: "hum-1",
    manualVersion: "pm-2",
    ruleCount: PERSONAL_COPY_RULES.length,
    answerRuleCount: PERSONAL_COPY_RULES.filter(({ when }) => when.answers?.length).length,
    multiScoreRuleCount: PERSONAL_COPY_RULES.filter(({ when }) => (when.scores?.length || 0) > 1).length,
    modelStrengthChanges: PERSONALITY_TYPES.map((device) => ({
      id: device.id,
      typeKey: device.key,
      scores: "35/65 → 0/100, preserving all four type bits",
      changedChapters: changedChapters(
        sampleAnswers(Object.fromEntries(DIMENSION_IDS.map((id, position) => [id, device.key[position] === "0" ? 35 : 65])) as Scores),
        sampleAnswers(Object.fromEntries(DIMENSION_IDS.map((id, position) => [id, device.key[position] === "0" ? 0 : 100])) as Scores),
      ),
    })),
    sameScoreTrajectoryChanges: changedChapters(trajectory([2, 2, 2, 2, 2]), trajectory([0, 4, 0, 4, 2])),
  }, null, 2)}\n`);
  writeFileSync(`${directory}index.json`, `${JSON.stringify(index, null, 2)}\n`);
  writeFileSync(`${directory}README.md`, [
    "# 抽象人类观察计划 · 完整样例报告",
    "包含 16 个型号代表（每个维度 25/75 分）、5 个连续分数边界案例、2 个同分不同回答轨迹案例，共 23 份完整报告。每份保留 20 条原始答案、真实评分、13 章 37 条内容及逐条规则来源。",
    "样例是明确构造的虚构数据。JSON 用于复核，Markdown 用于逐份人工阅读；运行脚本本身不等于完成人工审阅，审阅记录由阶段 QA 文档单独记录。",
    "重新生成：`PATH=/opt/homebrew/bin:$PATH npx vitest run --config scripts/abstract-copy.config.ts`。普通 `npm test` 不运行写文件任务。",
    [
      "| 样例 | 型号索引 | 四维分数（能量 / 表达 / 导航 / 连接） | 完整文件 |",
      "| --- | --- | --- | --- |",
      ...index.map((item) => `| ${item.label} | ${item.typeKey} | ${DIMENSION_IDS.map((id) => item.scores[id]).join(" / ")} | [阅读](${item.id}.md) · [JSON](${item.id}.json) |`),
    ].join("\n"),
    "",
  ].join("\n\n"));
});
