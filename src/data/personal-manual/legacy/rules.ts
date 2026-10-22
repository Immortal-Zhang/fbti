import type { DimensionId } from "@/lib/domain";
import type {
  ManualCopyRule,
  RuleSlot,
  RuleCondition,
  ScorePredicate,
} from "@/lib/personal-manual/schema";

type Copy = readonly [label: string, text: string];
const score = (
  dimension: DimensionId,
  min: number,
  max: number,
): ScorePredicate => ({ dimension, min, max });
const response = (questionId: string, min: number, max = min) => ({
  questionId,
  min,
  max,
});
const polarity = (conditions: readonly ScorePredicate[]) =>
  conditions.flatMap(({ dimension, min, max }) =>
    max <= 39
      ? [`${dimension}:low`]
      : min >= 61
        ? [`${dimension}:high`]
        : min >= 40 && max <= 60
          ? [`${dimension}:middle`]
          : [],
  );

function rule(
  id: string,
  slot: RuleSlot,
  topic: string,
  copy: Copy,
  when: RuleCondition,
  priority = 60,
): ManualCopyRule {
  const claims = polarity(when.scores || []);
  const conflicts = claims.flatMap((claim) => {
    const [dimension, side] = claim.split(":");
    return ["low", "middle", "high"]
      .filter((other) => other !== side)
      .map((other) => `${dimension}:${other}`);
  });
  return {
    id,
    slot,
    label: copy[0],
    text: copy[1],
    when,
    priority,
    topic,
    claims,
    conflicts,
  };
}

/** Three exhaustive, disjoint score bands. Middle is never called an extreme. */
function series(
  slot: RuleSlot,
  dimension: DimensionId,
  topic: string,
  low: Copy,
  middle: Copy,
  high: Copy,
): ManualCopyRule[] {
  return [
    rule(
      `${slot}:low`,
      slot,
      topic,
      low,
      { scores: [score(dimension, 0, 39)] },
      20,
    ),
    rule(
      `${slot}:middle`,
      slot,
      topic,
      middle,
      { scores: [score(dimension, 40, 60)] },
      30,
    ),
    rule(
      `${slot}:high`,
      slot,
      topic,
      high,
      { scores: [score(dimension, 61, 100)] },
      20,
    ),
  ];
}

/**
 * Every sentence is selected by a real score/answer predicate. No hash, clock,
 * random index, or model-only prose lookup participates in this library.
 * Topics describe distinct reading jobs; the engine rejects topic/text repeats.
 */
