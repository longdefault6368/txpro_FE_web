"use client";

import React from "react";
import Link from "next/link";
import type { NewsBlockNode, NewsInlineNode } from "@/lib/news-html";
import { NewsCover } from "./NewsCard";
import styles from "./News.module.css";

function renderInline(nodes: NewsInlineNode[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.type) {
      case "text":
        return <React.Fragment key={key}>{node.value}</React.Fragment>;
      case "br":
        return <br key={key} />;
      case "strong":
        return <strong key={key}>{renderInline(node.children, key)}</strong>;
      case "em":
        return <em key={key}>{renderInline(node.children, key)}</em>;
      case "del":
        return <del key={key}>{renderInline(node.children, key)}</del>;
      case "link":
        if (node.internal) {
          return (
            <Link key={key} href={node.href}>
              {renderInline(node.children, key)}
            </Link>
          );
        }
        return (
          <a key={key} href={node.href} target="_blank" rel="noopener noreferrer">
            {renderInline(node.children, key)}
          </a>
        );
    }
  });
}

export default function CmsBody({ blocks, fallbackAlt }: { blocks: NewsBlockNode[]; fallbackAlt: string }) {
  return (
    <div className={styles.cmsBody}>
      {blocks.map((block, index) => {
        const key = `b-${index}`;
        switch (block.type) {
          case "heading":
            if (block.level === 2) {
              return (
                <h2 key={key} id={block.id}>
                  {renderInline(block.children, key)}
                </h2>
              );
            }
            if (block.level === 3) {
              return <h3 key={key}>{renderInline(block.children, key)}</h3>;
            }
            return <h4 key={key}>{renderInline(block.children, key)}</h4>;
          case "paragraph":
            return <p key={key}>{renderInline(block.children, key)}</p>;
          case "list":
            return block.ordered ? (
              <ol key={key}>
                {block.items.map((item, itemIdx) => (
                  <li key={`${key}-li-${itemIdx}`}>{renderInline(item, `${key}-li-${itemIdx}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={key}>
                {block.items.map((item, itemIdx) => (
                  <li key={`${key}-li-${itemIdx}`}>{renderInline(item, `${key}-li-${itemIdx}`)}</li>
                ))}
              </ul>
            );
          case "blockquote":
            return <blockquote key={key}>{renderInline(block.children, key)}</blockquote>;
          case "callout":
            return (
              <div key={key} className={block.variant === "highlight" ? styles.cardHighlight : styles.cardNote}>
                {renderInline(block.children, key)}
              </div>
            );
          case "image":
            return (
              <figure key={key} className={styles.cmsFigure}>
                <NewsCover
                  source={block.src}
                  alt={block.alt || block.caption || fallbackAlt}
                  sizes="(max-width: 900px) 100vw, 760px"
                />
                {block.caption ? <figcaption>{block.caption}</figcaption> : null}
              </figure>
            );
          case "table":
            return (
              <div key={key} className={styles.tableWrap}>
                <table>
                  {block.headers.length > 0 && (
                    <thead>
                      <tr>
                        {block.headers.map((cell, cIdx) => (
                          <th key={`${key}-th-${cIdx}`}>{renderInline(cell, `${key}-th-${cIdx}`)}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {block.rows.map((row, rIdx) => (
                      <tr key={`${key}-tr-${rIdx}`}>
                        {row.map((cell, cIdx) => (
                          <td key={`${key}-td-${rIdx}-${cIdx}`}>{renderInline(cell, `${key}-td-${rIdx}-${cIdx}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "hr":
            return <hr key={key} />;
        }
      })}
    </div>
  );
}
