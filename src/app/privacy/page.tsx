import Link from "next/link";
import { Header, Footer } from "@/components/brand";
import { routeMetadata } from "@/lib/metadata";
import "@/styles/release.css";
export const metadata = routeMetadata("隐私与使用须知", "/privacy");
export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main" className="privacy-page release-main">
        <span className="eyebrow">SMALL PRINT / 厂家认真说两句</span>
        <h1>
          你的日常，
          <br />
          不需要交给后台。
        </h1>
        <section>
          <h2>答案留在哪里</h2>
          <p>
            20题自测答案、好友8题观察进度和阅读配色保存在当前浏览器的本地存储。评分和报告生成在设备上完成，应用不把原始选项上传到服务器。清除网站数据会清除这些记录。浏览器不允许保存时，页面会明确提示刷新风险。
          </p>
        </section>
        <section>
          <h2>分享会公开什么</h2>
          <p>
            公开摘要和邀请链接包含邀请者四维分数、已选短句编号；朋友回传链接还包含朋友观察的四维分数。不包含姓名、联系方式、20题或8题原始选项，也不携带能反推出完整答案的私人设备编号。
          </p>
          <p>
            这些数据没有加密。任何拿到完整链接的人都可以查看，也可以修改链接；它不验证身份，不是可信凭证。请只分享你愿意公开的内容。图片保存到你的设备，只有你主动发送才会交给其他人或平台。
          </p>
        </section>
        <section>
          <h2>没有自动通知</h2>
          <p>
            本站没有注册、数据库或好友消息后台。朋友完成后，需要亲自把结果链接发回邀请者。看完朋友报告再做自己的测试，会使用独立的个人记录。
          </p>
        </section>
        <section>
          <h2>网站与第三方</h2>
          <p>
            应用没有加入广告、第三方统计或追踪脚本。访问网站仍会向部署服务发送常规网络请求，服务商可能记录IP地址、浏览器和请求路径等基础访问日志。分享摘要放在URL的“#”片段中，不作为页面请求参数发送给本站服务器；你把完整链接发给的聊天或分享平台仍能收到它。
          </p>
        </section>
        <section>
          <h2>只是一场认真娱乐</h2>
          <p>
            人格型号、质检部门、保修条款和事故报告属于虚构世界观。测试没有经过科学测量效度验证，不用于心理诊断；认知同步率只比较两组坐标，不衡量友情或谁更了解谁。
          </p>
        </section>
        <Link className="button-primary" href="/">
          返回人类设备检测中心 ↗
        </Link>
      </main>
      <Footer />
    </>
  );
}