export const PERSONAL_COPY_RULES: readonly ManualCopyRule[] = [
  ...series(
    "factory.energy",
    "energy",
    "energy-supply-principle",
    [
      "独处回血",
      "热闹可以很好玩，恢复却常发生在散场之后。你把注意力收回自己这边，电量才慢慢回升。",
    ],
    [
      "供电方式可切换",
      "有人陪和自己待着都可能让你舒服。决定电量的，往往是当天的状态与相处方式。",
    ],
    [
      "互动回血",
      "一段有来有往的相处，常能把你从待机唤醒。对你来说，分享日常也在补充活力。",
    ],
  ),
  ...series(
    "factory.expression",
    "expression",
    "emotion-processing-principle",
    [
      "内部缓存",
      "感受通常先经过内部整理，才变成外面听得到的话。你安静的时候，心里并不一定很安静。",
    ],
    [
      "有时直说，有时缓冲",
      "你会看事情和对象决定表达速度。先想一下或马上开口，都可能是你认真回应的方式。",
    ],
    [
      "实时表达",
      "感受更容易直接出现在语气和话里。说出来也在帮助你整理，不一定是已经想好了最后结论。",
    ],
  ),
  ...series(
    "factory.navigation",
    "navigation",
    "action-routing-principle",
    [
      "预设路线",
      "先知道从哪里开始、接下来做什么，会让你更容易投入。安排给你的，是腾出脑容量的踏实感。",
    ],
    [
      "方向清楚，沿途可改",
      "你愿意先抓住一个方向，再把细节交给现场。规划与临场反应，不必争一个永久驾驶席。",
    ],
    [
      "灵感导航",
      "眼前的新线索常比旧路线更能点燃你。你习惯在尝试中找到方向，做着做着才看见下一步。",
    ],
  ),
  ...series(
    "factory.connection",
    "connection",
    "relationship-entry-principle",
    [
      "慢热防护",
      "相处过几次，关系才会逐步升温。你的访问权限按熟悉程度开放，客气并不等于拒绝连接。",
    ],
    [
      "按合拍程度靠近",
      "你既不急着把所有门打开，也不预先关门。有没有接得住的话题，比认识了几天更有参考价值。",
    ],
    [
      "快速连接",
      "聊得投缘时，你比较自然地把一次相遇接成下一次联系。开始熟络容易，深度仍然可以慢慢来。",
    ],
  ),

  ...series(
    "charging.method",
    "energy",
    "restorative-activity",
    [
      "首选充电口",
      "换上舒服的衣服，做一点不用回应别人的事。今天的安静时段，可以不附带学习任务。",
    ],
    [
      "试一下再决定",
      "出去散一小圈，不急着约人。走着想找谁就发条消息，想继续安静就再绕一圈。",
    ],
    [
      "首选充电口",
      "找一个相处不费力的人，吃饭、走路、聊点琐碎。话题不用有价值，相处舒服就已经在充电。",
    ],
  ),
  ...series(
    "charging.drain",
    "energy",
    "energy-draining-situation",
    [
      "高耗电场景",
      "连续几段需要接话、留意他人反应的相处。每一场都不讨厌，连起来却像开了整天外放。",
    ],
    [
      "高耗电场景",
      "日程被一种模式占满：一直独处，或一直在人群里。没有换挡余地，比选错模式更耗电。",
    ],
    [
      "高耗电场景",
      "独自埋头太久，连一个小发现都没有人接住。事项都打了勾，活力却还在等一句回应。",
    ],
  ),
  ...series(
    "charging.signal",
    "energy",
    "low-energy-visible-behavior",
    [
      "电量下降时",
      "到家后连选部电影都嫌它有片头。人已经坐下，注意力还需要一会儿才肯落座。",
    ],
    [
      "电量下降时",
      "邀请来了想去，准备出门又想回沙发。先别急着选边，这可能只是今天需要调低活动量。",
    ],
    [
      "电量下降时",
      "想找人说点小事，却懒得从头解释来龙去脉。适合接一段低门槛的陪伴，不用另开一场演讲。",
    ],
  ),
  ...series(
    "charging.tip",
    "energy",
    "small-energy-allocation",
    [
      "一格小建议",
      "给回程留一点空白，不把聚会后的路上也排满电话。让散场真正有一个结束键。",
    ],
    [
      "一格小建议",
      "约活动时顺便约好结束时间。知道自己随时能收工，会让参与和退出都轻松一点。",
    ],
    [
      "一格小建议",
      "把一句具体的邀请发出去：一起买杯喝的也行。别让“找时间聚”一直停在未完成草稿。",
    ],
  ),

  ...series(
    "faults.navigation",
    "navigation",
    "task-switching-quirk",
    [
      "故障001 · 改稿循环",
      "一处安排变动，顺手把后面几步全改一遍。原本只是换顿饭，最后像在重新装修整张日历。",
    ],
    [
      "故障001 · 双重导航",
      "计划说走左边，路边的新店说看我一眼。两套导航同时播报时，可能站在原地多犹豫一会儿。",
    ],
    [
      "故障001 · 支线增生",
      "准备做一件事，途中发现三件更有意思的事。忙了半天，主任务还在门口等你签收。",
    ],
  ),
  ...series(
    "faults.expression",
    "expression",
    "emotion-revision-quirk",
    [
      "故障002 · 草稿积压",
      "开口前先把措辞改到足够妥帖，改完才发现话题已经走远。那句真正想说的话还在后台排队。",
    ],
    [
      "故障002 · 发出又补充",
      "刚觉得自己已经说清楚，又想补一句“也不是完全那样”。感受更新得比对方做笔记快一点。",
    ],
    [
      "故障002 · 实况太快",
      "话已经播到第三句，想法才刚刚找到重点。旁人可能误把上一秒的感受，当成了最终决定。",
    ],
  ),
  ...series(
    "faults.connection",
    "connection",
    "relationship-timing-quirk",
    [
      "故障003 · 熟络延迟",
      "其实觉得对方挺不错，却想再找个自然的时机靠近。几个“下次吧”之后，时机自己先下班了。",
    ],
    [
      "故障003 · 距离微调",
      "一次聊天很合拍，下一次又想保留一点距离。不是推翻前一次，只是相处距离还在试位置。",
    ],
    [
      "故障003 · 联系人过载",
      "认识时很快接上频道，后续发现每一条线都需要时间。通讯录增加的速度，可能快过日程空格。",
    ],
  ),

  ...series(
    "prohibited.boundary",
    "expression",
    "expression-consent",
    [
      "勿强制公开开麦",
      "请勿当众点名要求立刻表态。把问题留给本设备自己处理，公开弹窗并不会缩短加载时间。",
    ],
    [
      "勿锁死回应方式",
      "不要规定昨天能直接说，今天也必须直接说。回应方式可以换，不需要提交性格变更申请。",
    ],
    [
      "勿截取一句定性",
      "请勿用半句情绪给整个人盖章。把后半段听完，有时结论就藏在那个“不过”后面。",
    ],
  ),
  ...series(
    "prohibited.decisions",
    "navigation",
    "decision-load-boundary",
    [
      "勿无限追加预案",
      "不要把每种可能都列成必须准备的项目。备用方案可以有保质期，不用替所有平行时空收行李。",
    ],
    [
      "勿一次切换太多目标",
      "不要同时问“还去不去、几点去、要不要换个城市”。一次确认一个问题，菜单不必突然变成迷宫。",
    ],
    [
      "勿当场包揽所有灵感",
      "不要让刚冒出来的点子直接变成承诺。先试一小步，再决定它值不值得占用整个周末。",
    ],
  ),

  ...series(
    "hidden.practice",
    "navigation",
    "practical-creative-strength",
    [
      "把复杂事情装上扶手",
      "你常能发现一件事缺了哪个步骤，再把入口摆清楚。别人第一次试的时候，会感谢这份顺手。",
    ],
    [
      "会用流程，也会改流程",
      "发现做法不合适时，你能留住目标、调整手法。不是每颗螺丝，都要用同一把工具拧。",
    ],
    [
      "给卡住的事找旁门",
      "一条路走不通时，你比较容易注意到旁边的线索。临场的小改法，有时比完整的新计划更快救场。",
    ],
  ),
  ...series(
    "hidden.connection",
    "connection",
    "social-observation-strength",
    [
      "熟悉之后看得细",
      "你给关系留的观察时间，常让你记住别人不太起眼的习惯。照顾有时已经发生，对方还没来得及开口。",
    ],
    [
      "给相处调合适的距离",
      "你能试着靠近，也能察觉什么时候留一点空白。不是所有沉默都需要填满，你允许话题自然换气。",
    ],
    [
      "把陌生感拆小一点",
      "你比较容易找到一句能继续聊的话，让刚加入的人不必独自站在话题门口。连接的入口因此变多了。",
    ],
  ),

  ...series(
    "warning.normal",
    "expression",
    "ordinary-emotion-baseline",
    [
      "正常运行",
      "回应不一定很长，但能在合适的时候说出重点。暂时不展开，仍然可以是舒服的状态。",
    ],
    [
      "正常运行",
      "该说时说，想整理时也能留一点时间。不必每次用同一种音量证明自己状态不错。",
    ],
    [
      "正常运行",
      "开心与失望都能自然传出来，话题也能来回接。表达在流动，不需要每句话都格外精彩。",
    ],
  ),
  ...series(
    "warning.mild",
    "expression",
    "early-emotion-change",
    [
      "轻度过载信号",
      "如果开始反复检查已经写好的回复，可以先停一次润色。重点可能已经够清楚了。",
    ],
    [
      "轻度过载信号",
      "如果一会儿想解释、一会儿又撤回，先确定今天最想让人知道的一件事就好。",
    ],
    [
      "轻度过载信号",
      "如果语速越来越快、同一句又说了一遍，先给自己和对方留一个能接话的停顿。",
    ],
  ),
  ...series(
    "warning.low",
    "expression",
    "depleted-emotion-change",
    [
      "明显耗电信号",
      "如果连平时想说的小事也不想组织成句子，可以暂时退出需要说明的场合。先少接一点输入。",
    ],
    [
      "明显耗电信号",
      "如果连“要不要说”本身都变得费力，先把回应期限往后挪。不必一边疲惫一边做表达选择题。",
    ],
    [
      "明显耗电信号",
      "如果说了很多却越来越难抓住重点，可以把这场交流先暂停。继续输出不一定能让电量回来。",
    ],
  ),
  ...series(
    "warning.recovery",
    "expression",
    "support-when-depleted",
    [
      "推荐恢复方式",
      "需要帮忙时，试着只说一个具体请求：替我处理一下这件小事。求助不必先写完整的心情说明。",
    ],
    [
      "推荐恢复方式",
      "可以告诉身边人“我还在整理，晚点再说”。先拿回一点时间，再决定这次需要哪种陪伴。",
    ],
    [
      "推荐恢复方式",
      "试着把话题从“为什么总这样”缩到“今天这一件”。一个具体场景，会让你和愿意帮忙的人更容易找到可做的小事。",
    ],
  ),

  ...series(
    "social.start",
    "connection",
    "relationship-opening-method",
    [
      "连接入口",
      "从一个小而具体的话题开始，见过几次再把问题聊深。不要把第一次见面办成个人资料发布会。",
    ],
    [
      "连接入口",
      "用共同兴趣轻轻敲门，看看对方愿不愿意接。相处可以边走边定节奏，不用一开始就宣布熟悉程度。",
    ],
    [
      "连接入口",
      "有共同话题就自然接下去，也可以主动约下一次。但交换联系方式之后，仍要给彼此留选择空间。",
    ],
  ),
  ...series(
    "social.response",
    "expression",
    "listening-and-response-request",
    [
      "回应方式",
      "问一个具体问题，然后给对方把话写完的时间。别连发五个问号，把聊天框变成倒计时屏幕。",
    ],
    [
      "回应方式",
      "先问“现在想聊，还是晚一点更舒服？”把时机交还给本人，比猜测沉默是什么意思更省心。",
    ],
    [
      "回应方式",
      "可以认真接住当下的感受，再确认希望你倾听还是一起想办法。热烈的表达也需要被完整听见。",
    ],
  ),
  ...series(
    "social.boundary",
    "energy",
    "availability-agreement",
    [
      "相处边界",
      "不要把每一段空闲都当成可预约时段。留在家里的时间，也可能早已约给了自己。",
    ],
    [
      "相处边界",
      "临时想独处或想见面都可以商量。说明今天需要什么，比要求对方记住一条永久社交规则更有效。",
    ],
    [
      "相处边界",
      "约好真正能相处的时间，比一直挂着聊天窗口却谁也不在更合适。陪伴看质量，不看在线小绿点。",
    ],
  ),

  ...series(
    "environment.pace",
    "navigation",
    "daily-schedule-shape",
    [
      "生活节奏",
      "适合有几个清楚的时间锚点：何时开始、何时结束，重要约定能查得到。其余小事不必全部进表格。",
    ],
    [
      "生活节奏",
      "留住一两件确定的事，再给其间留空。这样既知道今天往哪儿走，也能容纳路边的新发现。",
    ],
    [
      "生活节奏",
      "把日程留成可以挪动的积木，重要边界固定，具体走法可试。太满的安排会挤掉你发现新办法的空间。",
    ],
  ),
  ...series(
    "environment.talk",
    "expression",
    "communication-medium",
    [
      "交流方式",
      "重要内容能先通过文字看一遍，或提前知道要聊什么。你更容易带着整理好的重点进入对话。",
    ],
    [
      "交流方式",
      "文字和当面交流都留着用。复杂的事先写几句，接不上的地方再见面聊，不必忠于单一频道。",
    ],
    [
      "交流方式",
      "适合有及时回应、允许边聊边澄清的沟通。交流不必等到语言完全定稿，后续补充也有位置。",
    ],
  ),
  ...series(
    "environment.balance",
    "energy",
    "alone-together-rhythm",
    [
      "独处与互动",
      "在家里或日程里留一个不被追问的私人角落。有了确定的独处余地，见面时反而能更自在地在场。",
    ],
    [
      "独处与互动",
      "一起待着但各做各的，也可能很合适。陪伴和安静可以同时存在，不必总切成两块互斥时间。",
    ],
    [
      "独处与互动",
      "让共同吃饭、散步或一起做事成为可期待的日常。独处时间也要保留，不必把所有活动都凑成人数。",
    ],
  ),

  ...series(
    "reboot.pause",
    "navigation",
    "repair-step-stop",
    [
      "步骤1 · 暂停重排",
      "先把正在修改的安排停在这一版。今天不需要靠重新规划，证明一切仍在掌握中。",
    ],
    [
      "步骤1 · 暂停选路",
      "给眼前这件事选一个临时停靠点。先停止比较所有走法，允许答案过一会儿再来。",
    ],
    [
      "步骤1 · 暂停开新窗口",
      "先把刚发现的点子记成一句话，不马上追过去。让手里的任务有机会安静地停下来。",
    ],
  ),
  ...series(
    "reboot.offload",
    "expression",
    "repair-step-offload",
    [
      "步骤2 · 移出缓存",
      "写下三行：发生了什么、我在意什么、可以晚点处理什么。笔记不需要好看，也无需发给任何人。",
    ],
    [
      "步骤2 · 压缩文件",
      "用一句简单的话描述最占空间的事。写下来或说出来都行，先把一团感受压缩成能拿住的一件。",
    ],
    [
      "步骤2 · 换成慢速播放",
      "给自己录一小段语音，回听一次，再为它写一句标题。把最在意的那件事单独放出来，不必把全部后台一起倒出。",
    ],
  ),
  ...series(
    "reboot.restore",
    "energy",
    "repair-step-body-basics",
    [
      "步骤3 · 照顾身体",
      "离开原来的屏幕，给自己倒水、吃点东西、伸展一下。先让身体舒服，思路不用跟着马上交作业。",
    ],
    [
      "步骤3 · 照顾身体",
      "检查一下有没有饿、渴、久坐。先处理这些小需求，再决定这段休息想独自过还是找人一起过。",
    ],
    [
      "步骤3 · 照顾身体",
      "和一个舒服的人吃点东西或到楼下走走，也可以独自完成。把补给落到身体上，别只在聊天里讨论休息。",
    ],
  ),
  ...series(
    "reboot.resume",
    "navigation",
    "repair-step-next-action",
    [
      "步骤4 · 只启动一项",
      "从清单里挑一个最小、最明确的动作。完成它就算重新开机，不需要顺便修好整个人生。",
    ],
    [
      "步骤4 · 先试一小段",
      "给下一步十分钟试运行。结束后再决定继续还是调整，让选择依据实际体验，不必靠提前想完。",
    ],
    [
      "步骤4 · 先做能落地的",
      "从几个想法里选一个现在就能开始的小动作。把其他点子留在候车区，这一趟先开一辆车。",
    ],
  ),

  ...series(
    "compatibility.gift",
    "connection",
    "relationship-contribution",
    [
      "你带来的东西",
      "关系熟悉以后，你愿意花时间了解相处的细节。那种慢慢积累的默契，不必用见面频率证明。",
    ],
    [
      "你带来的东西",
      "你给关系留了调整距离的余地。彼此可以靠近一点，也可以各自忙一阵，不必每次重新定义关系。",
    ],
    [
      "你带来的东西",
      "你容易把一次不错的交流接成持续的联系。主动发出的那句问候，常让相处有机会从偶遇走向日常。",
    ],
  ),
  ...series(
    "compatibility.friction",
    "navigation",
    "different-expectations-friction",
    [
      "可能的摩擦",
      "别人把“随便走走”理解成没有任何约定，你却以为至少已有大方向。摩擦常来自默认设置没对齐。",
    ],
    [
      "可能的摩擦",
      "你愿意临时调整，不代表每次都愿意；对方也可能把你的一次答应记成长期规则。具体到这一次再确认。",
    ],
    [
      "可能的摩擦",
      "你临时换路线是发现了新东西，同行的人却可能以为原计划不被重视。解释一下转弯的原因，会少一点误会。",
    ],
  ),
  ...series(
    "compatibility.agreement",
    "expression",
    "relationship-repair-protocol",
    [
      "建议的协商方式",
      "约定一个能回来继续聊的时间，再各自整理。不必把当场说完当成诚意，也别让暂停变成没有后续。",
    ],
    [
      "建议的协商方式",
      "争论前先确认：现在要解决事情，还是先讲清感受？给对话一个共同目标，双方才不用各修各的系统。",
    ],
    [
      "建议的协商方式",
      "说完一轮后，请对方讲讲听到了什么。两边理解一致，比谁说得更快更完整更能推进相处。",
    ],
  ),

  ...series(
    "easterEgg.habit",
    "navigation",
    "small-object-ritual",
    [
      "一个小习惯",
      "收纳盒还没到，心里可能已经分配好了每一格的住户。暂住的杂物请自觉排队。",
    ],
    [
      "一个小习惯",
      "备忘录里可以同时住着购物清单和一句突如其来的好笑话。系统没有要求它们互相认识。",
    ],
    [
      "一个小习惯",
      "原本只想换个桌面壁纸，最后可能顺便给房间换了个季节。起点小，不耽误支线长。",
    ],
  ),
  ...series(
    "warranty.care",
    "energy",
    "permission-to-care-for-self",
    [
      "保养补充条款",
      "给自己留一段不必接住别人的时间。你的安静，不需要靠更努力的表现来换取。",
    ],
    [
      "保养补充条款",
      "今天需要的照顾，可以和昨天不同。允许自己改口，也允许别人重新认识你的需要。",
    ],
    [
      "保养补充条款",
      "你可以主动寻找陪伴，也可以直接说需要回应。想和人靠近，是一种需要，不是一张欠条。",
    ],
  ),

  // Very strong preferences change explanations in multiple chapters, not just labels.
  rule(
    "factory.energy:very-low",
    "factory.energy",
    "energy-supply-principle",
    [
      "独处是主要电源",
      "你的恢复更偏向完整的个人时间。即使和喜欢的人相处很开心，也往往需要在安静里把电量接回来。",
    ],
    { scores: [score("energy", 0, 20)] },
    40,
  ),
  rule(
    "factory.energy:very-high",
    "factory.energy",
    "energy-supply-principle",
    [
      "互动是主要电源",
      "能接得上话、一起做点事的相处，对你是明显的能量来源。恢复活力时，有来有往常比单独待机更有效。",
    ],
    { scores: [score("energy", 80, 100)] },
    40,
  ),
  rule(
    "factory.expression:very-low",
    "factory.expression",
    "emotion-processing-principle",
    [
      "先存档，再表达",
      "你很习惯先把感受留在内部处理。别人看到的平静，只是输出端的画面，未必是内部事情的多少。",
    ],
    { scores: [score("expression", 0, 20)] },
    40,
  ),
  rule(
    "factory.expression:very-high",
    "factory.expression",
    "emotion-processing-principle",
    [
      "感受实时有回声",
      "你的表达与感受靠得很近，开心或不舒服都容易及时传出。语言像正在工作的桌面，不必句句都是最终文件。",
    ],
    { scores: [score("expression", 80, 100)] },
    40,
  ),
  rule(
    "factory.navigation:very-low",
    "factory.navigation",
    "action-routing-principle",
    [
      "路线先确认",
      "事先知道步骤、时间和边界，会明显降低你的启动阻力。你喜欢把不确定先整理好，再安心把事情做好。",
    ],
    { scores: [score("navigation", 0, 20)] },
    40,
  ),
  rule(
    "factory.navigation:very-high",
    "factory.navigation",
    "action-routing-principle",
    [
      "边走边生成地图",
      "你很容易被现场的机会带动，倾向先试再定。给行动留余地时，你更可能发现原先没写在计划里的路径。",
    ],
    { scores: [score("navigation", 80, 100)] },
    40,
  ),
  rule(
    "factory.connection:very-low",
    "factory.connection",
    "relationship-entry-principle",
    [
      "慢慢开放权限",
      "新关系需要几次真实接触，才会进入你舒服的距离。你更相信逐渐熟悉后的感觉，不急着省略这一段过程。",
    ],
    { scores: [score("connection", 0, 20)] },
    40,
  ),
  rule(
    "factory.connection:very-high",
    "factory.connection",
    "relationship-entry-principle",
    [
      "很快接上频道",
      "遇到合拍的人，你较容易主动延续联系。你擅长开一个入口，而入口之后走多远，仍然可以慢慢商量。",
    ],
    { scores: [score("connection", 80, 100)] },
    40,
  ),
  rule(
    "charging.method:very-low",
    "charging.method",
    "restorative-activity",
    [
      "首选充电口",
      "给自己留一段不必招待任何人的时间：慢慢吃饭、翻几页书，或者什么也不安排。休息不是待完成项目。",
    ],
    { scores: [score("energy", 0, 20)] },
    40,
  ),
  rule(
    "charging.method:very-high",
    "charging.method",
    "restorative-activity",
    [
      "首选充电口",
      "找能自然来回聊的人，一起做件轻松的小事。一起买菜也能补电，不必为见面策划一场大型活动。",
    ],
    { scores: [score("energy", 80, 100)] },
    40,
  ),
  rule(
    "faults.navigation:very-low",
    "faults.navigation",
    "task-switching-quirk",
    [
      "故障001 · 预案套预案",
      "备用方案也想配一个备用方案。日历暂时没变，脑内施工队已经加了好几次班。",
    ],
    { scores: [score("navigation", 0, 20)] },
    40,
  ),
  rule(
    "faults.navigation:very-high",
    "faults.navigation",
    "task-switching-quirk",
    [
      "故障001 · 支线自动续订",
      "“就看一眼”偶尔会自动续成“那就试试”。原任务并没有被取消，只是排队号码越来越靠后。",
    ],
    { scores: [score("navigation", 80, 100)] },
    40,
  ),
  rule(
    "prohibited.decisions:very-low",
    "prohibited.decisions",
    "decision-load-boundary",
    [
      "勿把休息也做成验收",
      "禁止用完成了多少件事，判断今天配不配休息。空白的一格无需填写成果说明。",
    ],
    { scores: [score("navigation", 0, 20)] },
    40,
  ),
  rule(
    "prohibited.decisions:very-high",
    "prohibited.decisions",
    "decision-load-boundary",
    [
      "勿为新鲜感全部签收",
      "禁止把每个有趣的邀请都当成限时优惠。错过一件好玩的事，不会让你的生活自动过期。",
    ],
    { scores: [score("navigation", 80, 100)] },
    40,
  ),
  rule(
    "hidden.practice:very-low",
    "hidden.practice",
    "practical-creative-strength",
    [
      "让事情有可靠落点",
      "你愿意核对那些容易被略过的细节。别人能放心往前走，有时正是因为你已经替流程装好了护栏。",
    ],
    { scores: [score("navigation", 0, 20)] },
    40,
  ),
  rule(
    "hidden.practice:very-high",
    "hidden.practice",
    "practical-creative-strength",
    [
      "现场组合新解法",
      "条件变了，你比较容易从手边材料重新组合办法。原方案没赶上，不妨让新路线先试着开一小段。",
    ],
    { scores: [score("navigation", 80, 100)] },
    40,
  ),
  rule(
    "social.start:very-low",
    "social.start",
    "relationship-opening-method",
    [
      "连接入口",
      "先从重复而轻松的接触开始，让关系长出熟悉感。不要因为对方没有迅速交底，就把这次连接判成失败。",
    ],
    { scores: [score("connection", 0, 20)] },
    40,
  ),
  rule(
    "social.start:very-high",
    "social.start",
    "relationship-opening-method",
    [
      "连接入口",
      "可以接住你的主动，也可以坦白说需要慢一点。建立联系很快，不代表必须同步开放全部私人频道。",
    ],
    { scores: [score("connection", 80, 100)] },
    40,
  ),
  rule(
    "warranty.care:very-low",
    "warranty.care",
    "permission-to-care-for-self",
    [
      "保养补充条款",
      "独自待一会儿，不需要一份足够严重的理由。你本来就可以拥有只属于自己的时间。",
    ],
    { scores: [score("energy", 0, 20)] },
    40,
  ),
  rule(
    "warranty.care:very-high",
    "warranty.care",
    "permission-to-care-for-self",
    [
      "保养补充条款",
      "想见一个人时，可以诚实地开口。你值得被回应，也不需要靠永远活跃来保证自己被记得。",
    ],
    { scores: [score("energy", 80, 100)] },
    40,
  ),

  // Cross-axis conditions keep energy source separate from relationship-entry speed.
  rule(
    "charging.method:familiar-power",
    "charging.method",
    "restorative-activity",
    [
      "熟人快充",
      "不必逼自己认识新面孔。和一个熟悉的人吃顿随便的饭，就足够让今天的电源重新接触良好。",
    ],
    { scores: [score("energy", 61, 100), score("connection", 0, 39)] },
  ),
  rule(
    "charging.drain:quick-link-private",
    "charging.drain",
    "energy-draining-situation",
    [
      "高耗电场景",
      "很快认识新人之后，马上接上长时间相处。连接速度快，不代表你的续航也自动升级了。",
    ],
    { scores: [score("energy", 0, 39), score("connection", 61, 100)] },
  ),
  rule(
    "charging.tip:quiet-company",
    "charging.tip",
    "small-energy-allocation",
    [
      "一格小建议",
      "想有人陪又暂时不想说太多，可以约着各做各的。并排待着，也是一种不用持续发言的连接。",
    ],
    { scores: [score("energy", 61, 100), score("expression", 0, 39)] },
  ),
  rule(
    "faults.navigation:private-revision",
    "faults.navigation",
    "task-switching-quirk",
    [
      "故障001 · 内部更新未同步",
      "脑内已经把计划修到新版，旁人仍照着旧版执行。不是他们故意慢半拍，只是你还没发更新通知。",
    ],
    { scores: [score("navigation", 0, 39), score("expression", 0, 39)] },
  ),
  rule(
    "faults.connection:fast-many-plans",
    "faults.connection",
    "relationship-timing-quirk",
    [
      "故障003 · 默认同频",
      "聊得投缘就顺口约了“下次一起”，细节还没来得及对上。真到碰面，才发现对方说的随便逛逛和你想的不是同一种玩法。",
    ],
    { scores: [score("connection", 61, 100), score("navigation", 61, 100)] },
  ),
  rule(
    "prohibited.boundary:adventure-not-strangers",
    "prohibited.boundary",
    "connection-consent",
    [
      "勿把冒险等同开放权限",
      "愿意临时换目的地，不代表愿意临时多认识五个人。改路线和加同行者，请分两次征求意见。",
    ],
    { scores: [score("navigation", 61, 100), score("connection", 0, 39)] },
  ),
  rule(
    "prohibited.decisions:enthusiasm-capacity",
    "prohibited.decisions",
    "decision-load-boundary",
    [
      "勿把热情当作无限续航",
      "说出喜欢一件事，不等于答应把每个晚上都交给它。请把兴趣、时间与承诺分开确认。",
    ],
    { scores: [score("energy", 0, 39), score("expression", 61, 100)] },
  ),
  rule(
    "hidden.practice:plan-and-say",
    "hidden.practice",
    "practical-creative-strength",
    [
      "把想法讲成可执行的下一步",
      "你既愿意说明感受，也偏好清楚安排。一起做事时，常能把“有点不对”接成一个具体可改的地方。",
    ],
    { scores: [score("navigation", 0, 39), score("expression", 61, 100)] },
  ),
  rule(
    "hidden.connection:open-and-listen",
    "hidden.connection",
    "social-observation-strength",
    [
      "入口开着，话留给别人",
      "容易聊熟，却不急着把自己的经历铺满对话。对方有时会在这段留白里，把真正想说的事慢慢讲出来。",
    ],
    { scores: [score("connection", 61, 100), score("expression", 0, 39)] },
  ),
  rule(
    "warning.recovery:trusted-voice",
    "warning.recovery",
    "support-when-depleted",
    [
      "推荐恢复方式",
      "先找一个熟悉的人，说清今天最需要被接住的一件事。你不必向所有人解释，选一个可靠的接收端就够。",
    ],
    { scores: [score("expression", 61, 100), score("connection", 0, 39)] },
  ),
  rule(
    "social.start:familiar-spark",
    "social.start",
    "relationship-opening-method",
    [
      "连接入口",
      "相处先从一起做一件轻松的事开始。你可能需要熟悉的人气，暂时不需要热闹的自我介绍环节。",
    ],
    { scores: [score("energy", 61, 100), score("connection", 0, 39)] },
  ),
  rule(
    "environment.pace:open-organizer",
    "environment.pace",
    "daily-schedule-shape",
    [
      "生活节奏",
      "新的人和新活动可以不断进来，但约定最好有一个统一落点。聊天里冒出的“下次”，给它配个能找到的日期。",
    ],
    { scores: [score("connection", 61, 100), score("navigation", 0, 39)] },
  ),
  rule(
    "reboot.resume:talk-through-one",
    "reboot.resume",
    "repair-step-next-action",
    [
      "步骤4 · 把下一步说小",
      "把准备做的第一件小事告诉身边人。只说这一步，不用顺便把接下来一个月都承诺出去。",
    ],
    { scores: [score("expression", 61, 100), score("navigation", 61, 100)] },
  ),
  rule(
    "compatibility.gift:steady-crew",
    "compatibility.gift",
    "relationship-contribution",
    [
      "你带来的东西",
      "你愿意和熟悉的人一起守住一些小约定。关系里有可期待的下一次，会让陪伴不必总靠临时碰运气。",
    ],
    {
      scores: [
        score("energy", 61, 100),
        score("navigation", 0, 39),
        score("connection", 0, 39),
      ],
    },
  ),
  rule(
    "compatibility.friction:independent-direct",
    "compatibility.friction",
    "different-expectations-friction",
    [
      "可能的摩擦",
      "你愿意直说感受，却也需要散场后的个人空间。对方可能以为话聊开了就应该继续黏在一起，最好提前说说续航。",
    ],
    { scores: [score("energy", 0, 39), score("expression", 61, 100)] },
  ),
  rule(
    "warranty.care:open-private",
    "warranty.care",
    "permission-to-care-for-self",
    [
      "保养补充条款",
      "你可以亲切，也有接不住别人的时候。一次笨拙的回应，不会让此前的真诚全部作废。",
    ],
    { scores: [score("energy", 0, 39), score("connection", 61, 100)] },
  ),

  // Scenario evidence comes from actual normalized responses, never a hash of the answers.
  // Compatible score ranges keep a specific situation from overriding the overall axis.
  // Q05 is reverse-scored: raw 4 → normalized 0; raw 0 → normalized 4.
  rule(
    "charging.tip:day-off-private",
    "charging.tip",
    "small-energy-allocation",
    [
      "给空白一天留白",
      "意外放假时，你想把大部分时间留给自己。可以只安排一件喜欢的小事，剩下的空白无需再找事情填满。",
    ],
    { scores: [score("energy", 0, 60)], answers: [response("Q05", 0, 1)] },
    65,
  ),
  rule(
    "charging.tip:day-off-company",
    "charging.tip",
    "small-energy-allocation",
    [
      "给空白一天接上线",
      "突然放假，你会想找喜欢的人一起待着。先发一个轻巧的邀请就够了，不必把相处策划成一整天的大项目。",
    ],
    { scores: [score("energy", 40, 100)], answers: [response("Q05", 3, 4)] },
    65,
  ),
  rule(
    "charging.method:friday-sofa",
    "charging.method",
    "restorative-activity",
    [
      "你的周五充电口",
      "你给周五夜晚选了安静模式。先回到不用接话的空间，连沙发都比新安排更像一个好邀请。",
    ],
    { scores: [score("energy", 0, 60)], answers: [response("Q01", 0, 1)] },
    70,
  ),
  rule(
    "charging.method:friday-two-stages",
    "charging.method",
    "restorative-activity",
    [
      "你的周五充电口",
      "先歇一会儿，再出门见人——你选的周五节奏值得保留。别让接连的出门通知，把这段缓冲提前用完。",
    ],
    { scores: [score("energy", 0, 100)], answers: [response("Q01", 2)] },
    70,
  ),
  rule(
    "charging.method:friday-walk",
    "charging.method",
    "restorative-activity",
    [
      "你的周五充电口",
      "从你选的周五散步开始，约个朋友一起走走。边走边聊，不需要围坐着为一个话题开正式会议。",
    ],
    { scores: [score("energy", 40, 100)], answers: [response("Q01", 3)] },
    70,
  ),
  rule(
    "charging.method:friday-table",
    "charging.method",
    "restorative-activity",
    [
      "你的周五充电口",
      "你愿意让一桌熟人接住工作周的尾声。选不必维持表现的饭局，让每个人都可以轻松地来、舒服地散。",
    ],
    { scores: [score("energy", 40, 100)], answers: [response("Q01", 4)] },
    70,
  ),
  rule(
    "faults.expression:coffee-quiet",
    "faults.expression",
    "emotion-revision-quirk",
    [
      "故障002 · 咖啡先擦，遗憾后到",
      "咖啡洒了，你更倾向先处理现场，把失落留在心里。事情收拾好了，遗憾却可能还需要一点时间才放得下。",
    ],
    { scores: [score("expression", 0, 60)], answers: [response("Q02", 0, 1)] },
    70,
  ),
  rule(
    "faults.expression:coffee-settle",
    "faults.expression",
    "emotion-revision-quirk",
    [
      "故障002 · 找词需要一点时间",
      "一杯洒掉的咖啡，也值得把遗憾说准确。偶尔卡顿时，手在收拾现场，脑子还在找最贴近感受的那个词。",
    ],
    { scores: [score("expression", 0, 100)], answers: [response("Q02", 2)] },
    70,
  ),
  rule(
    "faults.expression:coffee-live",
    "faults.expression",
    "emotion-revision-quirk",
    [
      "故障002 · 一杯咖啡，现场连载",
      "按照你选的反应，咖啡刚洒，感受就会跟着出场。偶尔故事已经讲完一集，心情才刚找到片名。",
    ],
    {
      scores: [score("expression", 40, 100)],
      answers: [response("Q02", 3, 4)],
    },
    70,
  ),
  rule(
    "reboot.pause:shelf-preflight",
    "reboot.pause",
    "repair-step-stop",
    [
      "步骤1 · 放下那张安装图",
      "你装置物架会先确认做法。需要重启时，也可以先把当前步骤停稳，但不用趁休息给整个房间重画施工图。",
    ],
    { scores: [score("navigation", 0, 60)], answers: [response("Q03", 0, 1)] },
    70,
  ),
  rule(
    "reboot.pause:shelf-main-steps",
    "reboot.pause",
    "repair-step-stop",
    [
      "步骤1 · 先停在主步骤",
      "像你选的装架子方式一样，先抓主步骤就够了。现在只需找到一处能安全暂停的位置，细节不必一口气补完。",
    ],
    { scores: [score("navigation", 0, 100)], answers: [response("Q03", 2)] },
    70,
  ),
  rule(
    "reboot.pause:shelf-moving",
    "reboot.pause",
    "repair-step-stop",
    [
      "步骤1 · 别顺便搬走整张床",
      "装一个架子，可能顺手改了整个角落——你愿意边做边找摆法。重启前先暂停扩大的工程，只让眼前这一小块落地。",
    ],
    {
      scores: [score("navigation", 40, 100)],
      answers: [response("Q03", 3, 4)],
    },
    70,
  ),
  rule(
    "social.start:neighbor-next-time",
    "social.start",
    "relationship-opening-method",
    [
      "从下次见面开始",
      "一句夸奖不必立刻换来全部近况。按你选的相处速度，对方可以留个小话题，等下一次自然碰面时再接上。",
    ],
    { scores: [score("connection", 0, 60)], answers: [response("Q04", 0, 1)] },
    70,
  ),
  rule(
    "social.start:neighbor-thread",
    "social.start",
    "relationship-opening-method",
    [
      "留一个话头",
      "你愿意把邻居的寒暄多聊一会儿，再留一点给下次。想靠近你的人，可以接住上次那句还没讲完的小事。",
    ],
    { scores: [score("connection", 0, 100)], answers: [response("Q04", 2)] },
    70,
  ),
  rule(
    "social.start:neighbor-interest",
    "social.start",
    "relationship-opening-method",
    [
      "从共同兴趣接线",
      "遇到聊得来的邻居，你愿意把投缘接成联系方式。对方顺着那家店或那个爱好继续聊，就有了下次见面的理由。",
    ],
    {
      scores: [score("connection", 40, 100)],
      answers: [response("Q04", 3, 4)],
    },
    70,
  ),
  rule(
    "easterEgg.habit:dinner-own-space",
    "easterEgg.habit",
    "after-dinner-small-ritual",
    [
      "散场附赠功能",
      "如果给你选的饭后安静配个片尾音效，大概是换上拖鞋时的轻轻两声。今天的精彩收好了，续集不急着开。",
    ],
    { scores: [score("energy", 0, 60)], answers: [response("Q09", 0, 1)] },
    70,
  ),
  rule(
    "easterEgg.habit:dinner-even",
    "easterEgg.habit",
    "after-dinner-small-ritual",
    [
      "散场附赠功能",
      "按你选的饭后状态，群聊主持人可以弹性上下班。有好笑的就接一句，没人说话也不用赶紧救场。",
    ],
    { scores: [score("energy", 0, 100)], answers: [response("Q09", 2)] },
    70,
  ),
  rule(
    "easterEgg.habit:dinner-sequel",
    "easterEgg.habit",
    "after-dinner-small-ritual",
    [
      "散场附赠功能",
      "你选了饭后继续聊，设备大概附送了番外篇播放器。人都到家了，刚才那个笑点还能在聊天框里多活两集。",
    ],
    { scores: [score("energy", 40, 100)], answers: [response("Q09", 3, 4)] },
    70,
  ),
  rule(
    "hidden.practice:luggage-list",
    "hidden.practice",
    "practical-creative-strength",
    [
      "小清单的救场能力",
      "收拾行李时，你选择先核对要带的东西。这份留意细节的习惯，有时能让一趟出发少一次临时折返。",
    ],
    { scores: [score("navigation", 0, 39)], answers: [response("Q11", 0, 1)] },
    65,
  ),
  rule(
    "hidden.practice:luggage-essentials",
    "hidden.practice",
    "practical-creative-strength",
    [
      "先抓关键件",
      "你打包时先收证件和必需品。面对杂乱信息，这种先找关键件的办法，也能帮事情尽快启动。",
    ],
    { scores: [score("navigation", 0, 100)], answers: [response("Q11", 2)] },
    65,
  ),
  rule(
    "hidden.practice:luggage-onsite",
    "hidden.practice",
    "practical-creative-strength",
    [
      "到了现场再接招",
      "你愿意把部分打包难题留到路上解决。环境变了时，这种从眼前条件找办法的习惯可能派上用场。",
    ],
    {
      scores: [score("navigation", 61, 100)],
      answers: [response("Q11", 3, 4)],
    },
    65,
  ),
  rule(
    "environment.talk:song-internal",
    "environment.talk",
    "communication-medium",
    [
      "交流方式",
      "就像你听完那首歌后的选择，感受可以先在心里停一会儿。聊有分量的事时，允许留白、之后再接上，会更舒服。",
    ],
    { scores: [score("expression", 0, 60)], answers: [response("Q18", 0, 1)] },
    65,
  ),
  rule(
    "environment.talk:song-words",
    "environment.talk",
    "communication-medium",
    [
      "交流方式",
      "一首歌带来的触动，你想找到合适的词再说。适合有耐心、允许停顿的交流，别把找词的时间误当成没有感觉。",
    ],
    { scores: [score("expression", 0, 100)], answers: [response("Q18", 2)] },
    65,
  ),
  rule(
    "environment.talk:song-live",
    "environment.talk",
    "communication-medium",
    [
      "交流方式",
      "你听完歌后愿意很快分享触动。可以一起走着聊、边说边补充的场合，会比等待正式总结更自在。",
    ],
    {
      scores: [score("expression", 40, 100)],
      answers: [response("Q18", 3, 4)],
    },
    65,
  ),
  rule(
    "compatibility.gift:coffee-familiar",
    "compatibility.gift",
    "relationship-contribution",
    [
      "你带来的东西",
      "店员记住口味时，你选择保留一点距离。你给关系带来的可以是一种分寸：礼貌接住善意，也允许彼此不继续展开。",
    ],
    { scores: [score("connection", 0, 60)], answers: [response("Q20", 0, 1)] },
    65,
  ),
  rule(
    "compatibility.gift:coffee-open",
    "compatibility.gift",
    "relationship-contribution",
    [
      "你带来的东西",
      "被店员记住口味，你愿意用闲聊回应这份善意。你让轻巧的日常关系有机会继续发生，不必急着证明它有多深。",
    ],
    {
      scores: [score("connection", 40, 100)],
      answers: [response("Q20", 3, 4)],
    },
    65,
  ),
];
