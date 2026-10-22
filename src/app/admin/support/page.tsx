"use client";

import { useEffect, useEffectEvent, useMemo, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  Headset,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Search,
  Send,
  TicketCheck,
  UserRound,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";

type SupportTab = "tickets" | "chats";

interface UserInfo {
  _id?: string;
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
}

interface TicketMessage {
  _id?: string;
  senderRole: "shipper" | "driver" | "admin" | "assistant";
  senderName: string;
  message: string;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  userId?: UserInfo;
  title: string;
  category: string;
  description: string;
  images?: string[];
  status: "pending" | "open" | "in_progress" | "resolved" | "closed";
  conversation: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  _id: string;
  senderId?: UserInfo;
  messageType: "text" | "image" | "file";
  content: string;
  isRead?: boolean;
  createdAt: string;
}

interface SupportChat {
  _id: string;
  supportChannel?: string;
  orderId?: { _id?: string; orderCode?: string; title?: string; status?: string } | null;
  participants?: UserInfo[];
  lastMessageAt?: string | null;
  updatedAt: string;
}

interface ChatRow {
  chat: SupportChat;
  lastMessage?: ChatMessage | null;
}


const CATEGORY_LABEL: Record<string, string> = {
  technical: "Lỗi kỹ thuật",
  payment: "Thanh toán & Ví",
  order_dispute: "Tranh chấp đơn",
  accident: "Sự cố vận chuyển",
  other: "Khác",
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ xử lý", className: "text-amber-700 bg-amber-50 border-amber-200" },
  open: { label: "Đang mở", className: "text-blue-700 bg-blue-50 border-blue-200" },
  in_progress: { label: "Đang xử lý", className: "text-primary-700 bg-primary-50 border-primary-200" },
  resolved: { label: "Đã xử lý", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  closed: { label: "Đã đóng", className: "text-slate-600 bg-slate-50 border-slate-200" },
};

const CHAT_CHANNEL_LABEL: Record<string, string> = {
  technical: "Kỹ thuật & ứng dụng", payment: "Thanh toán & ví",
  order_dispute: "Đơn & chuyến đi", accident: "Sự cố vận chuyển", other: "Hỗ trợ khác",
};

const ROLE_LABEL: Record<string, string> = {
  "chu-hang": "Chủ hàng",
  "tai-xe": "Tài xế",
  shipper: "Chủ hàng",
  driver: "Tài xế",
  admin: "Admin",
  assistant: "Hệ thống",
};

const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString("vi-VN") : "---";

function AdminSupportContent() {
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab");
  const queryChatId = searchParams.get("chatId");
  const queryUserId = searchParams.get("userId");
  const queryTicketId = searchParams.get("ticketId");

  const [tab, setTab] = useState<SupportTab>(
    queryTab === "chats" || queryChatId || queryUserId ? "chats" : (queryTab === "tickets" || queryTicketId ? "tickets" : "tickets")
  );
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedChat, setSelectedChat] = useState<{ chat: SupportChat; messages: ChatMessage[] } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [chatMessageText, setChatMessageText] = useState("");
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false,
    success: true,
    message: "",
  });

  const showToast = (success: boolean, message: string) => {
    setToast({ show: true, success, message });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRequestVersion = useRef(0);
  const activeChatId = useRef<string | null>(null);
  const chatDrafts = useRef<Record<string, string>>({});
  const lastQuery = useRef<string | null>(null);

  useEffect(() => {
    if (selectedChat?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChat?.messages]);

  const sendChatMessage = async () => {
    if (!selectedChat || detailLoading || !chatMessageText.trim() || sendingChatMessage) return;
    setSendingChatMessage(true);
    const content = chatMessageText.trim();
    const chatId = selectedChat.chat._id;

    if (!/^[0-9a-fA-F]{24}$/.test(chatId)) {
      setSendingChatMessage(false);
      showToast(false, "Hội thoại không hợp lệ. Vui lòng tải lại.");
      return;
    }

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/support/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, content, messageType: "text" }),
      });


      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Lỗi máy chủ (${res.status})`);
      }

      const data = await res.json();
      const newMsg: ChatMessage = data.data?.message || {
        _id: data.data?.id || `msg-${Date.now()}`,
        senderId: { name: "Admin TXEPRO", role: "admin" },
        messageType: "text",
        content,
        createdAt: data.data?.sentAt || new Date().toISOString(),
      };

      setSelectedChat((prev) => prev?.chat._id === chatId ? {
        ...prev,
        messages: prev.messages.some(message => message._id === newMsg._id) ? prev.messages : [...prev.messages, newMsg],
      } : prev);
      setChats((prev) => prev.map((row) => row.chat._id === chatId ? {
        ...row,
        lastMessage: newMsg,
        chat: { ...row.chat, lastMessageAt: new Date().toISOString() },
      } : row));
      if (chatDrafts.current[chatId]?.trim() === content) chatDrafts.current[chatId] = "";
      if (activeChatId.current === chatId) setChatMessageText(current => current.trim() === content ? "" : current);
      setIsOffline(false);
      showToast(true, "Đã gửi tin nhắn tới người dùng thành công");
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : "Không thể gửi. Nội dung vẫn được giữ để thử lại.");
      setIsOffline(true);
    } finally {
      setSendingChatMessage(false);
    }
  };


  const fetchTickets = async (targetTicketId?: string | null) => {
    setLoading(true);
    const query = new URLSearchParams({
      limit: "50",
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/support/tickets?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch support tickets");
      const data = await res.json();
      const nextTickets = data.data?.tickets || [];
      setTickets(nextTickets);

      const desiredTicketId = targetTicketId;
      if (desiredTicketId) {
        const found = nextTickets.find((item: SupportTicket) => item._id === desiredTicketId);
        if (found) {
          setSelectedTicket(found);
          await openTicket(found._id);
        } else {
          await openTicket(desiredTicketId);
        }
      } else if (nextTickets[0]) {
        setSelectedTicket(current => nextTickets.find((ticket: SupportTicket) => ticket._id === current?._id) || nextTickets[0]);
      } else {
        setSelectedTicket(null);
      }
      setIsOffline(false);
    } catch {
      setIsOffline(true);
      showToast(false, "Không thể tải yêu cầu hỗ trợ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async (targetChatId?: string | null, targetUserId?: string | null) => {
    setLoading(true);
    const query = new URLSearchParams({
      limit: "50",
      ...(search ? { search } : {}),
      ...(channelFilter ? { channel: channelFilter } : {}),
    });
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/support/chats?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch support chats");
      const data = await res.json();
      const nextChats: ChatRow[] = data.data?.chats || [];
      setChats(nextChats);

      const desiredChatId = targetChatId;
      const desiredUserId = targetUserId;

      let chatToOpen: string | null = null;
      if (desiredChatId) {
        const found = nextChats.find((c) => c.chat._id === desiredChatId);
        chatToOpen = found ? found.chat._id : desiredChatId;
      } else if (desiredUserId) {
        const foundByUser = nextChats.find((c) =>
          c.chat.participants?.some((p) => p._id === desiredUserId || p.id === desiredUserId)
        );
        if (foundByUser) {
          chatToOpen = foundByUser.chat._id;
        }
      }

      if (chatToOpen) {
        await openChat(chatToOpen, false);
      } else if (nextChats[0]) {
        const previous = nextChats.find(row => row.chat._id === activeChatId.current);
        await openChat((previous || nextChats[0]).chat._id, false);
      } else {
        activeChatId.current = null;
        setChatMessageText("");
        setSelectedChat(null);
      }
      setIsOffline(false);
    } catch {
      setIsOffline(true);
      showToast(false, "Không thể tải hội thoại hỗ trợ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const refreshFromQuery = useEffectEvent(() => {
    const queryKey = JSON.stringify([queryTab, queryChatId, queryUserId, queryTicketId]);
    const queryChanged = lastQuery.current !== queryKey;
    lastQuery.current = queryKey;
    const isChatMode = queryTab === "chats" || Boolean(queryChatId) || Boolean(queryUserId);
    const isTicketMode = queryTab === "tickets" || Boolean(queryTicketId);

    if (queryChanged && isChatMode) {
      if (tab !== "chats") setTab("chats");
      fetchChats(queryChatId, queryUserId);
    } else if (queryChanged && isTicketMode) {
      if (tab !== "tickets") setTab("tickets");
      fetchTickets(queryTicketId);
    } else {
      if (tab === "tickets") fetchTickets();
      else fetchChats();
    }
  });
  useEffect(() => {
    const timer = window.setTimeout(() => refreshFromQuery(), 0);
    return () => window.clearTimeout(timer);
  }, [queryTab, queryChatId, queryUserId, queryTicketId, search, statusFilter, channelFilter]);

  const handleTabChange = (nextTab: SupportTab) => {
    setTab(nextTab);
    if (nextTab === "tickets") {
      fetchTickets();
    } else {
      fetchChats();
    }
  };

  async function openTicket(ticketId: string) {
    if (tab !== "tickets") setTab("tickets");
    setDetailLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Failed to fetch ticket detail");
      const data = await res.json();
      setSelectedTicket(data.data.ticket);
      setIsOffline(false);
    } catch (err) {
      console.warn("Ticket detail API offline", err);
      setSelectedTicket(tickets.find((ticket) => ticket._id === ticketId) || null);
    } finally {
      setDetailLoading(false);
    }
  };

  async function openChat(chatId: string, showLoading = true) {
    const version = ++chatRequestVersion.current;
    if (tab !== "chats") setTab("chats");
    if (showLoading) setDetailLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/support/chats/${chatId}`);
      if (!res.ok) throw new Error("Failed to fetch chat detail");
      const data = await res.json();
      const loadedChat = data.data.chat;
      const loadedMessages = data.data.messages || [];
      if (version !== chatRequestVersion.current) return;
      activeChatId.current = loadedChat._id;
      setChatMessageText(chatDrafts.current[loadedChat._id] || "");
      setSelectedChat({ chat: loadedChat, messages: loadedMessages });
      setChats((prev) => {
        if (!prev.some((c) => c.chat._id === loadedChat._id)) {
          return [{ chat: loadedChat, lastMessage: loadedMessages[loadedMessages.length - 1] || null }, ...prev];
        }
        return prev;
      });
      setIsOffline(false);
    } catch {
      setIsOffline(true);
      showToast(false, "Không thể tải hội thoại. Vui lòng thử lại.");
    } finally {
      if (showLoading && version === chatRequestVersion.current) setDetailLoading(false);
    }
  };

  const sendTicketReply = async (status: SupportTicket["status"] = "in_progress", statusOnly = false) => {
    if (!selectedTicket || sendingReply || (!statusOnly && !replyMessage.trim())) return;
    const ticketId = selectedTicket._id;
    const message = replyMessage.trim();
    setSendingReply(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/support/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(!statusOnly ? { message } : {}), status }),
      });
      if (!res.ok) throw new Error("Không thể cập nhật yêu cầu hỗ trợ.");
      const data = await res.json();
      const updated: SupportTicket = data.data.ticket;
      setSelectedTicket(current => current?._id === ticketId ? updated : current);
      setTickets(current => current.map(ticket => ticket._id === ticketId ? updated : ticket));
      if (!statusOnly) setReplyMessage(current => current.trim() === message ? "" : current);
      setIsOffline(false);
      showToast(true, statusOnly ? "Đã cập nhật trạng thái" : "Đã gửi phản hồi tới người dùng");
    } catch {
      setIsOffline(true);
      showToast(false, "Chưa gửi được tới người dùng. Nội dung vẫn được giữ để thử lại.");
    } finally {
      setSendingReply(false);
    }
  };

  // Poll only while visible; do not reset the selected ticket or overwrite drafts.
  useEffect(() => {
    if (tab !== "tickets") return;
    let disposed = false;
    let busy = false;
    const refresh = async () => {
      if (busy || document.hidden || sendingReply) return;
      busy = true;
      try {
        const query = new URLSearchParams({ limit: "50", ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) });
        const response = await fetchWithAuth(`${API_BASE}/admin/users/support/tickets?${query}`);
        if (!response.ok) throw new Error("offline");
        const payload = await response.json();
        if (!disposed) { setTickets(payload.data?.tickets || []); setIsOffline(false); }
        if (selectedTicket?._id) {
          const detail = await fetchWithAuth(`${API_BASE}/admin/users/support/tickets/${selectedTicket._id}`);
          if (!detail.ok) throw new Error("offline");
          const data = await detail.json();
          if (!disposed) setSelectedTicket(current =>
            current && current._id === data.data.ticket._id && new Date(data.data.ticket.updatedAt) >= new Date(current.updatedAt)
              ? data.data.ticket : current);
        }
      } catch {
        if (!disposed) setIsOffline(true);
      } finally { busy = false; }
    };
    const timer = window.setInterval(refresh, 5000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [tab, selectedTicket?._id, search, statusFilter, sendingReply]);

  // Refresh the real conversation without resetting selection, drafts or scroll.
  useEffect(() => {
    if (tab !== "chats") return;
    let disposed = false;
    let busy = false;
    const refresh = async () => {
      if (busy || document.hidden || sendingChatMessage || detailLoading) return;
      busy = true;
      try {
        const query = new URLSearchParams({ limit: "50", ...(search ? { search } : {}), ...(channelFilter ? { channel: channelFilter } : {}) });
        const response = await fetchWithAuth(`${API_BASE}/admin/users/support/chats?${query}`);
        if (!response.ok) throw new Error("offline");
        const data = await response.json();
        if (disposed) return;
        setChats(data.data?.chats || []);
        if (selectedChat?.chat._id) {
          const detail = await fetchWithAuth(`${API_BASE}/admin/users/support/chats/${selectedChat.chat._id}`);
          if (!detail.ok) throw new Error("offline");
          const payload = await detail.json();
          if (!disposed) setSelectedChat(current => {
            if (!current || current.chat._id !== payload.data.chat._id) return current;
            const messages: ChatMessage[] = payload.data.messages || [];
            if (JSON.stringify(current.messages) === JSON.stringify(messages)) return current;
            return { chat: payload.data.chat, messages };
          });
        }
        if (!disposed) setIsOffline(false);
      } catch {
        if (!disposed) setIsOffline(true);
      } finally { busy = false; }
    };
    const timer = window.setInterval(refresh, 3000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [tab, selectedChat?.chat._id, search, channelFilter, sendingChatMessage, detailLoading]);

  const supportStats = useMemo(() => ({
    pending: tickets.filter((ticket) => ticket.status === "pending" || ticket.status === "open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length,
  }), [tickets]);

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" /> Chưa kết nối được hệ thống. Dữ liệu có thể chưa cập nhật; phản hồi chưa gửi sẽ được giữ lại để thử lại.
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trung Tâm Hỗ Trợ</h1>
          <p className="text-slate-400 text-xs mt-1">Theo dõi live chat và ticket/request người dùng gửi cho TXEPRO.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
          <div className="bg-white rounded-2xl border border-slate-200/50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Chờ xử lý</p>
            <p className="text-xl font-bold text-amber-600">{supportStats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Đang xử lý</p>
            <p className="text-xl font-bold text-primary-600">{supportStats.inProgress}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Đã xử lý</p>
            <p className="text-xl font-bold text-emerald-600">{supportStats.resolved}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-5 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => handleTabChange("tickets")}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${tab === "tickets" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500"}`}
          >
            <TicketCheck className="w-4 h-4" /> Ticket
          </button>
          <button
            onClick={() => handleTabChange("chats")}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${tab === "chats" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500"}`}
          >
            <MessagesSquare className="w-4 h-4" /> Live chat
          </button>
        </div>

        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "tickets" ? "Tìm ticket theo tiêu đề, nội dung, người gửi..." : "Tìm live chat theo mã đơn, người nhắn, nội dung..."}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {tab === "tickets" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full lg:w-48 px-4 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABEL).map(([value, item]) => (
              <option key={value} value={value}>{item.label}</option>
            ))}
          </select>
        )}

        {tab === "chats" && (
          <select aria-label="Kênh hỗ trợ" value={channelFilter} onChange={event => setChannelFilter(event.target.value)}
            className="w-full lg:w-48 px-4 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold bg-white">
            <option value="">Tất cả kênh hỗ trợ</option>
            {Object.entries(CHAT_CHANNEL_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        )}

        <button
          onClick={() => tab === "tickets" ? fetchTickets() : fetchChats()}
          className="px-4 py-3 border border-slate-200 rounded-2xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
          title="Tải lại"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            {tab === "tickets" ? <TicketCheck className="w-4 h-4 text-primary-600" /> : <MessageCircle className="w-4 h-4 text-primary-600" />}
            <h2 className="text-sm font-bold text-slate-900">{tab === "tickets" ? "Ticket / Request" : "Live chat người dùng"}</h2>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-slate-400 text-xs mt-4">Đang tải dữ liệu hỗ trợ...</p>
            </div>
          ) : tab === "tickets" ? (
            <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
              {tickets.length === 0 ? (
                <p className="text-center py-16 text-xs font-bold text-slate-400">Chưa có ticket phù hợp</p>
              ) : tickets.map((ticket) => {
                const statusInfo = STATUS_LABEL[ticket.status] || STATUS_LABEL.pending;
                return (
                  <button
                    key={ticket._id}
                    onClick={() => openTicket(ticket._id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer ${selectedTicket?._id === ticket._id ? "bg-primary-50/70" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{ticket.title}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate">{ticket.userId?.name || "Người dùng"} · {CATEGORY_LABEL[ticket.category] || ticket.category}</p>
                      </div>
                      <span className={`shrink-0 border rounded-lg px-2 py-1 text-[10px] font-bold ${statusInfo.className}`}>{statusInfo.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{ticket.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(ticket.updatedAt)}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
              {chats.length === 0 ? (
                <p className="text-center py-16 text-xs font-bold text-slate-400">Chưa có live chat phù hợp</p>
              ) : chats.map((row) => {
                const otherUser = row.chat.participants?.find((p) => p.role !== "admin") || row.chat.participants?.[0];
                const displayTitle = otherUser?.name || row.chat.orderId?.orderCode || "Hỗ trợ người dùng";
                const displaySubtitle = [
                  CHAT_CHANNEL_LABEL[row.chat.supportChannel || ""] || "Hỗ trợ chung",
                  otherUser ? (ROLE_LABEL[otherUser.role || ""] || otherUser.role) : null,
                  otherUser?.phone,
                  row.chat.orderId?.orderCode ? `Đơn: ${row.chat.orderId.orderCode}` : null,
                ].filter(Boolean).join(" · ");

                return (
                  <button
                    key={row.chat._id}
                    onClick={() => openChat(row.chat._id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${selectedChat?.chat._id === row.chat._id ? "bg-primary-50/70 border-primary-600" : "border-transparent"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{displayTitle}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate">{displaySubtitle || "---"}</p>
                      </div>
                      {row.chat.orderId?._id && (
                        <Link href={`/admin/orders/${row.chat.orderId._id}`} className="text-[10px] font-bold text-primary-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          Đơn
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{row.lastMessage?.content || "Chưa có tin nhắn"}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(row.lastMessage?.createdAt || row.chat.lastMessageAt || row.chat.updatedAt)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden min-h-[620px] flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                {tab === "tickets" ? <TicketCheck className="w-5 h-5" /> : <Headset className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {tab === "tickets"
                    ? selectedTicket?.title || "Chi tiết ticket"
                    : (() => {
                        const otherP = selectedChat?.chat.participants?.find((p) => p.role !== "admin") || selectedChat?.chat.participants?.[0];
                        return otherP?.name || selectedChat?.chat.orderId?.orderCode || "Hội thoại hỗ trợ";
                      })()}
                </h2>
                <p className="text-xs font-semibold text-slate-400">
                  {detailLoading
                    ? "Đang tải chi tiết..."
                    : tab === "tickets"
                    ? selectedTicket?.userId?.name || "---"
                    : (() => {
                        const otherP = selectedChat?.chat.participants?.find((p) => p.role !== "admin") || selectedChat?.chat.participants?.[0];
                        return [
                          CHAT_CHANNEL_LABEL[selectedChat?.chat.supportChannel || ""] || "Hỗ trợ chung",
                          otherP ? (ROLE_LABEL[otherP.role || ""] || otherP.role) : null,
                          otherP?.phone,
                          selectedChat?.chat.orderId?.orderCode ? `Đơn: ${selectedChat.chat.orderId.orderCode}` : null,
                        ].filter(Boolean).join(" · ") || "Trò chuyện trực tiếp";
                      })()}
                </p>
              </div>
            </div>
            {tab === "tickets" && selectedTicket && (
              <select aria-label="Trạng thái yêu cầu hỗ trợ" value={selectedTicket.status}
                disabled={sendingReply || detailLoading}
                onChange={event => sendTicketReply(event.target.value as SupportTicket['status'], true)}
                className="border rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-800">
                {Object.entries(STATUS_LABEL).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
              </select>
            )}
          </div>

          {tab === "tickets" ? (
            selectedTicket ? (
              <>
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <p><span className="font-bold text-slate-400 uppercase">Người gửi:</span> <span className="font-bold text-slate-800">{selectedTicket.userId?.name || "---"}</span></p>
                    <p><span className="font-bold text-slate-400 uppercase">Vai trò:</span> <span className="font-bold text-slate-800">{ROLE_LABEL[selectedTicket.userId?.role || ""] || selectedTicket.userId?.role || "---"}</span></p>
                    <p><span className="font-bold text-slate-400 uppercase">Liên hệ:</span> <span className="font-bold text-slate-800">{selectedTicket.userId?.phone || selectedTicket.userId?.email || "---"}</span></p>
                  </div>
                  <p className="mt-3 text-slate-600 font-semibold leading-relaxed">{selectedTicket.description}</p>
                  {!!selectedTicket.images?.length && <div className="flex gap-2 mt-3">
                    {selectedTicket.images.filter(image => typeof image === 'string' && image.startsWith('/uploads/')).map((image, index) => {
                      const url = `${API_BASE.replace(/\/api\/v1\/?$/, '')}${image}`;
                      return <a href={url} target="_blank" rel="noopener noreferrer" key={image}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Ảnh đính kèm ${index + 1}`} className="w-24 h-24 rounded-xl object-cover border" />
                      </a>;
                    })}
                  </div>}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
                  {selectedTicket.conversation.map((message, index) => {
                    const fromAdmin = message.senderRole === "admin" || message.senderRole === "assistant";
                    return (
                      <div key={message._id || index} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 border ${fromAdmin ? "bg-primary-600 text-white border-primary-600" : "bg-white text-slate-700 border-slate-100"}`}>
                          <p className={`text-[10px] font-bold uppercase mb-1 ${fromAdmin ? "text-primary-100" : "text-slate-400"}`}>{message.senderName} · {ROLE_LABEL[message.senderRole] || message.senderRole}</p>
                          <p className="text-sm font-semibold leading-relaxed">{message.message}</p>
                          <p className={`text-[10px] font-bold mt-2 ${fromAdmin ? "text-primary-100" : "text-slate-400"}`}>{formatDateTime(message.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white">
                  <div className="flex gap-3">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Nhập phản hồi hỗ trợ..."
                      rows={2}
                      className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 resize-none"
                    />
                    <button
                      onClick={() => sendTicketReply()}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="px-5 rounded-2xl bg-primary-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors cursor-pointer"
                      title="Gửi phản hồi"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyDetail />
            )
          ) : selectedChat ? (
            <>
              {(() => {
                const activeParticipant = selectedChat.chat.participants?.find((p) => p.role !== "admin") || selectedChat.chat.participants?.[0];
                return (
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <p><span className="font-bold text-slate-400 uppercase">Người nhắn:</span> <span className="font-bold text-slate-800">{activeParticipant?.name || "Người dùng"}</span></p>
                      <p><span className="font-bold text-slate-400 uppercase">Vai trò:</span> <span className="font-bold text-slate-800">{ROLE_LABEL[activeParticipant?.role || ""] || activeParticipant?.role || "---"}</span></p>
                      <p><span className="font-bold text-slate-400 uppercase">Liên hệ:</span> <span className="font-bold text-slate-800">{activeParticipant?.phone || activeParticipant?.email || "---"}</span></p>
                    </div>
                    {selectedChat.chat.orderId?.orderCode && (
                      <p className="mt-2 text-slate-600 font-semibold">
                        Đơn hàng liên quan: <span className="font-bold text-slate-800">{selectedChat.chat.orderId.orderCode}</span>
                      </p>
                    )}
                  </div>
                );
              })()}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
                {selectedChat.messages.length === 0 ? (
                  <p className="text-center py-16 text-xs font-bold text-slate-400">Live chat này chưa có tin nhắn. Bạn có thể gửi tin nhắn đầu tiên bên dưới.</p>
                ) : selectedChat.messages.map((message) => {
                  const fromAdmin =
                    message.senderId?.role === "admin" ||
                    (message.senderId?.name || "").toLowerCase().includes("admin");
                  return (
                    <div key={message._id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 border ${
                        fromAdmin
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white text-slate-700 border-slate-100 shadow-sm"
                      }`}>
                        <p className={`text-[10px] font-bold uppercase mb-1 ${fromAdmin ? "text-primary-100" : "text-slate-400"}`}>
                          {message.senderId?.name || message.senderId?.phone || "Người dùng"} · {ROLE_LABEL[message.senderId?.role || ""] || message.senderId?.role || "---"}
                        </p>
                        {message.messageType === "image" && /^\/uploads\/[a-zA-Z0-9_.-]+$/.test(message.content) ? (
                          <a href={`${API_BASE.replace(/\/api\/v1\/?$/, '')}${message.content}`} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`${API_BASE.replace(/\/api\/v1\/?$/, '')}${message.content}`} alt="Ảnh người dùng gửi hỗ trợ" className="max-w-64 max-h-64 rounded-xl object-contain" />
                          </a>
                        ) : <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{message.content}</p>}
                        <p className={`text-[10px] font-bold mt-2 ${fromAdmin ? "text-primary-100" : "text-slate-400"}`}>
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={chatMessageText}
                    onChange={(e) => {
                      chatDrafts.current[selectedChat.chat._id] = e.target.value;
                      setChatMessageText(e.target.value);
                    }}
                    disabled={detailLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    placeholder="Nhập tin nhắn phản hồi trực tiếp (Nhấn Enter để gửi)..."
                    rows={2}
                    className="flex-1 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 resize-none transition-colors"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={sendingChatMessage || !chatMessageText.trim()}
                    className="px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm flex items-center justify-center"
                    title="Gửi tin nhắn"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>

      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-3 transition-all ${
          toast.success
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
        <UserRound className="w-7 h-7" />
      </div>
      <p className="text-sm font-bold text-slate-700">Chọn một hội thoại để xem chi tiết</p>
      <p className="text-xs text-slate-400 mt-1">Ticket và live chat sẽ hiển thị nội dung ở khu vực này.</p>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AdminSupportContent />
    </Suspense>
  );
}
