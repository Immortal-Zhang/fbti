import type { DimensionId } from "@/lib/domain";
import type { ComedyProfile, ShareSnippet } from "./schema";

const caption = (text: string): ShareSnippet => ({ text });
const low = (text: string, dimension: DimensionId): ShareSnippet => ({
  text, when: { scores: [{ dimension, min: 0, max: 39 }] }, priority: 30,
});
const high = (text: string, dimension: DimensionId): ShareSnippet => ({
  text, when: { scores: [{ dimension, min: 61, max: 100 }] }, priority: 30,
});

/** Independent comedy worlds; conditions describe behavior, never worth or health. */
export const COMEDY_MODELS_A: readonly ComedyProfile[] = [
  {
    key: "0000",
    direction: "保密档案文员：情绪要入库，熟人凭长期借阅证取件。",
    positioning: "人类非标制造有限公司档案科出品，连发呆都有一个不对外开放的文件夹。",
    description: "外面只回了一个“嗯”，里面已经办完情绪入库、编号和防潮。",
    signature: "柜内有一层叫“没什么”的抽屉。厂家打开过一次，里面还套着七层“真的没什么”。",
    warranty: "本柜不以开门次数计算价值。今天即使只收藏了一阵风，也可以领到下班许可。",
    manual: [
      {
        slot: "charging.drain", label: "临时访客占用过量", dimension: "energy",
        strong: "一天接待太多次“就聊两句”，档案员会被迫反复起立。最后连回一个表情，都像要搬整排卷宗。",
        middle: "柜门开一整天或锁一整天，都可能不合今天的心意。先问档案员此刻想接待，还是想蹲在里面理纸。",
      },
      {
        slot: "prohibited.decisions", label: "禁止给休息加附件", dimension: "navigation",
        strong: "禁止因为一顿饭临时改店，就让整个星期重新办理户口迁移。改一条地址足够，不必把七天都搬出柜子。",
        middle: "大事可以编号，小事允许散装。请勿为了决定怎么度过十分钟，先召开十五分钟的归档会议。",
      },
      {
        slot: "hidden.connection", label: "熟人检索功能", dimension: "connection",
        strong: "熟人说过的小习惯会慢慢有自己的索引。别人还在问“你怎么知道”，柜里已经翻到那次随口一提。",
        middle: "关系隔板不是焊死的。聊得合拍可以挪近一格，想留余地也能放回去，不必重建整座档案馆。",
      },
      {
        slot: "social.boundary", label: "闭馆时间不是谜题", dimension: "energy",
        strong: "看见“今日闭馆”就请正常离场。不要隔五分钟问一次在不在，档案员会把休息过成接待铃耐久测试。",
        middle: "今天想开放哪一层，请直接问柜子。昨天接待三小时，不构成今天继续营业的永久许可证。",
      },
      {
        slot: "environment.balance", label: "一间能关门的小库房", dimension: "energy",
        strong: "最好有一段没人要求你出示近况的时间。门外可以有朋友，门里可以只有一张椅子和一份不必解释的安静。",
        middle: "给日子留一扇可开可关的门：有人时能聊两句，没人时能自己翻页。档案馆不必全天选边站。",
      },
    ],
    share: {
      titles: [caption("情绪收据请拿好"), low("安静也有案底", "expression"), caption("柜门开度归柜子")],
      faults: [
        low("嘴上说已经翻篇，柜里按年份装订成了精装本。", "expression"),
        low("临时改计划，档案科要先给旧日程办理退休。", "navigation"),
        low("连着接待三拨人，最后只想把自己归到无人区。", "energy"),
        low("新朋友已到门口，借阅证还在熟悉程度审核中。", "connection"),
        caption("故障排查：先确认柜子是卡住了，还是今天下班。"),
      ],
      hidden: [
        low("你随口说过不吃葱，本柜已将葱列入访问黑名单。", "connection"),
        low("找东西像有地下索引，连备用胶带也知道自己住哪。", "navigation"),
        low("独处时能把散乱念头，一张张放回该待的位置。", "energy"),
        low("夸奖只回一声谢谢，原件已送进内部恒温展厅。", "expression"),
        caption("抽屉隔板可以移动，今天不必照昨天的格子安放。"),
      ],
      warnings: [
        low("禁止在柜门外催熟，关系不是微波加热档案。", "connection"),
        low("请勿给发呆追加绩效指标，空白页也有编制。", "navigation"),
        caption("柜子不是公共设施，请先敲门，再讨论使用方式。"),
      ],
      summaries: [
        low("热闹负责送来素材，安静负责把自己重新装订。", "energy"),
        low("不是没感想，是每一份感想都想盖好章再出门。", "expression"),
        caption("随箱附赠一个自己，柜门开度由本人现场决定。"),
      ],
    },
    highlights: [
      "嘴上说已经翻篇，柜里按年份装订成了精装本。",
      "临时改计划，档案科要先给旧日程办理退休。",
      "夸奖只回一声谢谢，原件已送进内部恒温展厅。",
    ],
  },
  {
    key: "0001",
    direction: "礼貌信号站：天线先交朋友，主持人回家才开始整理当天收听内容。",
    positioning: "负责把陌生人接成新频道，不负责二十四小时留人在接待室。",
    description: "天线已经和全桌混熟，机主还没来得及给今天的感受写摘要。",
    signature: "顶部天线与机主签的是不同合同：天线负责说“加个联系方式”，机主负责回家找安静。",
    warranty: "本接收站允许亮过灯之后熄灯。厂家未发现任何友情必须靠通宵供电才能保存。",
    manual: [
      {
        slot: "charging.drain", label: "接待窗口挤占维修时间", dimension: "energy",
        strong: "新频道很好接，持续在线却另收电费。接待单越叠越高时，机主可能已经在想：我什么时候能回自己的口袋。",
        middle: "天线今天想外伸多长，要看当日电量。接太久会累，收太久也可能无聊，允许午后重新签一份营业计划。",
      },
      {
        slot: "prohibited.decisions", label: "禁止自动续约一切邀约", dimension: "navigation",
        strong: "请把“聊得来”和“时间定了”分开登记。否则日历会长成蜂窝，每个小格里都站着一位刚认识的朋友。",
        middle: "先确认一件最重要的安排，其他邀请暂放候选频道。别把一句“改天”当成今天必须排完的施工图。",
      },
      {
        slot: "hidden.connection", label: "陌生频道起播器", dimension: "connection",
        strong: "你常能接住一句不起眼的开场，让新认识的人不用在尴尬里空转。一个帆布包，也可以成为友好连接的路由地址。",
        middle: "你的天线可以先试收一小段。频道舒服就接着聊，杂音太多就换位置，不必第一次见面就决定终身频率。",
      },
      {
        slot: "social.boundary", label: "口袋内禁止追踪信号", dimension: "energy",
        strong: "机主收起天线，是去处理自己的日子。请勿派出“你是不是不高兴”巡逻队，沿着每一个已读标记追进维修间。",
        middle: "上线和下线可以临时商量。别人需要的是一条清楚的通知，不是一份证明你永远热情的信号强度报告。",
      },
      {
        slot: "environment.balance", label: "接线之后要有空桌面", dimension: "energy",
        strong: "适合接触新鲜的人，再回一处不用继续接话的小地方。天线有广度，口袋有边界，两样都给足才省电。",
        middle: "把日程留成可插拔频道：想聊就接上，想自己待着就收起。不要把整天焊成一个只能迎客的接待台。",
      },
    ],
    share: {
      titles: [caption("天线和我各过各的"), high("先加好友再回窝", "connection"), caption("口袋里的接待室")],
      faults: [
        high("天线每伸出去一次，通讯录就自己长出一片新叶。", "connection"),
        low("接收了全桌的故事，自己的心情还卡在内部转写。", "expression"),
        low("散场后人已回家，礼貌接待声仍在脑袋里值班。", "energy"),
        low("邀请都说得很轻巧，排进日历却要动用吊车。", "navigation"),
        caption("检修建议：信号忽明忽暗时，先问机主想不想聊。"),
      ],
      hidden: [
        high("第一次见面像调频，几句话就找到彼此能听的台。", "connection"),
        low("感受先在内部转成字幕，发出来时常少了几层杂音。", "expression"),
        low("再热闹的约定也想落到时间点，友情不靠口头漂流。", "navigation"),
        low("收起天线以后，安静能把散落各处的自己接回来。", "energy"),
        caption("天线可伸缩，友好和边界不需要抢同一颗螺丝。"),
      ],
      warnings: [
        low("禁止把暂时离线解释成关系退货，站长在吃饭。", "energy"),
        high("新增联系人不自动附赠全天候在线客服服务。", "connection"),
        caption("请勿敲击外壳催出真心，接收站不是自动售货机。"),
      ],
      summaries: [
        high("陌生人是待试听频道，合拍了就多留一个入口。", "connection"),
        low("外壳很会接话，核心部件仍需独自晾干一天。", "energy"),
        caption("天线负责连接世界，机主保留决定开关的职位。"),
      ],
    },
    highlights: [
      "天线和我各过各的",
      "新增联系人不自动附赠全天候在线客服服务。",
      "接收了全桌的故事，自己的心情还卡在内部转写。",
    ],
  },
  {
    key: "0010",
    direction: "玻璃罩里的野生发明园：表面盆栽，内部兴趣已经申请扩建。",
    positioning: "外形适合摆在窗台，内部经常擅自长出与原任务无关的新枝。",
    description: "你以为它在发呆，其实一粒好奇心刚在里面长出了违章建筑。",
    signature: "舱内没有“瞎折腾”这个文件夹。所有未经计划的枝条，统一登记为试验田。",
    warranty: "本舱允许暂时只长叶子。没有开花的日子，也不是一盆等待退货的自己。",
    manual: [
      {
        slot: "charging.drain", label: "频繁掀开玻璃罩", dimension: "energy",
        strong: "每隔十分钟被问一次在干吗，就像有人不断把盆景拔出来检查根。还没来得及长点什么，先忙着重新种回自己。",
        middle: "罩子闷太久或掀太久都未必合适。今天想自己生长，还是想找人晒会儿太阳，可以到了下午再决定。",
      },
      {
        slot: "prohibited.decisions", label: "禁止每粒种子都扩建", dimension: "navigation",
        strong: "一个新点子先种进小杯子，别立刻承包整片山。收藏夹可以是苗圃，不必每颗兴趣都签下终身养护合同。",
        middle: "留一条主根，也给侧枝一点位置。不要为选哪片叶子先长，耗掉整天本来可以见到的阳光。",
      },
      {
        slot: "hidden.connection", label: "熟人专用育苗区", dimension: "connection",
        strong: "关系熟起来后，那些平时没说的小发现会愿意探出头。不急着办成果展，先把一根新枝放到熟人的窗台上。",
        middle: "不用第一次见面就拆掉整个玻璃罩。可以先开一条缝，发现交流舒服，再让新枝伸过去打个招呼。",
      },
      {
        slot: "social.boundary", label: "请勿按分钟催生", dimension: "energy",
        strong: "一起玩可以约，之后的独处请完整归还。不要在浇完水后站在旁边催它表演长高，植物也想保留一点职业神秘。",
        middle: "探望时间可以商量，今天不接待也无需演示枯萎。盆景正常好好的，也可以只是想换一种通风方式。",
      },
      {
        slot: "environment.balance", label: "留白是一种土壤", dimension: "energy",
        strong: "给自己一段没人要求拿出成品的时间。看似无所事事的角落，可能正好能让想法从一个小洞冒出来。",
        middle: "日子可以有几段结伴晒太阳，也有几段自己长叶子。人群与独处都是气候，不用永久迁往其中一边。",
      },
    ],
    share: {
      titles: [caption("内部已长出违建"), caption("请勿催本盆开花"), high("兴趣正在野生扩建", "navigation")],
      faults: [
        high("本来查一种植物，最后给整个雨林做了电子户口。", "navigation"),
        low("被连续问了三次在干吗，根系开始申请异地办公。", "energy"),
        low("新关系还没长稳，枝条暂时只敢在玻璃内招手。", "connection"),
        low("开心先拿去光合作用，外面只能看见叶子轻轻动。", "expression"),
        caption("发现枝叶位置变了，请先询问，别按出厂图硬掰。"),
      ],
      hidden: [
        high("别人看见一条岔路，本舱已经开始培育三个新用法。", "navigation"),
        low("安静不是停产，地面以下常有新想法在偷偷施工。", "energy"),
        low("熟人来的时候，平常收着的怪点子会挨个探头。", "connection"),
        low("先让一段感受在心里发芽，再挑合适的话递出去。", "expression"),
        caption("本舱允许换土，昨天种的目标也可以重新考虑。"),
      ],
      warnings: [
        high("禁止把每一颗兴趣都种满阳台，人还需要站的地方。", "navigation"),
        low("请勿一边浇水一边拔根，陪伴不包含强制查进度。", "energy"),
        caption("叶子歪一点不影响使用，厂家没有统一盆栽人格。"),
      ],
      summaries: [
        high("人生先种着，长出来是什么，允许以后再认领。", "navigation"),
        low("外面没有节目，里面正在举办小规模春天。", "expression"),
        caption("一台可以换方向生长的设备，不必永远朝同一扇窗。"),
      ],
    },
    highlights: [
      "你以为它在发呆，其实一粒好奇心刚在里面长出了违章建筑。",
      "本来查一种植物，最后给整个雨林做了电子户口。",
      "外面没有节目，里面正在举办小规模春天。",
    ],
  },
  {
    key: "0011",
    direction: "沉默支线考古员：买东西只是借口，顺路发掘附近的人类文明。",
    positioning: "具备发现偏僻小店与陌生话题的雷达，返航后需要独自整理出土物。",
    description: "导航说目的地已到达，本机说前面那条巷子不像没有秘密。",
    signature: "雷达说明书只印了一条直线。实物坚持认为，那只是厂家没画完的地图。",
    warranty: "本仪绕过的路不必全部变成收获。空手回家，也算完成了一次本人批准的考察。",
    manual: [
      {
        slot: "charging.drain", label: "考察团不肯解散", dimension: "energy",
        strong: "偶遇很有意思，一路都得陪聊却会把雷达烤干。想独自走一段，不是嫌同行者无聊，是需要把刚见到的世界装回去。",
        middle: "有时想单独钻巷子，有时想找人一起看招牌。今天的耗电项可能只是没有选择权，不必先宣布自己属于哪种旅行团。",
      },
      {
        slot: "prohibited.decisions", label: "禁止把一眼看成长期项目", dimension: "navigation",
        strong: "路边的新鲜事可以看一眼，但不必每看一眼就给人生新开一个分公司。先保留返程车票，再决定要不要常驻。",
        middle: "先挑一个值得停的点，其他光点允许暂时经过。雷达同时亮了五下，不代表你必须长出五双腿。",
      },
      {
        slot: "hidden.connection", label: "线索会开口说话", dimension: "connection",
        strong: "你容易顺着一句闲聊找到下一条线索。问店员哪款好吃，可能顺手问出了整条街的隐形菜单和谁家猫有脾气。",
        middle: "可以只问一小句，再看对方愿不愿意接。线索不一定要变朋友，友好的短暂交会也算一件合格出土物。",
      },
      {
        slot: "social.boundary", label: "返程不接受追踪", dimension: "energy",
        strong: "本仪说想自己逛会儿时，请别组织搜救队。位置可以告诉你，但每一段安静不需要实时上传配套旁白。",
        middle: "同行可选，并非绑定安装。约好下一个碰头点，中间各看各的，也能拥有一份双方都舒适的考察记录。",
      },
      {
        slot: "environment.balance", label: "地图外面要有退路", dimension: "energy",
        strong: "适合有新东西可看，也有安静小路可走的地方。探索像进货，独处像盘点，仓库不能只准货车进、不准关灯。",
        middle: "让热闹与安静像地图图层一样可开可关。今天用哪一层就显示哪一层，别把所有标记一起压在眼前。",
      },
    ],
    share: {
      titles: [caption("本次出门另有支线"), caption("厂家地图画少了"), high("顺路顺到另一条街", "navigation")],
      faults: [
        high("买笔途中发掘三家小店，只有那支笔至今下落不明。", "navigation"),
        high("问了一句好不好吃，意外接入老板二十年创业史。", "connection"),
        low("见闻装得太满，返程时只想把自己调成无旁白模式。", "energy"),
        low("明明心里很惊喜，外面只播出一个低音量的哇。", "expression"),
        caption("光点忽左忽右时，请先确认今天到底想看什么。"),
      ],
      hidden: [
        high("别人认路看路牌，本机还能靠一阵香味发现支线。", "navigation"),
        high("陌生人随口给的建议，常能被接成下一站的小惊喜。", "connection"),
        low("独自返航时，散落的见闻会慢慢拼成私人地图。", "energy"),
        low("感受先拍成内部纪录片，等合适的时候再配旁白。", "expression"),
        caption("地图支持删点，没去成的地方不会向机主追债。"),
      ],
      warnings: [
        high("禁止每看见一个箭头就拜师，路过也算合法参与。", "navigation"),
        low("请勿要求考察途中全程解说，雷达也需要静默扫描。", "expression"),
        caption("返程按钮不是投降键，逛够了就可以认真回家。"),
      ],
      summaries: [
        high("方向感未必按原路走，好奇心倒是一直有信号。", "navigation"),
        high("出门带一张地图，回来多了几个会讲话的坐标。", "connection"),
        caption("这台雷达有权空手返航，世界明天也不会停业。"),
      ],
    },
    highlights: [
      "导航说目的地已到达，本机说前面那条巷子不像没有秘密。",
      "买笔途中发掘三家小店，只有那支笔至今下落不明。",
      "问了一句好不好吃，意外接入老板二十年创业史。",
    ],
  },
  {
    key: "0100",
    direction: "小锅听证会：关系用小火，感受一旦出锅就要把味道说明白。",
    positioning: "只在熟悉的餐桌营业，擅长把“我有点在意”煮成可以认真讨论的一锅话。",
    description: "和你熟起来需要小火，但哪口不对味，本壶会当场申请发言。",
    signature: "壶盖不是情绪封印。本型号发现，适量冒气比把所有话炖成锅底更省清洁费。",
    warranty: "这只壶不靠一直温暖别人续保。今天没煮出什么道理，也可以把自己从炉子上端下来。",
    manual: [
      {
        slot: "charging.drain", label: "把续杯当成永久营业", dimension: "energy",
        strong: "一场又一场聚会续上来，小壶就没有降温时间。人虽然还在点头，内心已经给所有客人默默收好了杯垫。",
        middle: "今天想围桌坐会儿，还是自己慢慢喝完一杯，都可以。最耗电的通常不是谁来了，而是火候不能由自己调。",
      },
      {
        slot: "prohibited.decisions", label: "禁止给每一口做审计", dimension: "navigation",
        strong: "准备可以认真，临时少一样配料也不必宣布宴会破产。请给计划留一点汤汁流动的空间，别把饭局煮成验收会。",
        middle: "先定最要紧的火候，其余尝一口再说。讨论怎么煮的时间，不应长过这顿饭本来可以好好吃的时间。",
      },
      {
        slot: "hidden.connection", label: "熟人温度记忆", dimension: "connection",
        strong: "慢慢熟悉以后，你更容易知道对方喜欢哪种相处火候。照顾可以很具体：有的话直说，有的杯子提前放好。",
        middle: "温度不用第一次见面就定档。可以先递一小杯，看看彼此喝不喝得惯，再决定下一次坐得多近。",
      },
      {
        slot: "social.boundary", label: "离火不等于翻脸", dimension: "energy",
        strong: "本壶说需要自己待会儿时，请停止续水。不是刚才那桌有问题，是一只壶也想拥有不负责招待任何人的灶台。",
        middle: "想聚还是想独处，允许当天试温。昨天聊得滚烫，并不构成今天必须继续沸腾的供餐合同。",
      },
      {
        slot: "environment.balance", label: "餐桌旁要有休息架", dimension: "energy",
        strong: "适合见面后有完整安静时间的节奏。心里话说出来是一回事，电量补回来是另一回事，别让小壶同时当炉子和燃料。",
        middle: "给日子配一张可聊天的桌子，也配一个可独处的角落。你可以换座位，不必每次都解释是哪种心情促成了搬迁。",
      },
    ],
    share: {
      titles: [caption("本壶请求发言"), caption("请勿焖成锅底"), low("熟人小火营业中", "connection")],
      faults: [
        high("本来只想说有点咸，一开口变成调味品听证会。", "expression"),
        low("饭局临时换地点，小壶要先给原菜单举行告别式。", "navigation"),
        low("客人还想续摊，本壶已经在心里叠起全部餐巾。", "energy"),
        low("不是端着，是还没熟到可以共用那把心情汤勺。", "connection"),
        caption("壶口忽然冒气时，先听具体哪一口需要调味。"),
      ],
      hidden: [
        high("能把一团不舒服说清楚，让关系不用隔着锅盖猜。", "expression"),
        low("清单像锅边的刻度，很多小疏漏提前就被拦住。", "navigation"),
        low("熟悉之后会记住火候，照顾常在对方开口前到桌。", "connection"),
        low("独处像关小火，终于听得见自己到底想喝哪一口。", "energy"),
        caption("温控钮始终归本人，舒服的相处可以一起试温。"),
      ],
      warnings: [
        high("请勿把冒一点蒸汽判成开战，本壶只是在说味道。", "expression"),
        low("禁止按住加热键催熟，关系没有三十秒快煮档。", "connection"),
        caption("本壶可供温暖，不承担把所有人都炖明白的义务。"),
      ],
      summaries: [
        high("心里话趁热说，别让一点小介意慢慢糊成锅底。", "expression"),
        low("熟悉的火候才香，慢慢来不是对人类不营业。", "connection"),
        caption("一只有自己温控权的壶，不必每次都煮出大道理。"),
      ],
    },
    highlights: [
      "本来只想说有点咸，一开口变成调味品听证会。",
      "请勿把冒一点蒸汽判成开战，本壶只是在说味道。",
      "本壶可供温暖，不承担把所有人都炖明白的义务。",
    ],
  },
  {
    key: "0101",
    direction: "有营业时间的情绪广播：来电容易接，节目说清楚，收播以后不要追到演播室。",
    positioning: "会把生人聊成听众，也会在自己规定的时间关掉话筒去洗杯子。",
    description: "情绪可以现场直播，但本台没有批准任何一位听众住进演播室。",
    signature: "本台广告位暂不收费。遇到一件真心喜欢的小事，主持人可能自动替它念三遍，连谢谢惠顾都自己配音。",
    warranty: "节目偶尔不精彩，也不撤销主持资格。厂家允许你用一期沉默，认真播出自己的休息。",
    manual: [
      {
        slot: "charging.drain", label: "收播曲后继续点歌", dimension: "energy",
        strong: "热情接了太多通来电，就会把原本的休息播成深夜加场。嘴还能说，机主却已经想把话筒塞进洗衣篮。",
        middle: "有时想接一通电话，有时想听水壶响。不要把一天全排成直播，也别强迫自己一直静音，节目单可以临时换。",
      },
      {
        slot: "prohibited.decisions", label: "禁止口头无限加场", dimension: "navigation",
        strong: "说“可以呀”之前先看一眼节目单。热情不是一种能让周六自动多长出六小时的时间扩容技术。",
        middle: "先确认本期节目，再考虑临时彩排。别为一个还没定的周末邀约，开成永不结束的排期特别节目。",
      },
      {
        slot: "hidden.connection", label: "新听众不必自己找座", dimension: "connection",
        strong: "你比较容易给刚加入的人递上一句能接的话。话题门口不再只有尴尬，还有一位愿意先把凳子拉出来的主持人。",
        middle: "可以先试听一小段，合拍再续播。没人规定初次见面必须立刻订阅彼此的全部人生栏目。",
      },
      {
        slot: "social.boundary", label: "本台拒绝追播", dimension: "energy",
        strong: "“今天先聊到这”就是完整的结束语。请勿在片尾连续追加人生问题，主持人也有不带麦克风回家的权利。",
        middle: "开播时长可以协商，不必照抄昨天的节目单。临时想独处时，发个收播通知，比硬撑到口干更清楚。",
      },
      {
        slot: "environment.balance", label: "演播室外要有生活", dimension: "energy",
        strong: "适合交流有边界、结束能准点的节奏。说出感受以后，再留一段无需把感受继续加工成节目的私人时间。",
        middle: "日子可以有互动栏目，也可以插播一段没有解说的空白。哪一段放多久，由今天的机主排，不由收听人数排。",
      },
    ],
    share: {
      titles: [caption("收播以后不许点歌"), caption("本台谢绝全天直播"), high("情绪已接入麦克风", "expression")],
      faults: [
        high("心情刚到现场，主持人已经开始同步口播。", "expression"),
        high("新听众只打了个招呼，本台已经找到共同栏目。", "connection"),
        low("收播曲响了三遍，自己还在礼貌回答最后一个问题。", "energy"),
        low("临时加一个节目，原节目单全体起立重新排队。", "navigation"),
        caption("信号有起伏时，请问主持人，不要擅自补写剧情。"),
      ],
      hidden: [
        high("能把喜欢和不喜欢说清，省下双方猜台词的电费。", "expression"),
        high("给新加入的人留一个话口，冷场就少一张常驻座位。", "connection"),
        low("约定能落进节目单，下一次见面不只活在客套里。", "navigation"),
        low("关闭外放之后，才有空听听自己没播出来的杂音。", "energy"),
        caption("话筒支持暂停，清楚表达也包括今天先不说。"),
      ],
      warnings: [
        low("禁止追到片尾催更，主播已下班，人还需要过日子。", "energy"),
        high("即时表达不代表最终定稿，请允许主持人补一句。", "expression"),
        caption("请勿按收听人数评价本台，私人频道也有播出权。"),
      ],
      summaries: [
        high("感受不是密电，本台倾向直接说清楚哪儿有动静。", "expression"),
        low("播过热闹，也要认真关机；收播不是撤回热情。", "energy"),
        caption("机主拥有节目最终解释权，以及随时去倒水的权利。"),
      ],
    },
    highlights: [
      "情绪可以现场直播，但本台没有批准任何一位听众住进演播室。",
      "收播曲响了三遍，自己还在礼貌回答最后一个问题。",
      "禁止追到片尾催更，主播已下班，人还需要过日子。",
    ],
  },
  {
    key: "0110",
    direction: "熟人可见的随拍电影：感受有声，剧情会拐弯，观众席并不公开售票。",
    positioning: "导演、剪辑和讲述都住在一台机器里，但不会对每位路人开放首映。",
    description: "剧情随时可以改，观众名单不行；本片先在熟人小厅试映。",
    signature: "厂家没配固定剧本，只配了一个暂停键。工程师说，人生允许剪掉那段纯粹为了交代而继续的戏。",
    warranty: "本片不按掌声数量结算价值。今天只有你自己看懂，也不必连夜重拍成别人的题材。",
    manual: [
      {
        slot: "charging.drain", label: "私人片场被连续探班", dimension: "energy",
        strong: "刚有点感觉就被问“然后呢”，像每拍一秒都要提前参加首映问答。镜头还没对焦，人先忙着解释自己在拍什么。",
        middle: "有时想边走边聊，有时想独自看一会儿。疲惫可能来自片场没留暂停位，不一定来自观众太多或太少。",
      },
      {
        slot: "prohibited.decisions", label: "禁止每个灵感都开机", dimension: "navigation",
        strong: "新灵感先录一小段，不必当场重拍整个人生。午饭都还没吃的导演，暂不受理跨季度宏大叙事。",
        middle: "给今天留一条主线，再允许几个随拍镜头。别为剪哪一秒开三小时讨论会，生活还在外面等你开机。",
      },
      {
        slot: "hidden.connection", label: "熟人专用完整版", dimension: "connection",
        strong: "熟悉的观众更容易看到你的长镜头：真实感受、奇怪想法和未修剪的笑点。小厅不大，内容却不必只剩预告。",
        middle: "先放一个短片，观察对方是不是舒服的观众。合拍可以继续聊，不合拍也不必把一次见面剪成最终影评。",
      },
      {
        slot: "social.boundary", label: "别把独处剪成冷场", dimension: "energy",
        strong: "你说想自己待着，就是要把镜头收回来。请勿追加“那我安静陪你聊”，这相当于给静音片硬装一位解说。",
        middle: "今天要不要有人同看，可以临时商量。上一场有观众，不代表下一场必须继续公开放映。",
      },
      {
        slot: "environment.balance", label: "外景之后留一间剪辑室", dimension: "energy",
        strong: "可以和喜欢的人看些新东西，然后独自消化。体验负责拍素材，安静负责找到你自己的镜头，剪辑室最好能关门。",
        middle: "让相处与独处像镜头切换一样自然。两个人并排看风景，也可以各有各的内心字幕，不必全程对台词。",
      },
    ],
    share: {
      titles: [caption("本片熟人可见"), caption("导演今天改结局"), caption("请勿强行配旁白")],
      faults: [
        high("原定去买菜，灵感一来突然把下午改成公路片。", "navigation"),
        high("说这首歌不错时，手已经开始比画完整分镜。", "expression"),
        low("陌生人想看完整版，售票窗口先请对方再熟一点。", "connection"),
        low("连续被人探班后，最想拍的是一段只有自己的空镜。", "energy"),
        caption("镜头突然停了，请先询问，是卡带还是导演要暂停。"),
      ],
      hidden: [
        high("能把难说的感受讲成画面，让对方终于有地方站。", "expression"),
        high("剧本不通就换个拍法，现场的小意外也能入镜。", "navigation"),
        low("熟人坐稳之后，预告片才慢慢长出正片的长度。", "connection"),
        low("独自回看一天的素材，常能认出真正喜欢的镜头。", "energy"),
        caption("本片保留重新剪辑权，一次失手不必拿来反复公映。"),
      ],
      warnings: [
        low("禁止强行包场围观，私人影院没有公开售票义务。", "connection"),
        high("请先吃饭再改人生剧本，饿着的导演容易把午饭删了。", "navigation"),
        caption("请勿拿一段花絮定全片类型，机主还在拍下一场。"),
      ],
      summaries: [
        high("今天的剧情可以拐弯，真实的感受不用被剪掉。", "navigation"),
        low("不是不放映，是想把完整版留给愿意坐下的人。", "connection"),
        caption("这部片子的主角有权暂停，观众请勿代替他按播放。"),
      ],
    },
    highlights: [
      "剧情随时可以改，观众名单不行；本片先在熟人小厅试映。",
      "原定去买菜，灵感一来突然把下午改成公路片。",
      "请勿拿一段花絮定全片类型，机主还在拍下一场。",
    ],
  },
  {
    key: "0111",
    direction: "限时营业惊喜快递舱：偶遇就能开箱，情绪当日达，回家必须补货。",
    positioning: "路上有新点子就想递给别人，回家发现库存管理员也是自己。",
    description: "见人就可能掉落新鲜笑点，但本舱补货时连门铃都算额外订单。",
    signature: "隐藏仓库不存贵重物品，只存“这个梗等会儿讲给谁听”。厂家偶尔盘点，发现机主自己先笑了。",
    warranty: "本舱售罄时仍是一台合格设备。人类非标制造有限公司不要求员工随身携带永不枯竭的惊喜库存。",
    manual: [
      {
        slot: "charging.drain", label: "新订单一路追到家", dimension: "energy",
        strong: "一路把新点子和感受递给别人，回家还被要求再来一个，库存管理员就想把自己贴上“暂不发货”。",
        middle: "今天想出去开箱还是留在家里补货，可以换班时再决定。最怕的是别人已经替你签下全天供应合同。",
      },
      {
        slot: "prohibited.decisions", label: "禁止把心动都寄出去", dimension: "navigation",
        strong: "临时想试的事先拆一个角，不要每件都当场下整箱订单。兴奋负责选品，时间和体力也得有退货审批权。",
        middle: "选一个最想试的小东西，其他留在待开箱区。犹豫不需要连同纸箱一起压扁，先试过再决定是否留着。",
      },
      {
        slot: "hidden.connection", label: "陌生人也能接住的包裹", dimension: "connection",
        strong: "你较容易找到一个可以一起笑的小入口，让新认识的人不用空手站在旁边。关系还没命名，话题已经先递过去了。",
        middle: "可以先递一份小话题，看对方愿不愿意拆。投缘就多聊两句，没继续也不必给自己写一张退件原因分析表。",
      },
      {
        slot: "social.boundary", label: "惊喜不承诺次次现货", dimension: "energy",
        strong: "今天安静不是货不对板，是机主正在补给。请勿拿上次的活跃截图要求同款发货，人又不是长期复印的赠品。",
        middle: "出门前问一句今天想热闹还是轻松，比预订整套惊喜更合适。机主可以换一种出场方式，无需提前发更换通知书。",
      },
      {
        slot: "environment.balance", label: "出门有新货，回家能封箱", dimension: "energy",
        strong: "适合碰到新鲜事之后有自己的缓冲时间。开箱和补货要轮班，不能因为外面有人等，就把仓库拆到只剩纸板。",
        middle: "把日子做成大小不同的盒子：有的装聚会，有的只装发呆。不要为了看起来充实，把所有空格都塞进人声。",
      },
    ],
    share: {
      titles: [caption("惊喜库存请查询"), caption("笑点开箱不包续杯"), caption("机主正在仓库补货")],
      faults: [
        high("出门只想拿快递，路上顺手给周末加了三个新玩法。", "navigation"),
        high("快乐刚从箱子探头，机主已经开始给路人做产品演示。", "expression"),
        high("认识没多久，话题已拆封，关系名称稍后补填。", "connection"),
        low("惊喜分发得太认真，回家发现自己只剩一个空纸箱。", "energy"),
        caption("舱门今天开不开，请问机主，别按上次的订单催货。"),
      ],
      hidden: [
        high("普通外出也能拆到小笑点，原包装写着平平无奇。", "navigation"),
        high("感受几乎当日达，对方不用在物流页猜运输状态。", "expression"),
        high("给刚见面的人一个能接的小话题，尴尬就少占一格。", "connection"),
        low("关门补货时，散在外面的注意力会逐件退回自己。", "energy"),
        caption("包装可以朴素，没藏惊喜的一天也允许正常签收。"),
      ],
      warnings: [
        low("禁止拿上次的活跃要求同款发货，人不是复印赠品。", "energy"),
        high("每个有趣点子都买单，周末很快会被订单反向收购。", "navigation"),
        caption("请勿把机主当永久赠品，照顾也该寄回发货地址。"),
      ],
      summaries: [
        high("与世界碰一下，可能掉出笑点，也可能长出新玩法。", "navigation"),
        low("开箱时很精彩，回家后也要允许纸箱安静地躺着。", "energy"),
        caption("本舱随人送达，快乐不计件，偶尔空箱也不扣分。"),
      ],
    },
    highlights: [
      "认识没多久，话题已拆封，关系名称稍后补填。",
      "禁止拿上次的活跃要求同款发货，人不是复印赠品。",
      "每个有趣点子都买单，周末很快会被订单反向收购。",
    ],
  },
];
