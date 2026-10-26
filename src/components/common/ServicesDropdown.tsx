"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Search, Truck } from "lucide-react";
import styles from "./ServicesDropdown.module.css";
type Item = { href: string; label: string; description: string };
export default function ServicesDropdown({ label, items, mobile = false, onNavigate }: {
  label: string; items: Item[]; mobile?: boolean; onNavigate?: () => void;
}) {
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target) && root.current) root.current.open = false; };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return <details ref={root} className={[styles.root, mobile && styles.mobile].filter(Boolean).join(" ")}
    onMouseEnter={event => { if (!mobile) event.currentTarget.open = true; }}
    onMouseLeave={event => { if (!mobile && !event.currentTarget.contains(document.activeElement)) event.currentTarget.open = false; }}
    onBlur={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}
    onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
    }}>
    <summary className={styles.trigger}>{label}<ChevronDown size={14} aria-hidden="true" /></summary>
    <div className={styles.panel}>
      <div className={styles.surface}>{items.map((item, index) => {
        const Icon = index === 0 ? Search : Truck;
        return <Link key={item.href} href={item.href} className={styles.item} onClick={() => { if (root.current) root.current.open = false; onNavigate?.(); }}>
          <span className={styles.icon}><Icon size={21} aria-hidden="true" /></span>
          <span><strong>{item.label}</strong><small>{item.description}</small></span>
        </Link>;
      })}</div>
    </div>
  </details>;
}
