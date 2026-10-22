/** Scene-only editorial remarks. Never read by the scorer or report selector. */
export const QUESTION_FIELD_NOTES = [
  { questionId: "Q01", text: "周五已宣布下班，电池部门尚未发表意见。" },
  { questionId: "Q02", text: "拿铁提前离职，桌面被迫接管了它的全部工作。" },
  { questionId: "Q03", text: "一堆木板申请成为家具，现征求本机的施工意见。" },
  { questionId: "Q04", text: "衣服还在脱水，两个人类已经进入同一段剧情。" },
  { questionId: "Q05", text: "日历凭空多出一整块地，本人拥有最终使用权。" },
  { questionId: "Q06", text: "友情和味蕾同时到场，本桌暂不设标准发言稿。" },
  { questionId: "Q07", text: "收藏夹向腿部提交了考察申请，批不批另说。" },
  { questionId: "Q08", text: "群头像开始长出实体，聊天记录正在学习三维站立。" },
  { questionId: "Q09", text: "饭局已经结账，电量部门正在盘点这顿饭的收支。" },
  { questionId: "Q10", text: "一份夸奖抵达机身，快递员询问由哪个部门签收。" },
  { questionId: "Q11", text: "旅行只有两晚，行李箱目前还没有发表膨胀声明。" },
  { questionId: "Q12", text: "合作告一段落，午饭部门发来下一份场景通知。" },
  { questionId: "Q13", text: "列车还没来，多出来的一小时先到了，请签收。" },
  { questionId: "Q14", text: "展览关闭了大门，期待暂时在门口没找到工位。" },
  { questionId: "Q15", text: "天气没有加入群聊，却直接修改了活动文件。" },
  { questionId: "Q16", text: "文字网友发来语音邀请，像素小人准备领声带。" },
  { questionId: "Q17", text: "待办清空了，客厅暂未提供下一集的剧情简介。" },
  { questionId: "Q18", text: "歌已经唱完，余音拒绝配合场馆清场。" },
  { questionId: "Q19", text: "九十分钟突然没有负责人，现移交本人处置。" },
  { questionId: "Q20", text: "订单被人类记住了，咖啡机仍只负责出咖啡。" },
] as const;

export function questionFieldNote(questionId: string): string | undefined {
  return QUESTION_FIELD_NOTES.find((item) => item.questionId === questionId)?.text;
}
