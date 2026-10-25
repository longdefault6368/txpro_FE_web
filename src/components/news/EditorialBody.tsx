"use client";

import { Check, Lightbulb, ListChecks, Quote } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { NewsReadingGuide } from "@/lib/news-content";
import { NewsCover } from "./NewsCard";
import styles from "./News.module.css";

/** Structured first-party content only; CMS HTML never enters this rendering path. */
export default function EditorialBody({ guide }: { guide: NewsReadingGuide }) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  return <>
    <p className={styles.articleIntro}>{guide.intro}</p>
    <div className={styles.takeaways}>
      <h2><ListChecks size={21} aria-hidden="true" />{c("Điểm chính cần nhớ", "Key takeaways", "阅读要点")}</h2>
      <ul>{guide.takeaways.map(text => <li key={text}><Check size={17} aria-hidden="true" /><span>{text}</span></li>)}</ul>
    </div>
    {guide.sections.map((section, index) => {
      const mediaIndex = guide.sections.slice(0, index).filter(item => item.image).length;
      return <section key={section.heading} className={styles.storySection} aria-labelledby={"phan-" + index}>
        <div className={styles.sectionHeading}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h2 id={"phan-" + index}>{section.heading}</h2></div>
        <div className={[styles.storyContent, section.image && styles.withImage, section.image && mediaIndex % 2 === 1 && styles.imageLeft].filter(Boolean).join(" ")}>
          <div className={styles.storyText}>{section.paragraphs.map(text => <p key={text}>{text}</p>)}</div>
          {section.image && <figure className={styles.inlineFigure}>
            <NewsCover key={section.image.source} source={section.image.source} alt={section.image.alt} sizes="(max-width: 900px) 100vw, 360px" />
            <figcaption>{section.image.caption}</figcaption>
          </figure>}
        </div>
        {section.checklist && <div className={styles.checklist}><h3>{c("Kiểm tra trước khi tiếp tục", "Before you continue", "继续前请核对")}</h3><ul>{section.checklist.map(text => <li key={text}><Check size={17} aria-hidden="true" /><span>{text}</span></li>)}</ul></div>}
        {section.example && <div className={styles.example}><Quote size={22} aria-hidden="true" /><div><h3>{c("Tình huống tham khảo", "Practical guidance", "实用参考")}</h3><p>{section.example}</p></div></div>}
        {section.note && <div className={styles.editorialNote}><Lightbulb size={21} aria-hidden="true" /><div><h3>{c("Lưu ý", "Worth noting", "注意事项")}</h3><p>{section.note}</p></div></div>}
      </section>;
    })}
    <div className={styles.conclusion}><h2>{c("Trước khi bắt đầu", "Putting it into practice", "开始之前")}</h2><p>{guide.conclusion}</p></div>
  </>;
}
