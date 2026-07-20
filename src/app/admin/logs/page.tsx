"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Search, TerminalSquare } from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "http" | string;
  source: string;
  message: string;
  meta?: unknown;
}

const LEVEL_STYLE: Record<string, string> = {
  error: "bg-red-50 text-red-700 border-red-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  http: "bg-blue-50 text-blue-700 border-blue-200",
  debug: "bg-slate-50 text-slate-600 border-slate-200",
  info: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const formatDateTime = (value?: string) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "300" });
    if (level) params.set("level", level);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [level, search]);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/system/logs?${query}`);
      if (!res.ok) throw new Error("Không thể tải log backend");
      const data = await res.json();
      const rawLogs = data.data?.logs || [];
      const filteredLogs = rawLogs.filter((log: LogEntry) => 
        !log.message.includes("/api/v1/admin/users/system/logs")
      );
      setLogs(filteredLogs);
    } catch (error) {
      console.warn("Admin logs API failed", error);
      setLogs([]);
      setErrorMessage("Không thể tải log backend. Vui lòng kiểm tra server hoặc đăng nhập admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const timer = window.setInterval(fetchLogs, 10000);
    return () => window.clearInterval(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <TerminalSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">Log hệ thống</h1>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Hiển thị các log backend gần đây từ console và HTTP request.
            </p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/60 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm trong log..."
            className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-primary-500"
        >
          <option value="">Tất cả level</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="http">HTTP</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-bold text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-950 shadow-xl">
        <div className="border-b border-white/10 px-5 py-3 text-xs font-bold text-slate-400">
          {loading ? "Đang tải log..." : `${logs.length} dòng log gần nhất`}
        </div>
        <div className="max-h-[680px] overflow-auto">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-slate-500">Chưa có log phù hợp</div>
          ) : (
            <div className="divide-y divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="grid gap-3 px-5 py-4 text-xs md:grid-cols-[170px_84px_90px_1fr]">
                  <span className="font-mono text-slate-500">{formatDateTime(log.timestamp)}</span>
                  <span className={`w-fit rounded-lg border px-2 py-1 font-black uppercase ${LEVEL_STYLE[log.level] || LEVEL_STYLE.info}`}>
                    {log.level}
                  </span>
                  <span className="font-bold text-slate-500">{log.source}</span>
                  <pre className="whitespace-pre-wrap break-words font-mono leading-5 text-slate-200">{log.message}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
