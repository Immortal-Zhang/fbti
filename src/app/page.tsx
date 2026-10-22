import Link from "next/link";
import { Header, Footer } from "@/components/brand";
import { DeviceIllustration } from "@/components/device-illustration";
import { DIMENSIONS } from "@/data/dimensions";
import { StartTest } from "@/features/home/start-test";
import { generatePersonalManual } from "@/lib/personal-manual/generate";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";
import "@/styles/home.css";

const example = generatePersonalManual(sampleAnswers(sampleScores("0101")));
const previewEntries = example.chapters.flatMap((chapter) =>
  chapter.entries
    .filter((entry) => ["charging.method", "hidden.practice", "warranty.promise"].includes(entry.id))
    .map((entry) => ({ ...entry, label: chapter.title })),
);

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">HUMAN USER MANUAL / VOL. 01</span>
            <h1 aria-label="你哪个厂的？">
              你哪个
              <br />
              <span>厂的？</span>
              <sup aria-hidden="true">01</sup>
            </h1>
            <p className="hero-tagline">
              你可能不了解自己，
              <br />
              但你的出厂设置已经暴露了。
            </p>
            <p className="hero-description">
              20 个日常场景，领取你的设备型号。
              <br />
              看说明书、存海报，再请朋友补一份旁观证词。
            </p>
            <StartTest />
            <div className="hero-meta">
              <span>
                <b>20</b> 个生活切片
              </span>
              <span>
                <b>04</b> 条性格坐标
              </span>
              <span>
                <b>16</b> 种人类设备
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-grid" />
            <div className="hero-orbit" />
            <div className="handling-sticker">
              HANDLE WITH
              <br />
              <strong>FEELINGS.</strong>
              <span>内有活人 · 请勿摇匀</span>
            </div>
            <span className="hero-annotation annotation-top mono">
              FIG. 09
              <br />
              HUMAN DEVICE
            </span>
            <DeviceIllustration
              shape="console"
              color="#3152ef"
              name="人类设备设计样机"
              className="hero-device"
            />
            <span className="hero-scanline" aria-hidden="true" />
            <div className="floating-label">
              <i />
              <span>
                运行状态：<b>厂家暂时解释不了</b>
              </span>
            </div>
            <div className="annotation-bottom">
              <span className="mono">
                NOT A BUG.
                <br />
                JUST YOUR SETTINGS.
              </span>
              <p>灯还亮着，工程师先下班了。</p>
            </div>
            <span className="hero-coordinate mono">
              HUM MFG. / 原创非标样机
            </span>
          </div>
        </section>
        <div className="edition-strip">
          <div>
            <span className="mono">EDITION 001</span>
            <span>原创人格娱乐档案</span>
          </div>
          <span className="edition-center">标准件暂未研制成功。</span>
          <div className="barcode" aria-hidden="true" />
          <span className="mono">SYSTEM V0.6.0</span>
        </div>
        <section className="blue-statement">
          <span className="statement-icon" aria-hidden="true">
            ✳
          </span>
          <p>
            本公司一直在找正常样机。
            <br />
            <strong>找了很久，只找到一堆有意思的人。</strong>
          </p>
          <span className="mono">
            DESIGNED FOR
            <br />
            BEING HUMAN.
          </span>
        </section>
        <section className="home-process" aria-label="检测流程">
          <div className="home-process-intro">
            <span className="eyebrow">A FEW MINUTES, JUST FOR YOU.</span>
            <h2>
              借你几分钟，
              <br />
              让厂家心虚一下。
            </h2>
          </div>
          <ol>
            <li>
              <span className="mono">01</span>
              <div>
                <h3>把日常选出来</h3>
                <p>20 个生活场景，请勿按演示机的表现作答。</p>
              </div>
            </li>
            <li>
              <span className="mono">02</span>
              <div>
                <h3>查出你的可疑型号</h3>
                <p>四条坐标，检查你的人类接口怎么接的。</p>
              </div>
            </li>
            <li>
              <span className="mono">03</span>
              <div>
                <h3>收下专属说明书</h3>
                <p>13 章出厂交代，工程师写完拒绝署名。</p>
              </div>
            </li>
          </ol>
        </section>
        <section
          className="home-manual-preview"
          id="manual-preview"
          aria-labelledby="home-manual-title"
        >
          <div className="home-preview-copy">
            <span className="eyebrow">TAKE A PEEK / 随手翻到的一页</span>
            <h2 id="home-manual-title">
              同样是人类，
              <br />
              使用禁忌还挺多。
            </h2>
            <p>
              有人接上饭局就满电，有人听见“再续一摊”就想拔网线。厂家决定分开写，免得互相烧坏。
            </p>
            <Link className="text-link" href="/devices">
              翻阅 16 种设备图鉴 <span aria-hidden="true">↗</span>
            </Link>
            <div className="preview-margin-note">
              <span aria-hidden="true">✳</span>
              <p>
                请保留说明书，
                <br />
                厂家没有备用的你。
              </p>
            </div>
          </div>
          <article className="home-paper">
            <div className="home-paper-head mono">
              <span>OWNER’S MANUAL</span>
              <span>{example.device.id}</span>
            </div>
            <div className="home-paper-device">
              <div>
                <span className="example-label">说明书样本 · 非你的结果</span>
                <h3>{example.device.name}</h3>
                <p>{example.device.description}</p>
              </div>
              <DeviceIllustration
                shape={example.device.shape}
                color={example.device.color}
                name={example.device.name}
              />
            </div>
            <div className="home-paper-notes">
              {previewEntries.map((section, index) => (
                  <div key={section.id}>
                    <span className="mono">0{index + 1}</span>
                    <div>
                      <h4>{section.label}</h4>
                      <p>{section.text}</p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="home-paper-foot">
              <span>出厂不包完美，售后不问业绩。</span>
              <div className="barcode" aria-hidden="true" />
            </div>
          </article>
        </section>
        <section
          className="system-section"
          id="system"
          aria-labelledby="system-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">UNDER THE HOOD / 阅读之前</span>
              <h2 id="system-title">
                笑归笑，
                <br />
                螺丝是按顺序拧的。
              </h2>
            </div>
            <Link className="text-link" href="/devices">
              查看人类设备图鉴 ↗
            </Link>
          </div>
          <div className="system-columns">
            <div>
              <p className="system-lead">
                我们用四条连续坐标，
                <br />
                描述你此刻的行为偏好。
              </p>
              <p>
                每条坐标由 5 个生活场景组成，正向与反向题共同计分。16
                种型号提供一个记忆入口，具体说明跟随分数、强弱和组合变化。
              </p>
              <p>
                40–60 分保留为中间倾向。型号不是身份标签，也不是一个人的全部。
              </p>
            </div>
            <dl>
              {DIMENSIONS.map((dimension) => (
                <div key={dimension.id}>
                  <dt>
                    <span className="mono">{dimension.index}</span>
                    {dimension.name}
                  </dt>
                  <dd>
                    {dimension.lowLabel}
                    <span aria-hidden="true">↔</span>
                    {dimension.highLabel}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="home-faq">
            <details>
              <summary>
                这是心理学测试吗？<span aria-hidden="true">+</span>
              </summary>
              <p>
                这是一份原创人格娱乐与自我探索体验，没有经过科学测量效度验证，也不用于心理诊断。你可以把它当作理解日常习惯的一个小入口。
              </p>
            </details>
            <details>
              <summary>
                中途离开，答案还在吗？<span aria-hidden="true">+</span>
              </summary>
              <p>
                浏览器允许本地存储时，每次选择都会保存在本机。回来可从上次的位置继续。若浏览器阻止保存，页面会提示你；此时请在当前页面完成，刷新或关闭可能丢失进度。
              </p>
            </details>
            <details>
              <summary>
                答案会上传吗？需要付费吗？<span aria-hidden="true">+</span>
              </summary>
              <p>
                答题与评分在你的浏览器内完成，应用不会上传答案。无需注册，也无需付费查看结果。清除浏览器的网站数据会清除本机记录。
              </p>
            </details>
          </div>
        </section>
        <section className="home-closing">
          <span className="eyebrow">READY WHEN YOU ARE.</span>
          <h2>
            人类设备检测中心，
            <br />
            现在轮到你了。
          </h2>
          <Link className="button-primary" href="/quiz">
            检测我的出厂设置 <span aria-hidden="true">↗</span>
          </Link>
          <p>无需准备优秀事迹。带上本人和离谱日常即可。</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
