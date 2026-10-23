import { orderedQuestionOptions, QUESTION_COPY_REVISION } from "@/data/questions/presentation";
import { routeMetadata } from "@/lib/metadata";
import Link from "next/link";
import { Header, Footer } from "@/components/brand";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { QuestionFieldNote } from "@/components/question-field-note";

export const metadata = routeMetadata("20个人类生活现场", "/questions", false);

export default function QuestionsPage() {
  return (
    <>
      <Header />
      <main id="main" className="questions-main" data-question-copy={QUESTION_COPY_REVISION}>
        <div className="questions-intro">
          <Link href="/devices" className="text-link">
            ← 返回设备档案
          </Link>
          <span className="eyebrow">CONTENT CONTACT SHEET / 20 SCENES</span>
          <h1>
            二十个人类现场，
            <br />
            总有你的案发方式。
          </h1>
          <p>
            没有正确选项，也没有更优秀的回答。
            <br />
            这里是完整题库阅览页。想收下自己的说明书，请从正式检测开始。
          </p>
          <Link href="/quiz" className="text-link">
            开始我的检测 ↗
          </Link>
        </div>
        <div className="question-list">
          {SELF_QUESTIONS.map((question, index) => (
            <article className="question-sample" key={question.id}>
              <div className="question-rail">
                <span className="mono">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{question.scene}</span>
              </div>
              <div className="question-body">
                <h2>{question.prompt}</h2>
                <ol>
                  {orderedQuestionOptions(question).map((option, optionIndex) => (
                    <li key={option.id}>
                      <span className="option-letter mono">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option.text}</span>
                    </li>
                  ))}
                </ol>
                <QuestionFieldNote questionId={question.id} />
              </div>
            </article>
          ))}
        </div>
        <div className="question-end">
          <span className="mono">END OF CONTACT SHEET</span>
          <p>题库到此结束。厂家等待你的现场证词。</p>
          <Link className="button-primary" href="/devices">
            回到设备档案 <span>↗</span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
