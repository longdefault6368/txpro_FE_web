/** datetime-local values stay in browser local time until the existing payload builder converts to ISO. */
export function localPostingTime(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function validPostingTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && localPostingTime(date) === value;
}
export function pickedTimeError(value: string, { min = "", requireFuture = false, now = Date.now() } = {}) {
  if (!validPostingTime(value)) return "invalid";
  const timestamp = new Date(value).getTime();
  if (min && Number.isFinite(Date.parse(min)) && timestamp <= Date.parse(min)) return "min";
  if (requireFuture && timestamp <= now) return "past";
  return "";
}
export function initialPostingTime(value: string, min = "", now = Date.now()) {
  if (validPostingTime(value)) return value;
  return localPostingTime(new Date(Math.max(now + 3600000, Number.isFinite(Date.parse(min)) ? Date.parse(min) + 3600000 : 0)));
}
export function postingTimeDisplay(value: string, language: string) {
  if (!validPostingTime(value)) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : language === "zh" ? "zh-CN" : "vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value));
}
