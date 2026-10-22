import type { DimensionId, PersonalityType, ScoredResult, TypeKey } from "@/lib/domain";

/** Report prose has its own version. The confirmed hum-1 scoring stays unchanged. */
export const PERSONAL_MANUAL_VERSION = "pm-2" as const;
export type PersonalManualVersion = "pm-1" | typeof PERSONAL_MANUAL_VERSION;
export const CHAPTER_IDS = ["identity", "factory", "charging", "faults", "prohibited", "hidden", "warning", "social", "environment", "reboot", "compatibility", "easterEgg", "warranty"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

export const CHAPTER_DEFINITIONS = [
  { id: "identity", title: "产品身份", shortTitle: "身份", subtitle: "出厂设置审查部：找到本人了", slots: ["identity.description"] },
  { id: "factory", title: "出厂设置", shortTitle: "设置", subtitle: "旋钮都在，厂家只是不知道谁拧的", slots: ["factory.energy", "factory.expression", "factory.navigation", "factory.connection"] },
  { id: "charging", title: "充电方式", shortTitle: "充电", subtitle: "友情供电局提醒：别接错插座", slots: ["charging.method", "charging.drain", "charging.signal", "charging.tip"] },
  { id: "faults", title: "故障表现", shortTitle: "故障", subtitle: "维修科已受理，暂未理解", slots: ["faults.navigation", "faults.expression", "faults.connection"] },
  { id: "prohibited", title: "禁止操作", shortTitle: "禁忌", subtitle: "请勿替厂家验证这些离谱设计", slots: ["prohibited.boundary", "prohibited.decisions"] },
  { id: "hidden", title: "隐藏功能", shortTitle: "隐藏", subtitle: "研发部拒绝署名，但功能确实存在", slots: ["hidden.practice", "hidden.connection"] },
  { id: "warning", title: "情绪预警系统", shortTitle: "预警", subtitle: "不是诊断，是机身冒出的日常小纸条", slots: ["warning.normal", "warning.mild", "warning.low", "warning.recovery"] },
  { id: "social", title: "社交连接指南", shortTitle: "连接", subtitle: "请先阅读，再伸手戳这台人类", slots: ["social.start", "social.response", "social.boundary"] },
  { id: "environment", title: "最佳运行环境", shortTitle: "环境", subtitle: "生存环境部：人不一定非得耐造", slots: ["environment.pace", "environment.talk", "environment.balance"] },
  { id: "reboot", title: "紧急重启指南", shortTitle: "重启", subtitle: "先别拆人生，拆开一顿饭也行", slots: ["reboot.pause", "reboot.offload", "reboot.restore", "reboot.resume"] },
  { id: "compatibility", title: "兼容性说明", shortTitle: "兼容", subtitle: "接口可以协商，别拿型号当通缉令", slots: ["compatibility.gift", "compatibility.friction", "compatibility.agreement"] },
  { id: "easterEgg", title: "出厂彩蛋", shortTitle: "彩蛋", subtitle: "研发部夹带的私人零件", slots: ["easterEgg.signature", "easterEgg.habit"] },
  { id: "warranty", title: "终身保修说明", shortTitle: "保修", subtitle: "凭本人即可，不必出示优秀人类证书", slots: ["warranty.promise", "warranty.care"] },
] as const;
export type EntrySlot = (typeof CHAPTER_DEFINITIONS)[number]["slots"][number];
export type RuleSlot = Exclude<EntrySlot, "identity.description" | "easterEgg.signature" | "warranty.promise">;

export interface ScorePredicate { dimension: DimensionId; min: number; max: number }
/** Value is normalized for direction (reverse question is inverted exactly once). */
export interface AnswerPredicate { questionId: string; min: number; max: number }
export interface RuleCondition {
  scores?: readonly ScorePredicate[];
  answers?: readonly AnswerPredicate[];
  typeKey?: TypeKey;
}
export interface ManualCopyRule {
  id: string;
  slot: RuleSlot;
  label: string;
  text: string;
  when: RuleCondition;
  priority: number;
  /** Semantic topic, not an arbitrary unique token. Shared topics cannot repeat. */
  topic: string;
  /** Explicit incompatible rule IDs or claim tags, used by the conflict filter. */
  conflicts?: readonly string[];
  claims?: readonly string[];
}
export interface ManualModelProfile {
  key: TypeKey;
  signature: string;
  warranty: string;
}
export interface SelectionTrace {
  ruleId: string;
  topic: string;
  conditions: RuleCondition;
  claims: readonly string[];
}
export interface PersonalEntry {
  id: EntrySlot;
  label: string;
  text: string;
  source: SelectionTrace;
}
export interface PersonalChapter {
  id: ChapterId;
  number: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  entries: readonly PersonalEntry[];
}
export interface PersonalManual {
  version: PersonalManualVersion;
  scoringVersion: ScoredResult["version"];
  /** Stable exact encoding of the canonical 20 answers, not a random or secure ID. */
  serial: string;
  result: ScoredResult;
  device: PersonalityType;
  introduction: string;
  keywords: readonly string[];
  certification: { mark: string; label: string; disclaimer: string };
  chapters: readonly PersonalChapter[];
}
