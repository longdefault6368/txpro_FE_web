export type SlideMetrics = { stride: number; visible: number; pages: number; maxScroll: number };
export function communitySlideMetrics(viewport: number, content: number, stride: number, count: number): SlideMetrics {
  const safeStride = Number.isFinite(stride) && stride > 0 ? stride : Math.max(1, viewport);
  const visible = Math.max(1, Math.min(count, Math.floor((viewport + 24) / safeStride)));
  return { stride: safeStride, visible, pages: Math.max(1, Math.ceil(count / visible)), maxScroll: Math.max(0, content - viewport) };
}
export function communitySlideTarget(page: number, metrics: SlideMetrics) {
  return Math.min(metrics.maxScroll, Math.max(0, Math.min(page, metrics.pages - 1)) * metrics.visible * metrics.stride);
}
export function communitySlidePage(scroll: number, metrics: SlideMetrics) {
  if (metrics.maxScroll <= 1) return 0;
  if (scroll >= metrics.maxScroll - 2) return metrics.pages - 1;
  return Math.min(metrics.pages - 1, Math.max(0, Math.round(scroll / (metrics.stride * metrics.visible))));
}
