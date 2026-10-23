/** Scene-only editorial remarks. Never read by the scorer or report selector. */
export const QUESTION_FIELD_NOTES = [
  { questionId: "Q01", text: "周五下班，电池还没下班。" },
  { questionId: "Q02", text: "拿铁洒了，情绪也要擦吗？" },
  { questionId: "Q03", text: "木板正在申请家具编制。" },
  { questionId: "Q04", text: "邻居上线，洗衣机还在转。" },
  { questionId: "Q05", text: "空白日历，使用权归你。" },
  { questionId: "Q06", text: "友情和味蕾，同时在线。" },
  { questionId: "Q07", text: "收藏夹等着腿部审批。" },
  { questionId: "Q08", text: "群头像终于有了实体。" },
  { questionId: "Q09", text: "饭局散场，电量结算。" },
  { questionId: "Q10", text: "夸奖已送达，等你签收。" },
  { questionId: "Q11", text: "只住两晚，箱子先别膨胀。" },
  { questionId: "Q12", text: "合作暂停，午饭开场。" },
  { questionId: "Q13", text: "车没来，一小时先到了。" },
  { questionId: "Q14", text: "门关了，期待还站在外面。" },
  { questionId: "Q15", text: "天气擅自修改了计划。" },
  { questionId: "Q16", text: "像素好友申请语音通道。" },
  { questionId: "Q17", text: "待办清空，下一集待定。" },
  { questionId: "Q18", text: "音乐结束，余音拒绝散场。" },
  { questionId: "Q19", text: "九十分钟，临时归你。" },
  { questionId: "Q20", text: "店员记住了，咖啡机没有。" },
] as const;

export function questionFieldNote(questionId: string): string | undefined {
  return QUESTION_FIELD_NOTES.find((item) => item.questionId === questionId)
    ?.text;
}
