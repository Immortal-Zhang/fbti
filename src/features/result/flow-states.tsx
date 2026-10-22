import Link from "next/link";

export function ReportLoading() {
  return (
    <main id="main" className="report-empty" aria-busy="true">
      <span className="eyebrow">HUM / LOCAL ARCHIVE</span>
      <div className="loading-receipt" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h1>档案员正在从椅子底下抽出你的说明书。</h1>
      <p role="status">读取这台设备上的答题记录……</p>
      <noscript>
        <p>测试和结果读取需要 JavaScript。请在浏览器启用后刷新页面。</p>
      </noscript>
    </main>
  );
}

export function ReportUnavailable({
  count,
  notice,
}: {
  count: number;
  notice: string | null;
}) {
  return (
    <main id="main" className="report-empty">
      <span className="eyebrow">HUM / A FEW PAGES TO GO</span>
      <div className="empty-page-mark" aria-hidden="true">
        {String(count).padStart(2, "0")}
        <span>/ 20</span>
      </div>
      <h1>
        {count === 20
          ? "回答齐了，还差你的最后确认。"
          : count > 0
            ? "零件没到齐，工程师拒绝盲装。"
            : "请先提交二十份人类使用现场。"}
      </h1>
      <p>
        {count === 20
          ? "目前保留了 20 道回答。返回测试并确认提交后，就能领取这一次的真实结果。"
          : count > 0
            ? `目前保留了 ${count} 道回答。完成全部题目并确认后，才能领取真实结果。`
            : "这里还没有已完成的测试。回答二十个生活场景，就能拿到属于你的设备档案。"}
      </p>
      {notice && (
        <p className="report-inline-notice" role="status">
          {notice}
        </p>
      )}
      <div className="report-empty-actions">
        <Link className="button-primary" href="/quiz">
          {count > 0 ? "继续完成测试" : "检测我的出厂设置"}
          <span aria-hidden="true">↗</span>
        </Link>
        <Link className="text-link" href="/">
          返回首页
        </Link>
      </div>
    </main>
  );
}

export function PersistenceNotice({
  notice,
  memory,
  retry,
}: {
  notice: string | null;
  memory: boolean;
  retry: () => void;
}) {
  if (!notice && !memory) return null;
  return (
    <div className="report-persistence" role="status">
      <span aria-hidden="true">!</span>
      <p>
        {notice ||
          "当前回答仅保留在本次页面会话中。浏览器未允许保存，刷新或关闭页面可能丢失当前记录。"}
      </p>
      {memory && (
        <button type="button" onClick={retry}>
          重试保存
        </button>
      )}
    </div>
  );
}
