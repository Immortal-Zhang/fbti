import type {
  CopyCondition,
  CopyRule,
  DimensionId,
  ManualSectionId,
} from "../../lib/domain";

export const SECTION_LABELS: Record<ManualSectionId, string> = {
  charging: "充电方式",
  malfunction: "故障表现",
  prohibited: "禁止操作",
  hidden: "隐藏功能",
  warning: "情绪预警",
  social: "社交使用指南",
  environment: "最佳运行环境",
  reboot: "紧急重启",
  easterEgg: "出厂彩蛋",
  warranty: "保修说明",
};

const at = (
  dimension: DimensionId,
  min: number,
  max: number,
): CopyCondition => ({ dimension, min, max });
const rule = (
  id: string,
  section: ManualSectionId,
  conditions: readonly CopyCondition[],
  topic: string,
  variants: readonly string[],
  priority = 20,
): CopyRule => ({ id, section, conditions, topic, variants, priority });

/**
 * Priority 0: unconditional fallback. 20: tendency. 30: middle band (wins at
 * 40/60). 40: strong tendency. 60: cross-dimension interaction.
 * Rules are authored as compatible alternatives, never assembled fragments.
 */
export const COPY_RULES: readonly CopyRule[] = [
  // CHARGING: how to replenish energy, not the room or the social relationship.
  rule(
    "charge-default",
    "charging",
    [],
    "replenishment",
    [
      "先把日程里的一个空格留给自己。空白也能供电。",
      "挑一件今天不必做好的小事，让电量慢慢回来。",
    ],
    0,
  ),
  rule("charge-low", "charging", [at("energy", 0, 40)], "replenishment", [
    "给自己一段不用接话的时间。连“嗯嗯”也可以暂时下班。",
    "一顿不用找话题的饭，往往比一条打气消息更管用。",
  ]),
  rule(
    "charge-middle",
    "charging",
    [at("energy", 40, 60)],
    "replenishment",
    [
      "先安静一会儿，再找个人说说话；顺序可以按当天电量调。",
      "单人模式和双人模式轮流用，不必给自己办永久套餐。",
    ],
    30,
  ),
  rule("charge-high", "charging", [at("energy", 60, 100)], "replenishment", [
    "找人一起做点没什么大意义的事。快乐有时候需要共同签收。",
    "约一场不赶时间的散步，话题走到哪里，电就充到哪里。",
  ]),
  rule(
    "charge-low-strong",
    "charging",
    [at("energy", 0, 20)],
    "replenishment",
    [
      "建议每天预留一小段“无人提问时段”。本设备正在给自己回电。",
      "结束一场热闹后，请附赠一段单人返程。路上无需继续营业。",
    ],
    40,
  ),
  rule(
    "charge-high-strong",
    "charging",
    [at("energy", 80, 100)],
    "replenishment",
    [
      "电量下降时，优先寻找一起笑的人。笑声比待机更适合你。",
      "把“改天见”换成一个具体时间，共享一点日常就是电源。",
    ],
    40,
  ),
  rule(
    "charge-outgoing-slow",
    "charging",
    [at("energy", 61, 100), at("connection", 0, 39)],
    "replenishment",
    [
      "熟人局是快充，新人局可能还要转接头。选对人再插电。",
      "需要人气，但最好是熟悉的人气。一顿老朋友的饭刚刚好。",
    ],
    60,
  ),

  // MALFUNCTION: observable operation quirks, not diagnoses.
  rule(
    "fault-default",
    "malfunction",
    [],
    "task-friction",
    [
      "事情一多，连打开备忘录都可能忘记自己要记什么。",
      "偶尔出现“明明没闲着，但进度条没动”的小卡顿。",
    ],
    0,
  ),
  rule(
    "fault-route",
    "malfunction",
    [at("navigation", 0, 40)],
    "task-friction",
    [
      "计划临时加一行，脑内所有表格都要重新对齐。",
      "明明只是改个时间，却忍不住连备用方案也重新计算。",
    ],
  ),
  rule(
    "fault-route-strong",
    "malfunction",
    [at("navigation", 0, 20)],
    "task-friction",
    [
      "遇到“到时候再说”，系统会追问：到哪个时候，怎么说？",
      "小小的行程变动，也可能触发一次全盘重新排版。",
    ],
    40,
  ),
  rule(
    "fault-middle",
    "malfunction",
    [at("navigation", 40, 60)],
    "task-friction",
    [
      "计划和临场发挥偶尔同时抢方向盘，需要先选一个驾驶员。",
      "有时纠结的是：按计划轻松，还是改计划有趣。",
    ],
    30,
  ),
  rule(
    "fault-spark",
    "malfunction",
    [at("navigation", 60, 100)],
    "task-friction",
    [
      "临时发现一条好玩的岔路，原任务便礼貌地排到后面。",
      "点子长得比待办快，容易同时打开几个还不错的开头。",
    ],
  ),
  rule(
    "fault-spark-strong",
    "malfunction",
    [at("navigation", 80, 100)],
    "task-friction",
    [
      "去做一件事，沿途捡回三件新事；出发目标还在原地招手。",
      "“就试一下”有时会自动续播成一个新项目。",
    ],
    40,
  ),
  rule(
    "fault-private-planned",
    "malfunction",
    [at("navigation", 0, 39), at("expression", 0, 39)],
    "task-friction",
    [
      "计划已在脑内改到第三版，旁边的人还拿着第一版说明书。",
      "遇到变动先内部重排，外界容易误以为你已经完全接受。",
    ],
    60,
  ),

  // PROHIBITED: how not to rush or override the user's decisions.
  rule(
    "prohibit-default",
    "prohibited",
    [],
    "decision-autonomy",
    [
      "请勿用“大家都这样”替本设备按下确认键。",
      "不要把一次没发挥好，设置成永久的设备名称。",
    ],
    0,
  ),
  rule(
    "prohibit-private",
    "prohibited",
    [at("expression", 0, 40)],
    "decision-autonomy",
    [
      "请勿把安静当成同意。给一个明确的问题，再留一点回答空间。",
      "别在本设备还在组织语言时，替它宣布结论。",
    ],
  ),
  rule(
    "prohibit-middle",
    "prohibited",
    [at("expression", 40, 60)],
    "decision-autonomy",
    [
      "请勿拿昨天的反应，要求今天必须运行同一种回应模式。",
      "不要规定“你要么说出来，要么别想了”。缓冲过程也算运行。",
    ],
    30,
  ),
  rule(
    "prohibit-expressive",
    "prohibited",
    [at("expression", 60, 100)],
    "decision-autonomy",
    [
      "请勿把即时感受当成最后判决。说出来也可能是在整理。",
      "不要把一句当下的抱怨，自动翻译成一份正式退出申请。",
    ],
  ),
  rule(
    "prohibit-private-strong",
    "prohibited",
    [at("expression", 0, 20)],
    "decision-autonomy",
    [
      "请勿连续追问“所以你到底怎么想”。输入框正在编辑，不是没联网。",
      "别把没有立刻回复理解成拒绝，本设备习惯先存草稿。",
    ],
    40,
  ),
  rule(
    "prohibit-expressive-strong",
    "prohibited",
    [at("expression", 80, 100)],
    "decision-autonomy",
    [
      "请勿在话说到一半时点“结案”。下一句也许正是重点。",
      "不要要求每句话都像会议纪要一样定稿后才发布。",
    ],
    40,
  ),
  rule(
    "prohibit-slow-spontaneous",
    "prohibited",
    [at("connection", 0, 39), at("navigation", 61, 100)],
    "decision-autonomy",
    [
      "可以临时换目的地，但请先问问能不能临时多带三个人。",
      "愿意体验新东西，不等于愿意立刻向新朋友开放全部权限。",
    ],
    60,
  ),

  // HIDDEN: a strength in action, separately grounded from fault.
  rule(
    "hidden-default",
    "hidden",
    [],
    "useful-talent",
    [
      "能从自己的反应里发现线索，再慢慢调整下一次的用法。",
      "偶尔换一种处理方式，就能解锁一直没注意到的技能格。",
    ],
    0,
  ),
  rule("hidden-route", "hidden", [at("navigation", 0, 40)], "useful-talent", [
    "能把一个很大的“怎么办”，拆成几件今天能完成的小事。",
    "擅长为好主意装上轮子，让它真的走到下一步。",
  ]),
  rule(
    "hidden-middle",
    "hidden",
    [at("navigation", 40, 60)],
    "useful-talent",
    [
      "能先搭一座桥，再边走边改栏杆；保留方向，也留调整余地。",
      "既听得懂流程的语言，也能给新想法留一个插口。",
    ],
    30,
  ),
  rule("hidden-spark", "hidden", [at("navigation", 60, 100)], "useful-talent", [
    "当原方案走不通时，常能从旁边找到一扇没被注意的门。",
    "擅长把两个不相干的小发现，接成一个新办法。",
  ]),
  rule(
    "hidden-private-fast",
    "hidden",
    [at("expression", 0, 39), at("connection", 61, 100)],
    "useful-talent",
    [
      "能很快走近一个人，又不急着用自己的故事填满对方的空白。",
      "与人熟起来不难，同时还能给对方留一段完整的说话时间。",
    ],
    60,
  ),
  rule(
    "hidden-expressive-slow",
    "hidden",
    [at("expression", 61, 100), at("connection", 0, 39)],
    "useful-talent",
    [
      "信任一旦建立，就能把相处需求说明白，让熟人少做阅读理解。",
      "熟络需要时间，但熟络以后，边界和在意都能讲得清楚。",
    ],
    60,
  ),
  rule(
    "hidden-route-strong",
    "hidden",
    [at("navigation", 0, 20)],
    "useful-talent",
    [
      "你整理过的步骤，常常能成为别人第一次尝试时的扶手。",
      "别人还在说“总会有办法”，你已经给办法标好了入口。",
    ],
    40,
  ),

  // WARNING: day-to-day cues only, no clinical or mental-health labels.
  rule(
    "warning-default",
    "warning",
    [],
    "early-cue",
    [
      "如果连小选择都开始费劲，先减少同时处理的事情。",
      "当“等一下”出现得越来越频繁，提醒自己安排一个间隙。",
    ],
    0,
  ),
  rule("warning-private", "warning", [at("expression", 0, 40)], "early-cue", [
    "回复从完整句子缩成标点，可能是在提示：现在需要少一点输入。",
    "“没事”说得比平时快时，可以回头确认一下自己真实的需要。",
  ]),
  rule(
    "warning-middle",
    "warning",
    [at("expression", 40, 60)],
    "early-cue",
    [
      "忽然不知道想聊还是想静一静时，先暂停接收新的任务。",
      "同一件小事反复想说又收回，可以先给它一个简单的名字。",
    ],
    30,
  ),
  rule(
    "warning-expressive",
    "warning",
    [at("expression", 60, 100)],
    "early-cue",
    [
      "同一个话题说了三遍仍没轻松下来，可以先换个场景。",
      "语速开始跑在想法前面时，喝口水，把发送键放慢半拍。",
    ],
  ),
  rule(
    "warning-private-strong",
    "warning",
    [at("expression", 0, 20)],
    "early-cue",
    [
      "如果连解释“我想休息”都嫌累，用一句短话就够，不必写说明稿。",
      "当每条消息都想留到以后，先照顾这一刻的容量。",
    ],
    40,
  ),
  rule(
    "warning-expressive-strong",
    "warning",
    [at("expression", 80, 100)],
    "early-cue",
    [
      "开始连续补充“还有一件事”时，试试先停下来听听自己的重点。",
      "如果一句话发出后马上想追加五条，先把剩下的写进草稿。",
    ],
    40,
  ),
  rule(
    "warning-social-private",
    "warning",
    [at("energy", 61, 100), at("expression", 0, 39)],
    "early-cue",
    [
      "仍然想见人，却不想回答“最近怎么样”，可能只需要有人陪着。",
      "愿意出门但一直在听，未必是没投入；也可能正在内部整理。",
    ],
    60,
  ),

  // SOCIAL: pace of access, distinct from how energy is replenished.
  rule(
    "social-default",
    "social",
    [],
    "access-pace",
    [
      "想了解本设备，先从一件具体的小事聊起，权限可以慢慢调。",
      "每次相处都可以重新确认距离，不需要一次设置终身有效。",
    ],
    0,
  ),
  rule("social-slow", "social", [at("connection", 0, 40)], "access-pace", [
    "熟悉感需要几次自然的见面，不必一上来就交换全部故事。",
    "先建立一点共同经历，再打开更深的话题，连接会更稳。",
  ]),
  rule(
    "social-middle",
    "social",
    [at("connection", 40, 60)],
    "access-pace",
    [
      "有共同话题就靠近一点，没接上也不急；关系不用统一时速。",
      "让话题决定距离。聊得来可以多一站，还不熟就先到这里。",
    ],
    30,
  ),
  rule("social-fast", "social", [at("connection", 60, 100)], "access-pace", [
    "从一个小小的共同点就能聊开；深入到哪一步，仍然可以自己选。",
    "初次见面也容易建立对话，但不用把每个愉快开场都变成长期任务。",
  ]),
  rule(
    "social-slow-strong",
    "social",
    [at("connection", 0, 20)],
    "access-pace",
    [
      "请重复出现几次，不必每次都很精彩。稳定的小接触更容易获得通行证。",
      "本设备的熟悉按钮不是坏了，只是习惯分几次按下。",
    ],
    40,
  ),
  rule(
    "social-fast-strong",
    "social",
    [at("connection", 80, 100)],
    "access-pace",
    [
      "开场白可以很短，一点共同兴趣就够启动；结束话题也可以很自然。",
      "容易把陌生人聊成临时搭子，记得给彼此保留自由退场的接口。",
    ],
    40,
  ),
  rule(
    "social-quiet-fast",
    "social",
    [at("energy", 0, 39), at("connection", 61, 100)],
    "access-pace",
    [
      "可以很快熟起来，也可以聊一会儿就先撤。这两个功能能够同时开启。",
      "你可能擅长打开话题，但不想无限续聊；提前说好离场时间就很合适。",
    ],
    60,
  ),

  // ENVIRONMENT: physical or organizational affordances, not charging activities.
  rule(
    "env-default",
    "environment",
    [],
    "working-setting",
    [
      "有清楚的任务边界，也有可以临时调整的小空间。",
      "允许说“我需要换个方式”的地方，会让本设备更好发挥。",
    ],
    0,
  ),
  rule(
    "env-route",
    "environment",
    [at("navigation", 0, 40)],
    "working-setting",
    [
      "信息能查到、时间有着落、变更有说明的环境，运行更顺滑。",
      "重要东西有固定位置，下一步有个大致轮廓，就容易进入状态。",
    ],
  ),
  rule(
    "env-middle",
    "environment",
    [at("navigation", 40, 60)],
    "working-setting",
    [
      "大方向清楚，具体做法可协商；给一条路，也留几个出口。",
      "有基本节奏，但不需要每分钟都被填满的空间。",
    ],
    30,
  ),
  rule(
    "env-spark",
    "environment",
    [at("navigation", 60, 100)],
    "working-setting",
    [
      "能尝试不同路径、允许小范围改主意的环境，更容易点亮你。",
      "有素材可翻、有新线索可接，同时允许绕一点路的地方。",
    ],
  ),
  rule(
    "env-route-strong",
    "environment",
    [at("navigation", 0, 20)],
    "working-setting",
    [
      "清晰的约定和可预期的节奏，是本设备的优质运行底座。",
      "工具顺手、信息归位、关键变更提前可见，效率更容易上线。",
    ],
    40,
  ),
  rule(
    "env-spark-strong",
    "environment",
    [at("navigation", 80, 100)],
    "working-setting",
    [
      "给目标和必要边界，路径留一点自由；好点子需要可移动的桌椅。",
      "可以做小实验、把半成品摊开、随时记录新线索的空间。",
    ],
    40,
  ),
  rule(
    "env-shared-structured",
    "environment",
    [at("energy", 61, 100), at("navigation", 0, 39)],
    "working-setting",
    [
      "大家能碰面商量，又能说清谁负责哪一步的协作环境。",
      "有共同节奏的团队桌面：消息找得到，讨论有时间，分工看得见。",
    ],
    60,
  ),

  // REBOOT: an actionable sequence; deliberately separate from the charging answer.
  rule(
    "reboot-default",
    "reboot",
    [],
    "recovery-step",
    [
      "放下当前界面，活动一下，再只选一件十分钟内能做的小事。",
      "先喝水、伸个懒腰，再决定此刻要继续，还是先结束。",
    ],
    0,
  ),
  rule("reboot-private", "reboot", [at("expression", 0, 40)], "recovery-step", [
    "写下“发生了什么”和“我现在需要什么”，不必马上给任何人看。",
    "把脑中的一团线写成三个词，先承认它们，再慢慢找下一步。",
  ]),
  rule(
    "reboot-middle",
    "reboot",
    [at("expression", 40, 60)],
    "recovery-step",
    [
      "先用一句话描述当下，再决定写给自己，还是说给一个愿意听的人。",
      "给此刻的感受起个简单名字，然后挑一个最小的照顾动作。",
    ],
    30,
  ),
  rule(
    "reboot-expressive",
    "reboot",
    [at("expression", 60, 100)],
    "recovery-step",
    [
      "先说清楚“我想被听见，暂时不需要方案”，再从最困扰的一件事说起。",
      "找愿意听的人，把现状讲一遍；说完再决定是否需要一起想办法。",
    ],
  ),
  rule(
    "reboot-private-strong",
    "reboot",
    [at("expression", 0, 20)],
    "recovery-step",
    [
      "开一张只给自己看的便签，写一句未经润色的实话，然后暂时合上。",
      "先用文字给当下留一个出口。只写一句，也算已经开始处理。",
    ],
    40,
  ),
  rule(
    "reboot-expressive-strong",
    "reboot",
    [at("expression", 80, 100)],
    "recovery-step",
    [
      "先征求一个倾听时段，说一件最重要的事，然后留半分钟停顿。",
      "把想说的事缩成一个开头：“现在最让我卡住的是……”再慢慢往下说。",
    ],
    40,
  ),
  rule(
    "reboot-private-spontaneous",
    "reboot",
    [at("expression", 0, 39), at("navigation", 61, 100)],
    "recovery-step",
    [
      "换个姿势或走一小段路，把想法画成几个圈；不用立刻整理成结论。",
      "拿张纸随手写画，让想法先落地，今天可以不负责把它排版漂亮。",
    ],
    60,
  ),

  // EASTER EGG: small, recognisable combinations without absolute claims.
  rule(
    "egg-default",
    "easterEgg",
    [],
    "small-surprise",
    [
      "每次以为已经读懂自己，日常总会悄悄更新一页附录。",
      "使用说明允许手写补充。你比这份文件拥有更高的编辑权限。",
    ],
    0,
  ),
  rule(
    "egg-private-planned",
    "easterEgg",
    [at("expression", 0, 39), at("navigation", 0, 39)],
    "small-surprise",
    [
      "给别人的惊喜，可能早已在心里排练过取出时的角度。",
      "一句简单的问候，背后也许有个悄悄记住的日子。",
    ],
    60,
  ),
  rule(
    "egg-private-spark",
    "easterEgg",
    [at("expression", 0, 39), at("navigation", 61, 100)],
    "small-surprise",
    [
      "不一定当场说想你，却可能突然发来一张“你应该会喜欢”的照片。",
      "有些关心不走长篇文字通道，会变成突然出现的小东西。",
    ],
    60,
  ),
  rule(
    "egg-expressive-route",
    "easterEgg",
    [at("expression", 61, 100), at("navigation", 0, 39)],
    "small-surprise",
    [
      "庆祝还没开始，祝福和集合地点可能已经一起发到了群里。",
      "热情常常附带实用信息：除了“好想见你”，还有时间和地址。",
    ],
    60,
  ),
  rule(
    "egg-expressive-spark",
    "easterEgg",
    [at("expression", 61, 100), at("navigation", 61, 100)],
    "small-surprise",
    [
      "生活里一个小发现，都可能被你讲成一则值得转发的现场快讯。",
      "遇见好玩的东西，分享的念头可能比拍照的动作还快。",
    ],
    60,
  ),
  rule(
    "egg-energy-middle",
    "easterEgg",
    [at("energy", 40, 60)],
    "small-surprise",
    [
      "遇到好笑的招牌，可能先自己笑出声，再挑一位懂这个笑点的人发送。",
      "路边的奇怪招牌也可能被郑重拍下，等一句“这像不像你上次说的那个”。",
    ],
    30,
  ),
  rule(
    "egg-expression-middle",
    "easterEgg",
    [at("expression", 40, 60)],
    "small-surprise",
    [
      "有的话当场说，有的话晚点说。你自带手动切换发送时间的功能。",
      "不必每天维持同一种音量，安静版和健谈版都可以是正版。",
    ],
    30,
  ),

  // WARRANTY: unconditional care. Model-specific copy may be substituted by engine.
  rule(
    "warranty-default",
    "warranty",
    [],
    "unconditional-care",
    [
      "本设备可以修改习惯，但无需为了被喜欢而更换核心零件。",
      "允许有磨损、停顿和升级；任何状态下，都值得被好好使用和对待。",
    ],
    0,
  ),
];
