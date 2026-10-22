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
      "独处充电制",
      "出门可以很开心，电表也可以认真倒退。你通常得把人类活动暂停一会儿，机身里的小维修工才肯上班。",
    ],
    [
      "双头供电线",
      "本机兼容“来个人”和“别来人”两种插头。选哪头不看出厂口号，看今天这场相处会不会让你舒服。",
    ],
    [
      "友情发电制",
      "别人聊天传递信息，你聊天还能回收电能。碰上合拍的人，废话说了半小时，机身竟然更亮了。",
    ],
  ),
  ...series(
    "factory.expression",
    "expression",
    "emotion-processing-principle",
    [
      "情绪走内邮",
      "感受到了，嘴还没签收。你习惯先在里面拆包、分类，再决定哪一件值得寄给外面的人。",
    ],
    [
      "表达有换挡杆",
      "有些话当场出摊，有些话回去炖一炖。你的表达速度会随事情和对象调节，厂家没焊死这个旋钮。",
    ],
    [
      "感受自带外接屏",
      "心里刚有动静，语气已经亮字幕。说话也是你整理感受的过程，别把实时播出的每句都装订成终稿。",
    ],
  ),
  ...series(
    "factory.navigation",
    "navigation",
    "action-routing-principle",
    [
      "路线先领号",
      "开始之前，你喜欢给步骤排个队。事情有了次序，脑内交通协管员才会放下小旗，允许你放心开工。",
    ],
    [
      "地图用铅笔画",
      "先定大方向，细节可以沿途擦改。你的计划不是圣旨，灵感也不是通缉令；两位都能坐副驾驶。",
    ],
    [
      "灵感负责领路",
      "眼前冒出新线索时，你的行动会先探头。路线常常是走出来的，地图在后面小跑着补手续。",
    ],
  ),
  ...series(
    "factory.connection",
    "connection",
    "relationship-entry-principle",
    [
      "熟悉感慢炖",
      "新关系先用小火，不急着煮成知己。你需要几次实际相处；礼貌微笑是试营业，不是永久拒绝接待。",
    ],
    [
      "距离现场调试",
      "门没全开，也没上锁。你会看看话题接不接得住，再调整靠近的距离；认识天数暂不充当通行证。",
    ],
    [
      "连接先搭桥",
      "聊得来，你就比较自然地把这次接成下次。桥搭得快，过桥后逛多远，仍然可以慢慢商量。",
    ],
  ),

  ...series(
    "charging.method",
    "energy",
    "restorative-activity",
    [
      "私人补电舱",
      "换上舒服的衣服，做点不用接话的事。暂时取消“让别人觉得我很好相处”这项耗电服务，连休息成果也不用汇报。",
    ],
    [
      "充电先试插",
      "出去走一小圈，测测今天想不想见人。想聊就约，想静就绕路；本机允许试插，不强制购买全天套餐。",
    ],
    [
      "找一个活体插座",
      "找相处不费力的人吃饭、散步、讲废话。友情供电局允许话题毫无营养，只要现场确实有电。",
    ],
  ),
  ...series(
    "charging.drain",
    "energy",
    "energy-draining-situation",
    [
      "连续接待漏电",
      "三场都挺开心，三场连起来就像给整栋楼当门铃。每响一次都得回应，最后连“嗯”也开始计件收费。",
    ],
    [
      "单一模式耗电",
      "一直独处或一直热闹，都可能把你晾成同一种表情。给一天留个换挡口，别让生活只播放一首歌。",
    ],
    [
      "消息没有接收站",
      "埋头太久，小发现找不到人投递。事情全做完了，活力却像一封盖好邮票、忘了地址的信。",
    ],
  ),
  ...series(
    "charging.signal",
    "energy",
    "low-energy-visible-behavior",
    [
      "沙发正在接管身体",
      "到家后不想接新话题，连挑部电影都嫌片头太长。人已坐稳，注意力还在门口办理入住。",
    ],
    [
      "出门部与沙发部僵持",
      "邀请来了想去，鞋穿一半又想坐下。两部门没有谁叛变，只是今天可用电量不够举办盛大出征。",
    ],
    [
      "聊天只想发预告",
      "想找人说点小事，又嫌铺垫太长。适合来段不用交代前情的陪伴，别再要求自己先播一季人物介绍。",
    ],
  ),
  ...series(
    "charging.tip",
    "energy",
    "small-energy-allocation",
    [
      "散场要有散场",
      "回家路上留一段空白，别再追加三通电话。人都退场了，脑内迎宾员也应当获准脱下玩偶服。",
    ],
    [
      "给活动装下车铃",
      "约时间时顺便约好什么时候结束。知道能舒服地下车，参与和退出就不必临时举行一场礼貌谈判。",
    ],
    [
      "邀请请附动词",
      "把“改天聚”缩成“下楼买杯喝的？”想见面就给它一个小入口，别让友情一直住在模糊的未来城。",
    ],
  ),

  ...series(
    "faults.navigation",
    "navigation",
    "task-switching-quirk",
    [
      "故障001 · 日历返工潮",
      "晚饭换个地点，后续安排可能全体起立。只是改吃面，日历却拿出了旧城改造的施工规模。",
    ],
    [
      "故障001 · 路口双语播报",
      "计划喊“按原路”，新店喊“看我”。两种建议都有道理，于是你站在路口，暂时担任一根思考中的路灯。",
    ],
    [
      "故障001 · 主线失去监护人",
      "准备办正事，沿途收养了三个有趣任务。忙完一圈，最初那件事仍坐在失物招领处等你。",
    ],
  ),
  ...series(
    "faults.expression",
    "expression",
    "emotion-revision-quirk",
    [
      "故障002 · 句子过度抛光",
      "一句话打磨到足够妥帖，话题已经换乘三站。最想说的那句捧着精装封面，没赶上末班车。",
    ],
    [
      "故障002 · 说明书插页",
      "刚说完又补“也不完全是这样”。对方刚记到第三行，你的感受已经申请加印一个补充说明册。",
    ],
    [
      "故障002 · 嘴先开庭",
      "话说到第三句，重点才推门进来。旁人有时把开场陈述当最终判决，而你其实还在现场梳理。",
    ],
  ),
  ...series(
    "faults.connection",
    "connection",
    "relationship-timing-quirk",
    [
      "故障003 · 时机过期",
      "觉得对方不错，想找更自然的机会接近。等“自然”自己送上门时，那个时机已经提着包退休了。",
    ],
    [
      "故障003 · 距离校准中",
      "昨天聊得来，今天也可能想多留半步。关系还在找合适的位置，不是昨天的友好被厂家召回。",
    ],
    [
      "故障003 · 通讯录长太快",
      "接上一个人很快，照顾每条联系却要花时间。通讯录像刚浇过水，日程表却还是那个小花盆。",
    ],
  ),

  ...series(
    "prohibited.boundary",
    "expression",
    "expression-consent",
    [
      "勿当众催交情绪",
      "请勿突然点名要求立刻表态。感受不是按一下就弹出的纸巾，连续敲外壳也不会加速出货。",
    ],
    [
      "勿焊死表达旋钮",
      "昨天能当场说，不代表今天也必须秒答。请勿凭一次聊天记录，就给本机安装终身固定档位。",
    ],
    [
      "勿截半句话送检",
      "感受还没讲完，别急着提取半句制作人物简介。请等待那个“不过”，它可能正在赶往现场。",
    ],
  ),
  ...series(
    "prohibited.decisions",
    "navigation",
    "decision-load-boundary",
    [
      "勿给预案繁殖许可",
      "备用方案可以有，备用方案的曾孙就先别养了。你只需准备这一次出门，不用照管所有平行日历。",
    ],
    [
      "勿同时抛来七个决定",
      "“去不去、几点去、换不换地方”请分批送达。一个问题还没落座，别把整桌选择题都推进来。",
    ],
    [
      "勿让灵感冒领承诺",
      "刚觉得好玩，不等于已经签下整个周末。新点子先领体验票，不要一进门就当人生大股东。",
    ],
  ),

  ...series(
    "hidden.practice",
    "navigation",
    "practical-creative-strength",
    [
      "给复杂事情铺台阶",
      "你常能发现大家究竟卡在哪一步，再把入口讲清楚。看似只是补一句，整件事却终于长出了能踩的台阶。",
    ],
    [
      "工具不会反过来管你",
      "步骤有用就照着走，不合适就换个手法。你能让流程为事情干活，而不是让事情给流程当人质。",
    ],
    [
      "正门堵了会看侧门",
      "一条路卡住，你比较容易发现旁边还能怎么走。别人等完整新方案时，你可能已经从纸箱里拆出一座小桥。",
    ],
  ),
  ...series(
    "hidden.connection",
    "connection",
    "social-observation-strength",
    [
      "熟人细节保管员",
      "相处久了，你常记得一些不起眼的习惯。对方还没说，合适的那一份已经悄悄挪到他手边。",
    ],
    [
      "会给话题留换气孔",
      "能靠近，也能给人留一点空白。你不把每次沉默都当成待填的坑，相处因此比较容易呼吸。",
    ],
    [
      "陌生人破冰小扳手",
      "你比较容易接住一个共同话题，让新来的人有话可进。别人还在找开场白，你已替桌边多搬了一把椅子。",
    ],
  ),

  ...series(
    "warning.normal",
    "expression",
    "ordinary-emotion-baseline",
    [
      "正常 · 安静仍有内容",
      "话不多，但该说的能到达。内部有感受，外部不必放烟花；这是正常输出方式，非音箱报废。",
    ],
    [
      "正常 · 音量自由调节",
      "想说时有话，想整理时也能等一等。厂家允许今天广播、明天便签，不要求每天交同一份声纹作业。",
    ],
    [
      "正常 · 感受正在流通",
      "开心和失望能自然传出来，别人也接得上。表达是一扇开着的窗，不必每次开窗都举行精彩演讲。",
    ],
  ),
  ...series(
    "warning.mild",
    "expression",
    "early-emotion-change",
    [
      "留意 · 标点被扣留",
      "若开始反复检查一条已经写好的回复，先让标点下班。一个逗号不必承担整段关系的质检工作。",
    ],
    [
      "留意 · 发言申请往返",
      "想解释又撤回，撤回又想解释。先挑今天最想说的一件事，别让发言申请在两个窗口之间来回盖章。",
    ],
    [
      "留意 · 语速开始抢跑",
      "如果同一句越说越快、又说一遍，留个能接话的停顿。你的重点不用追着自己的声音跑马拉松。",
    ],
  ),
  ...series(
    "warning.low",
    "expression",
    "depleted-emotion-change",
    [
      "低电 · 句子不愿起床",
      "连平时能说的小事都懒得组织时，先少接一点输入。今天的词语可能正在被窝里集体请假。",
    ],
    [
      "低电 · 选择也要收费",
      "连“说不说”都觉得费劲，就把回应往后挪。电量见底时，别再让本机兼职主持自己的表达听证会。",
    ],
    [
      "低电 · 话很多，岸很远",
      "说了很多却越来越抓不住重点时，先暂停这场交流。音量不是船桨，再划几句也未必能靠岸。",
    ],
  ),
  ...series(
    "warning.recovery",
    "expression",
    "support-when-depleted",
    [
      "恢复 · 只递一张小工单",
      "需要帮忙就说一件具体的事：“能替我处理一下这个吗？”情绪外包维修科不要求先提交三千字故障自传。",
    ],
    [
      "恢复 · 预约稍后发货",
      "可以说“我还没整理好，晚点再聊”。先把回应时间拿回来，别让一团没打包的感受被催着上快递车。",
    ],
    [
      "恢复 · 把宇宙缩回一件事",
      "先从“怎么总是这样”退回“今天发生了什么”。宇宙问题暂不接单，一件具体的小事还有地方下扳手。",
    ],
  ),

  ...series(
    "social.start",
    "connection",
    "relationship-opening-method",
    [
      "先发试用装话题",
      "从具体小事聊起，见过几次再聊深。初次连接请勿直接索取人生压缩包，先交换一条正常大小的日常。",
    ],
    [
      "先试试话题合不合脚",
      "顺着共同兴趣聊一点，看看双方是否舒服。不用见面五分钟，就给关系颁发正式等级证书。",
    ],
    [
      "接得上，就留个下回",
      "共同话题可以自然续上，也可以主动约下一次。联系方式是门铃，不是随时进入别人家的授权书。",
    ],
  ),
  ...series(
    "social.response",
    "expression",
    "listening-and-response-request",
    [
      "提问后请留发货时间",
      "问清楚一件事，然后等对方说完。连发问号只会让输入框看起来像被五个探照灯包围，不会更快得到答案。",
    ],
    [
      "先问现在方不方便说",
      "“想现在聊，还是晚点聊？”这句话比猜沉默有效。没有必要自费聘请一支微表情考古队。",
    ],
    [
      "先听，再选维修套餐",
      "先听完，再问要陪着说还是一起想办法。不是每句情绪都在招聘顾问，有时对方只想把话稳稳放下来。",
    ],
  ),
  ...series(
    "social.boundary",
    "energy",
    "availability-agreement",
    [
      "空闲不等于可预约",
      "日历没写字，不代表那里是一块公共停车场。有些空白早就租给了本人，请勿无通知占用。",
    ],
    [
      "边界允许按天更新",
      "今天想见面，明天想独处，都可以说明。请阅读当日公告，不要拿去年一次回复当永久施工许可证。",
    ],
    [
      "陪伴请派真人到场",
      "约一段确实能相处的时间，比全天亮着在线图标更有用。小绿点没有嘴，不能代替你吃这顿饭。",
    ],
  ),

  ...series(
    "environment.pace",
    "navigation",
    "daily-schedule-shape",
    [
      "给日子几颗固定螺丝",
      "开始、结束和重要约定清楚一些，你更容易安心投入。其余小事可以自由活动，不必给每颗豌豆编号。",
    ],
    [
      "骨架清楚，枝叶随意",
      "留一两件确定的事，其间可以变通。日子有扶手就够了，不用铺成只能单向通行的流水线。",
    ],
    [
      "留一块可变形的空地",
      "重要边界固定，具体走法留点余地。安排别把每寸地都占满，临时起意交通部还需要一个掉头口。",
    ],
  ),
  ...series(
    "environment.talk",
    "expression",
    "communication-medium",
    [
      "重要话题先寄目录",
      "重要内容先给文字，或提前说说要聊什么。你比较容易带着重点进场，不必被临时叫去参加裸考式谈心。",
    ],
    [
      "文字和声音轮班",
      "复杂的先写几句，接不上的再当面聊。两种频道都能干活，无需给其中一个颁发终身独家合同。",
    ],
    [
      "允许现场修改字幕",
      "有及时回应、能边聊边补充的环境更合适。说出来是加工过程，不必把每次聊天办成不可勘误的新闻发布会。",
    ],
  ),
  ...series(
    "environment.balance",
    "energy",
    "alone-together-rhythm",
    [
      "保留一小块私人领土",
      "日程或住处留个不被追问的角落。知道能回去安静，你在见面时反而不用偷偷计算逃生车次。",
    ],
    [
      "并排也能各自营业",
      "一起待着，各做各的，也可以很舒服。陪伴不是双人同步游泳，没必要连翻书都统一节拍。",
    ],
    [
      "让见面有日常入口",
      "一起吃饭、走路、做小事，比偶尔盛大团建更好接电。也留些个人时间，毕竟刷牙不用凑一车人。",
    ],
  ),

  ...series(
    "reboot.pause",
    "navigation",
    "repair-step-stop",
    [
      "步骤1 · 封存当前计划稿",
      "先把安排停在这一版。休息时间不再召开“如何更好地休息”筹备会，会议室现在需要关灯。",
    ],
    [
      "步骤1 · 停在最近的岸边",
      "给眼前这件事找个临时停靠点。先不比较所有路线，允许答案晚一点划着小船过来。",
    ],
    [
      "步骤1 · 把新点子拴在纸上",
      "把刚发现的念头记成一句话，不马上追。它有了暂住地址，你手里的事情才不会再次被拖出门。",
    ],
  ),
  ...series(
    "reboot.offload",
    "expression",
    "repair-step-offload",
    [
      "步骤2 · 给心事贴三张标签",
      "写下发生了什么、自己在意什么、什么可以晚点处理。不求漂亮，先把满地的情绪零件装进三个盒子。",
    ],
    [
      "步骤2 · 捞出最大那块",
      "用一句话说或写出最占空间的事。先从这锅乱炖里捞出一块土豆，不必立刻解释整锅汤的人生观。",
    ],
    [
      "步骤2 · 回听自己的预告片",
      "录一小段话，听一遍，再写个标题。把真正想处理的那件事剪出来，今晚不用上映全部导演加长版。",
    ],
  ),
  ...series(
    "reboot.restore",
    "energy",
    "repair-step-body-basics",
    [
      "步骤3 · 养护碳基外壳",
      "离开屏幕，倒水、吃点东西、伸展一下。先检查这个需要喂养的身体，暂缓检讨整个存在的意义。",
    ],
    [
      "步骤3 · 排查三件小事",
      "饿没饿、渴没渴、坐了多久？先照顾这三位朴素的股东，再决定这段休息由自己过还是找人陪。",
    ],
    [
      "步骤3 · 把补给端上桌",
      "找舒服的人吃点东西或下楼走走，独自去也行。讨论半小时“我们都该休息”，并不等于真的给身体充了电。",
    ],
  ),
  ...series(
    "reboot.resume",
    "navigation",
    "repair-step-next-action",
    [
      "步骤4 · 只发一辆小车",
      "挑一个最小、最明确的动作开始。把杯子洗了也算重新开机，不必顺手完成文明复兴。",
    ],
    [
      "步骤4 · 试跑十分钟",
      "先做一小段，再决定继续还是调整。让现实交点反馈，别让想象一个人在评审席上承包全部发言。",
    ],
    [
      "步骤4 · 让一个点子落地",
      "选一件现在能动手的小事，其他想法暂留候车室。车没开几辆，站长就别急着宣布全国联运。",
    ],
  ),

  ...series(
    "compatibility.gift",
    "connection",
    "relationship-contribution",
    [
      "相处久了会有私家地图",
      "你愿意慢慢熟悉一个人的小习惯。那份默契不是每日打卡积分，隔阵子再见，也未必需要从游客须知重新读起。",
    ],
    [
      "关系里有伸缩接头",
      "靠近一点、各忙一阵，都有协商余地。你不必把距离的每次变化，都办成一次关系重命名大会。",
    ],
    [
      "把偶遇续成日常",
      "聊得不错，你比较愿意再递一句问候。别人还在等缘分第二次路过，你已经替它补好了返程车票。",
    ],
  ),
  ...series(
    "compatibility.friction",
    "navigation",
    "different-expectations-friction",
    [
      "“随便”使用不同字典",
      "对方说随便逛逛，你以为至少有方向；对方可能连方向也随便了。出发前最好确认两个人是不是共用一本词典。",
    ],
    [
      "一次同意不是永久授权",
      "你愿意变通，也有不想改的时候。请勿凭上次一句“可以”，自动续订未来二十年的临时安排。",
    ],
    [
      "转弯之前请打灯",
      "你看见了新东西，对方却可能以为原计划被扔了。说一句为什么想转弯，能省掉一场关于尊重的车内广播。",
    ],
  ),
  ...series(
    "compatibility.agreement",
    "expression",
    "relationship-repair-protocol",
    [
      "暂停请附返场时间",
      "各自整理之前，约好什么时候接着聊。暂停是中场休息，不是把话题拖进失踪人口登记处。",
    ],
    [
      "先确认今天修什么",
      "先问清是解决事情，还是说清感受。两个人若各修一台机器，工具再齐全也只会越敲越响。",
    ],
    [
      "让对方复述一下收到了什么",
      "说完一轮，听听对方理解到哪儿。你们要对齐的是意思，不是比谁能在一分钟内搬出更多汉字。",
    ],
  ),

  ...series(
    "easterEgg.habit",
    "navigation",
    "small-object-ritual",
    [
      "杂物尚未入住，户口已办好",
      "收纳盒还没送到，心里可能已给每格分配住户。连一根备用数据线，都在等待领取自己的门牌。",
    ],
    [
      "备忘录允许混居",
      "购物清单旁边住着一句突如其来的笑话。它们不用互相熟悉，只要别让牙膏误以为自己参与了文学创作。",
    ],
    [
      "小改动可能申请扩建",
      "原本只想换张壁纸，后来整个桌面都参与竞选。家具暂时无权投票，但可能已经换了座位。",
    ],
  ),
  ...series(
    "warranty.care",
    "energy",
    "permission-to-care-for-self",
    [
      "私人时间不收证明材料",
      "本机需要安静时，可以直接休息。人类非标制造有限公司不接受“今天不够努力所以不准下班”的私自加装条款。",
    ],
    [
      "保养方式支持改口",
      "昨天靠独处，今天想有人陪，不影响保修。人又不是酸奶，无需每天保持完全相同的配方。",
    ],
    [
      "需要回应不算欠费",
      "想找人陪就开口，想被接住也可以说明。友情供电局接受正常需求，不要求你先表演十分钟不需要任何人。",
    ],
  ),

  // Very strong preferences change explanations in multiple chapters, not just labels.
  rule(
    "factory.energy:very-low",
    "factory.energy",
    "energy-supply-principle",
    [
      "私人供电占主线",
      "热闹可能让你开心，但大块独处才是常用充电座。散场后请把本人完整归还本人，别附赠续摊条款。",
    ],
    { scores: [score("energy", 0, 20)] },
    40,
  ),
  rule(
    "factory.energy:very-high",
    "factory.energy",
    "energy-supply-principle",
    [
      "人与人串联发电",
      "有来有往的相处，能明显把你从蔫菜状态接回脆菜状态。只要人对味，一起做件普通小事也能涨电。",
    ],
    { scores: [score("energy", 80, 100)] },
    40,
  ),
  rule(
    "factory.expression:very-low",
    "factory.expression",
    "emotion-processing-principle",
    [
      "内侧印刷，稍后发行",
      "感受通常先在里面走完一段流程，外面才收到成品。脸上没有滚动字幕，不代表里面只播天气预报。",
    ],
    { scores: [score("expression", 0, 20)] },
    40,
  ),
  rule(
    "factory.expression:very-high",
    "factory.expression",
    "emotion-processing-principle",
    [
      "情绪出口距离很短",
      "感受还热着，语气就端上桌了。你的话像正在煮的汤，能尝到当下的味道，但不用每口都认作最终配方。",
    ],
    { scores: [score("expression", 80, 100)] },
    40,
  ),
  rule(
    "factory.navigation:very-low",
    "factory.navigation",
    "action-routing-principle",
    [
      "开工前先铺轨道",
      "步骤、时间、边界清楚，行动才比较容易发车。你喜欢提前把不确定安顿好，避免半路让全体乘客下车找车轮。",
    ],
    { scores: [score("navigation", 0, 20)] },
    40,
  ),
  rule(
    "factory.navigation:very-high",
    "factory.navigation",
    "action-routing-principle",
    [
      "脚步负责勘测地图",
      "你很容易被现场机会点燃，先试再定很合脚。路线不一定先存在，走过之后，它才去地图上补办户口。",
    ],
    { scores: [score("navigation", 80, 100)] },
    40,
  ),
  rule(
    "factory.connection:very-low",
    "factory.connection",
    "relationship-entry-principle",
    [
      "关系采用多次入场制",
      "几次真实接触，才比较容易靠近舒服的距离。请勿拿第一张门票，就要求进入员工食堂和私人仓库。",
    ],
    { scores: [score("connection", 0, 20)] },
    40,
  ),
  rule(
    "factory.connection:very-high",
    "factory.connection",
    "relationship-entry-principle",
    [
      "认识合拍者，接口亮得快",
      "碰上聊得来的人，你常会主动把联系接下去。入口开得快，深度仍可慢慢来；通了电不等于签了终身合同。",
    ],
    { scores: [score("connection", 80, 100)] },
    40,
  ),
  rule(
    "charging.method:very-low",
    "charging.method",
    "restorative-activity",
    [
      "无人接待时段",
      "留一大段不用招待任何人的时间，吃饭、看书、发呆都行。休息不需要暗藏成长任务，沙发不是另一所补习学校。",
    ],
    { scores: [score("energy", 0, 20)] },
    40,
  ),
  rule(
    "charging.method:very-high",
    "charging.method",
    "restorative-activity",
    [
      "友情小电站",
      "找能轻松来回聊的人做件小事。一起买菜都算接电，不必为了恢复精神，先把自己累成活动总导演。",
    ],
    { scores: [score("energy", 80, 100)] },
    40,
  ),
  rule(
    "faults.navigation:very-low",
    "faults.navigation",
    "task-switching-quirk",
    [
      "故障001 · 预案家族开枝散叶",
      "备用方案也配备用方案，日历暂时没事，预案已经有了族谱。原本防下雨，最后顺便预防了雨的退休。",
    ],
    { scores: [score("navigation", 0, 20)] },
    40,
  ),
  rule(
    "faults.navigation:very-high",
    "faults.navigation",
    "task-switching-quirk",
    [
      "故障001 · 好奇心自动加钟",
      "“就看一眼”悄悄续成“顺便试试”。正事没被忘掉，只是每路过一个新鲜事，它的队号就往后挪一位。",
    ],
    { scores: [score("navigation", 80, 100)] },
    40,
  ),
  rule(
    "prohibited.decisions:very-low",
    "prohibited.decisions",
    "decision-load-boundary",
    [
      "禁止验收休息绩效",
      "请勿问“今天什么也没做，凭什么累”。本机不是只有产出才磨损；空白一格不需要附上劳动成果截图。",
    ],
    { scores: [score("navigation", 0, 20)] },
    40,
  ),
  rule(
    "prohibited.decisions:very-high",
    "prohibited.decisions",
    "decision-load-boundary",
    [
      "禁止抢购全部可能性",
      "有趣的邀请并非最后一班逃生船。允许漏掉一件好玩的事，世界不会因此取消你的终身入场券。",
    ],
    { scores: [score("navigation", 80, 100)] },
    40,
  ),
  rule(
    "hidden.practice:very-low",
    "hidden.practice",
    "practical-creative-strength",
    [
      "细节巡检小雷达",
      "你愿意核对容易被漏掉的细节。别人以为事情天然顺利，其实是你提前把“到时再说”的坑填平了。",
    ],
    { scores: [score("navigation", 0, 20)] },
    40,
  ),
  rule(
    "hidden.practice:very-high",
    "hidden.practice",
    "practical-creative-strength",
    [
      "临场材料再加工",
      "条件一变，你比较容易从手边找新办法。说明书没覆盖的部分，你能先拿现有零件拼出一个能用的小版本。",
    ],
    { scores: [score("navigation", 80, 100)] },
    40,
  ),
  rule(
    "social.start:very-low",
    "social.start",
    "relationship-opening-method",
    [
      "请用几次普通见面试机",
      "轻松、重复的接触更容易攒出熟悉感。没立刻交底不算连接失败，酱菜也不会泡三分钟就把祖传配方交出来。",
    ],
    { scores: [score("connection", 0, 20)] },
    40,
  ),
  rule(
    "social.start:very-high",
    "social.start",
    "relationship-opening-method",
    [
      "快速连接，不捆绑隐私",
      "可以接住你的主动，也可以直接说想慢一点。聊得快不要求交心也快，友好没有附带强制拆机协议。",
    ],
    { scores: [score("connection", 80, 100)] },
    40,
  ),
  rule(
    "warranty.care:very-low",
    "warranty.care",
    "permission-to-care-for-self",
    [
      "独处无需请假事由",
      "想一个人待会儿，本身就是完整理由。无需等到心情着火，才批准自己回私人停机坪歇一歇。",
    ],
    { scores: [score("energy", 0, 20)] },
    40,
  ),
  rule(
    "warranty.care:very-high",
    "warranty.care",
    "permission-to-care-for-self",
    [
      "陪伴申请无需逞强附件",
      "想见人就诚实说。你不用先连续表演三段“我好得很”，才配在友情售后窗口领一张号码牌。",
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
      "熟人专线快充",
      "找个熟悉的人随便吃顿饭就行。这里需要的是已经接得上的电源，不是一桌需要轮流介绍职业的新插头。",
    ],
    { scores: [score("energy", 61, 100), score("connection", 0, 39)] },
  ),
  rule(
    "charging.drain:quick-link-private",
    "charging.drain",
    "energy-draining-situation",
    [
      "配对很快，电池没扩容",
      "新朋友很快聊熟，续航却不会自动加倍。连接成功不代表今晚可以无限营业，欢迎光临和马上打烊可以同时成立。",
    ],
    { scores: [score("energy", 0, 39), score("connection", 61, 100)] },
  ),
  rule(
    "charging.tip:quiet-company",
    "charging.tip",
    "small-energy-allocation",
    [
      "静音陪伴也算供电",
      "想有人在，又不想一直说，可以并排各做各的。两台设备靠在一起充电，不必同时竞选客厅主持人。",
    ],
    { scores: [score("energy", 61, 100), score("expression", 0, 39)] },
  ),
  rule(
    "faults.navigation:private-revision",
    "faults.navigation",
    "task-switching-quirk",
    [
      "故障001 · 私下修订，现场断代",
      "计划在心里改了几轮，别人仍照着初版走。不是队友考古成瘾，是你的最新版还躺在私人出版社。",
    ],
    { scores: [score("navigation", 0, 39), score("expression", 0, 39)] },
  ),
  rule(
    "faults.connection:fast-many-plans",
    "faults.connection",
    "relationship-timing-quirk",
    [
      "故障003 · 误以为共用一本玩法说明",
      "刚聊投缘就约“下次一起”，细节没对齐。真出门才发现，你说随便逛逛，对方穿了适合端坐三小时的鞋。",
    ],
    { scores: [score("connection", 61, 100), score("navigation", 61, 100)] },
  ),
  rule(
    "prohibited.boundary:adventure-not-strangers",
    "prohibited.boundary",
    "connection-consent",
    [
      "改路线不等于加新乘客",
      "愿意临时绕路，不代表愿意临时认识五个人。地图可以现场改，同行名单请先问，别把探索模式用成陌生人拼车。",
    ],
    { scores: [score("navigation", 61, 100), score("connection", 0, 39)] },
  ),
  rule(
    "prohibited.decisions:enthusiasm-capacity",
    "prohibited.decisions",
    "decision-load-boundary",
    [
      "热情不等于签了包年",
      "喜欢一件事，不等于把所有晚上都抵押给它。请把兴趣、时间、承诺分开装箱，别趁本机高兴偷偷合并订单。",
    ],
    { scores: [score("energy", 0, 39), score("expression", 61, 100)] },
  ),
  rule(
    "hidden.practice:plan-and-say",
    "hidden.practice",
    "practical-creative-strength",
    [
      "能把“哪里不对”翻译成施工单",
      "你愿意讲出感受，也偏好清楚安排。“有点别扭”到你这里，常能被拆成一个具体能改的地方，扳手终于有处可拧。",
    ],
    { scores: [score("navigation", 0, 39), score("expression", 61, 100)] },
  ),
  rule(
    "hidden.connection:open-and-listen",
    "hidden.connection",
    "social-observation-strength",
    [
      "开门快，话筒留给别人",
      "你容易接上新关系，又不急着讲完自己的故事。对方可能因此慢慢展开：终于有人开了门，没有立刻往门口堆满自传。",
    ],
    { scores: [score("connection", 61, 100), score("expression", 0, 39)] },
  ),
  rule(
    "warning.recovery:trusted-voice",
    "warning.recovery",
    "support-when-depleted",
    [
      "找一个熟悉的收件人",
      "找信任的人，说今天最需要被接住的那件事。不用召开全体熟人听证会，一个知道怎么接话的人就够了。",
    ],
    { scores: [score("expression", 61, 100), score("connection", 0, 39)] },
  ),
  rule(
    "social.start:familiar-spark",
    "social.start",
    "relationship-opening-method",
    [
      "熟人相处免答辩",
      "先一起做件小事，让熟悉的人气把电接上。此处无需挨个自我介绍，你不是来重新竞聘朋友这个岗位的。",
    ],
    { scores: [score("energy", 61, 100), score("connection", 0, 39)] },
  ),
  rule(
    "environment.pace:open-organizer",
    "environment.pace",
    "daily-schedule-shape",
    [
      "把“下次”放进日历收容所",
      "新朋友和新活动可以来，约定最好有统一落点。给聊天里那句“下次”配个日期，别让它长期流浪。",
    ],
    { scores: [score("connection", 61, 100), score("navigation", 0, 39)] },
  ),
  rule(
    "reboot.resume:talk-through-one",
    "reboot.resume",
    "repair-step-next-action",
    [
      "步骤4 · 只宣布一个小动作",
      "把准备开始的第一件小事告诉身边人。只发布这一步，不用喝口水就顺便宣布接下来三十天的全球巡演。",
    ],
    { scores: [score("expression", 61, 100), score("navigation", 61, 100)] },
  ),
  rule(
    "compatibility.gift:steady-crew",
    "compatibility.gift",
    "relationship-contribution",
    [
      "熟人之间的固定班车",
      "你愿意和熟悉的人守住一些小约定。下一次有着落，想见面就不用每次重新向命运申请临时航线。",
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
      "说开了，不等于续杯到天亮",
      "感受可以直接讲，电量仍要回去单独补。对方若以为聊开了就能继续黏着，记得说明本次坦白不含无限续杯。",
    ],
    { scores: [score("energy", 0, 39), score("expression", 61, 100)] },
  ),
  rule(
    "warranty.care:open-private",
    "warranty.care",
    "permission-to-care-for-self",
    [
      "一次笨拙不注销真诚",
      "亲切也有接不住的时候，一次回应没做好，不会让此前的真诚全部作废。厂家拒绝因为一颗螺丝卡顿就召回整台人。",
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
      "空白假日禁止擅自施工",
      "你选了把假日大部留给自己，就给空白留块空地。安排一件喜欢的小事足够，别让自由时间一到手就被开发商瓜分。",
    ],
    { scores: [score("energy", 0, 60)], answers: [response("Q05", 0, 1)] },
    65,
  ),
  rule(
    "charging.tip:day-off-company",
    "charging.tip",
    "small-energy-allocation",
    [
      "假日供电请接人类",
      "你想在空出的假日找喜欢的人相处，发个轻巧邀请就行。一起吃点什么也能开机，没必要先招标一日游总承包商。",
    ],
    { scores: [score("energy", 40, 100)], answers: [response("Q05", 3, 4)] },
    65,
  ),
  rule(
    "charging.method:friday-sofa",
    "charging.method",
    "restorative-activity",
    [
      "周五沙发停靠许可",
      "你给周五选了安静。回到不用接话的空间，让沙发暂时取得本机托管权；今晚的“还有安排吗”可以不用再接单。",
    ],
    { scores: [score("energy", 0, 60)], answers: [response("Q01", 0, 1)] },
    70,
  ),
  rule(
    "charging.method:friday-two-stages",
    "charging.method",
    "restorative-activity",
    [
      "先歇，再见人的两段式充电",
      "你的周五先休息再见人，别把前半段删了。灵魂还没从工位卸货，就催它穿鞋，属于无证连续搬运。",
    ],
    { scores: [score("energy", 0, 100)], answers: [response("Q01", 2)] },
    70,
  ),
  rule(
    "charging.method:friday-walk",
    "charging.method",
    "restorative-activity",
    [
      "散步式友情发电",
      "按你选的周五安排，找个朋友边走边聊。鞋底负责走路，话题负责松弛；绕两圈，不必得出任何人类重大结论。",
    ],
    { scores: [score("energy", 40, 100)], answers: [response("Q01", 3)] },
    70,
  ),
  rule(
    "charging.method:friday-table",
    "charging.method",
    "restorative-activity",
    [
      "熟人饭桌并联充电",
      "你给周五选了一桌熟人。找不用维持表现的饭局，允许话题从外卖一路偏到童年，电量自己会听懂回家的路。",
    ],
    { scores: [score("energy", 40, 100)], answers: [response("Q01", 4)] },
    70,
  ),
  rule(
    "faults.expression:coffee-quiet",
    "faults.expression",
    "emotion-revision-quirk",
    [
      "故障002 · 现场已清，遗憾未结案",
      "咖啡洒了，你先擦桌子，把失落留在里面。桌面十秒恢复营业，心里那位拿铁纪念馆馆长可能还要坐一会儿。",
    ],
    { scores: [score("expression", 0, 60)], answers: [response("Q02", 0, 1)] },
    70,
  ),
  rule(
    "faults.expression:coffee-settle",
    "faults.expression",
    "emotion-revision-quirk",
    [
      "故障002 · 为半杯拿铁寻找准确死因",
      "你想整理后再说可惜，手在收拾，脑子在找词。别人看是一摊咖啡，你还在区分“浪费”与“快乐提前下班”。",
    ],
    { scores: [score("expression", 0, 100)], answers: [response("Q02", 2)] },
    70,
  ),
  rule(
    "faults.expression:coffee-live",
    "faults.expression",
    "emotion-revision-quirk",
    [
      "故障002 · 拿铁事故现场直播",
      "按你的选择，咖啡刚洒，感受就到场。杯子少了半杯，现场可能多了一段有起承转合的液体离职演说。",
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
      "步骤1 · 安装图先合上",
      "你装架子习惯先确认做法，重启也先把当前步骤停稳。图纸够用就收，不必趁一次休息重新审批整间房的命运。",
    ],
    { scores: [score("navigation", 0, 60)], answers: [response("Q03", 0, 1)] },
    70,
  ),
  rule(
    "reboot.pause:shelf-main-steps",
    "reboot.pause",
    "repair-step-stop",
    [
      "步骤1 · 停在能站稳的那一步",
      "像你装架子时先抓主步骤一样，先找个能安全暂停的位置。今天不是螺丝选美，细节不必全员盛装到场。",
    ],
    { scores: [score("navigation", 0, 100)], answers: [response("Q03", 2)] },
    70,
  ),
  rule(
    "reboot.pause:shelf-moving",
    "reboot.pause",
    "repair-step-stop",
    [
      "步骤1 · 暂停家具迁徙",
      "你愿意边装边找摆法，一个架子可能带动整个角落转身。先停下扩大的工程，让床保住今天的常住地址。",
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
      "邻居寒暄，勿升级户口普查",
      "你选择给新相遇留些距离。对方可以聊一个小话题，日后碰面再接；夸过帆布包，不代表获准检查包里的人生。",
    ],
    { scores: [score("connection", 0, 60)], answers: [response("Q04", 0, 1)] },
    70,
  ),
  rule(
    "social.start:neighbor-thread",
    "social.start",
    "relationship-opening-method",
    [
      "下回见面留一个接头",
      "你愿意多聊一会儿，再留个话头。想靠近的人接住那件小事就行，下次见面不用重新举行剪彩仪式。",
    ],
    { scores: [score("connection", 0, 100)], answers: [response("Q04", 2)] },
    70,
  ),
  rule(
    "social.start:neighbor-interest",
    "social.start",
    "relationship-opening-method",
    [
      "共同兴趣是便携登机桥",
      "遇上聊得来的邻居，你愿意交换联系方式。顺着那家店或那个爱好接下去，洗衣房就临时多了一班通往下次见面的航班。",
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
      "饭后自动换上片尾字幕",
      "你选了饭后安静。如果机身有字幕，到家换拖鞋时，大概会缓缓浮出“本日人类营业到此结束，主演正在离场”。",
    ],
    { scores: [score("energy", 0, 60)], answers: [response("Q09", 0, 1)] },
    70,
  ),
  rule(
    "easterEgg.habit:dinner-even",
    "easterEgg.habit",
    "after-dinner-small-ritual",
    [
      "群聊主持实行弹性排班",
      "你的饭后状态不必固定热闹或安静。有笑点就接一句，没人说话就歇着；群聊沉默十分钟，不需要你敲锣复市。",
    ],
    { scores: [score("energy", 0, 100)], answers: [response("Q09", 2)] },
    70,
  ),
  rule(
    "easterEgg.habit:dinner-sequel",
    "easterEgg.habit",
    "after-dinner-small-ritual",
    [
      "饭局番外篇自动开播",
      "你选了散场继续聊，设备可能带饭后返场开关。菜都进了保鲜盒，那个笑话还在聊天框里申请第三次加热。",
    ],
    { scores: [score("energy", 40, 100)], answers: [response("Q09", 3, 4)] },
    70,
  ),
  rule(
    "hidden.practice:luggage-list",
    "hidden.practice",
    "practical-creative-strength",
    [
      "行李箱漏带物拦截器",
      "你收行李会先核对清单。大家研究沿途看什么时，你已经把“到了才发现没带”拦在了家门口。",
    ],
    { scores: [score("navigation", 0, 39)], answers: [response("Q11", 0, 1)] },
    65,
  ),
  rule(
    "hidden.practice:luggage-essentials",
    "hidden.practice",
    "practical-creative-strength",
    [
      "关键零件优先登机",
      "你打包先收证件和必需品，其他再补。事情再乱，先把不能缺的找出来；行李箱不必同时竞选百货商场。",
    ],
    { scores: [score("navigation", 0, 100)], answers: [response("Q11", 2)] },
    65,
  ),
  rule(
    "hidden.practice:luggage-onsite",
    "hidden.practice",
    "practical-creative-strength",
    [
      "路上缺什么，现场找办法",
      "你愿意把部分需要留到路上解决。条件变了，也较容易就地接招；行李少带一点，办法可以到了再长出来。",
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
      "这首歌先在心里加演",
      "你选了让音乐在心里多待一会儿。重要感受也可以先留白，别一落幕就催交观后感，掌声不是打印指令。",
    ],
    { scores: [score("expression", 0, 60)], answers: [response("Q18", 0, 1)] },
    65,
  ),
  rule(
    "environment.talk:song-words",
    "environment.talk",
    "communication-medium",
    [
      "词语正在试穿感受",
      "你愿意慢慢找词，说清那首歌打动了哪里。适合允许停顿的交流；别催，形容词还在试衣间排除不合身的那件。",
    ],
    { scores: [score("expression", 0, 100)], answers: [response("Q18", 2)] },
    65,
  ),
  rule(
    "environment.talk:song-live",
    "environment.talk",
    "communication-medium",
    [
      "散场后允许声带继续演出",
      "听完歌你很快想说，边走边聊更自在。感受可以当场带着手势出门，不必等一本精装乐评获批出版。",
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
      "礼貌不必加办深交套餐",
      "店员记住口味时，你选了保留一点距离。接住善意，但不强行展开，也是一种分寸；一杯熟客咖啡不捆绑人生采访。",
    ],
    { scores: [score("connection", 0, 60)], answers: [response("Q20", 0, 1)] },
    65,
  ),
  rule(
    "compatibility.gift:coffee-open",
    "compatibility.gift",
    "relationship-contribution",
    [
      "把一句谢谢接成小街区",
      "你愿意和记住口味的店员继续聊两句。轻巧的联系因此能慢慢发生，一家咖啡店不只卖饮料，还给日常装了个见面铃。",
    ],
    {
      scores: [score("connection", 40, 100)],
      answers: [response("Q20", 3, 4)],
    },
    65,
  ),
];
