import type { PersonalChapter } from "@/lib/personal-manual/schema";

export const LEGACY_CHAPTER_META: readonly Pick<PersonalChapter, "id" | "title" | "shortTitle" | "subtitle">[] = [
  {
    "id": "identity",
    "title": "产品身份",
    "shortTitle": "身份",
    "subtitle": "非标准件，也有专属档案"
  },
  {
    "id": "factory",
    "title": "出厂设置",
    "shortTitle": "设置",
    "subtitle": "刻度比标签，多说一点"
  },
  {
    "id": "charging",
    "title": "充电方式",
    "shortTitle": "充电",
    "subtitle": "电量是自己的，不必一直满格"
  },
  {
    "id": "faults",
    "title": "故障表现",
    "shortTitle": "故障",
    "subtitle": "一些偶发的小卡顿，并非设备报废"
  },
  {
    "id": "prohibited",
    "title": "禁止操作",
    "shortTitle": "禁忌",
    "subtitle": "请勿强行按下这些按钮"
  },
  {
    "id": "hidden",
    "title": "隐藏功能",
    "shortTitle": "隐藏",
    "subtitle": "平时不声张，关键时候很有用"
  },
  {
    "id": "warning",
    "title": "情绪预警系统",
    "shortTitle": "预警",
    "subtitle": "留意日常信号，给自己一点缓冲"
  },
  {
    "id": "social",
    "title": "社交连接指南",
    "shortTitle": "连接",
    "subtitle": "这一页，可以留给在意你的人"
  },
  {
    "id": "environment",
    "title": "最佳运行环境",
    "shortTitle": "环境",
    "subtitle": "把日子调成比较舒服的频率"
  },
  {
    "id": "reboot",
    "title": "紧急重启指南",
    "shortTitle": "重启",
    "subtitle": "一次只修一件小事"
  },
  {
    "id": "compatibility",
    "title": "兼容性说明",
    "shortTitle": "兼容",
    "subtitle": "关系靠协商，型号不决定答案"
  },
  {
    "id": "easterEgg",
    "title": "出厂彩蛋",
    "shortTitle": "彩蛋",
    "subtitle": "在说明书的小字里，发现一点自己"
  },
  {
    "id": "warranty",
    "title": "终身保修说明",
    "shortTitle": "保修",
    "subtitle": "无需提交一直表现良好的证明"
  }
];
