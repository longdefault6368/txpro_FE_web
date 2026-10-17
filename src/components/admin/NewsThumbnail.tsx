"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";

export function NewsThumbnail({ src, title }: { src: string | null; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div className="relative h-full w-full bg-slate-100">
    {src && !failed ? <>
      {!loaded && <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-slate-200 motion-reduce:animate-none" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={title} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={`h-full w-full object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`} />
    </> : <div className="flex h-full w-full items-center justify-center text-slate-400"><Newspaper className="h-5 w-5" aria-hidden="true" /></div>}
  </div>;
}
