"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { fetchWithAuth } from "@/utils/api";

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
  orderId?: { _id?: string; orderCode?: string; title?: string; status?: string } | null;
  participants?: UserInfo[];
  lastMessageAt?: string | null;
  updatedAt: string;
}

interface ChatRow {
  chat: SupportChat;
  lastMessage?: ChatMessage | null;
}

const MOCK_TICKETS: SupportTicket[] = [
  {
    _id: "ticket-mock-1",
    userId: { name: "Nguyễn Minh Thu", phone: "0933444555", email: "thu.nguyen@gmail.com", role: "chu-hang" },
    title: "Cần hỗ trợ thanh toán đơn hàng",
    category: "payment",
    description: "Ví đã trừ tiền nhưng trạng thái đơn chưa cập nhật.",
    status: "open",
    conversation: [
      { senderRole: "shipper", senderName: "Nguyễn Minh Thu", message: "Tôi đã thanh toán nhưng đơn chưa đổi trạng thái.", createdAt: "2026-07-10T02:00:00Z" },
      { senderRole: "assistant", senderName: "Hệ thống hỗ trợ", message: "TXEPRO đã ghi nhận yêu cầu của bạn.", createdAt: "2026-07-10T02:01:00Z" },
    ],
    createdAt: "2026-07-10T02:00:00Z",
    updatedAt: "2026-07-10T02:01:00Z",
  },
  {
    _id: "ticket-mock-2",
    userId: { name: "Vũ Quốc Khánh", phone: "0966777888", email: "khanh.vu@gmail.com", role: "tai-xe" },
    title: "Lỗi không nhận được chuyến",
    category: "technical",
    description: "Ứng dụng báo lỗi khi bấm nhận chuyến.",
    status: "pending",
    conversation: [
      { senderRole: "driver", senderName: "Vũ Quốc Khánh", message: "Tôi bấm nhận chuyến thì app báo lỗi.", createdAt: "2026-07-10T03:15:00Z" },
    ],
    createdAt: "2026-07-10T03:15:00Z",
    updatedAt: "2026-07-10T03:15:00Z",
  },
];

const MOCK_CHATS: ChatRow[] = [
  {
    chat: {
      _id: "chat-mock-1",
      orderId: { _id: "o-mock-2", orderCode: "ORD-20260709-002", title: "Vận chuyển thiết bị gia dụng", status: "delivered" },
      participants: [
        { name: "Lê Văn Hoàng", role: "chu-hang", phone: "0905111222" },
        { name: "Phạm Minh Đức", role: "tai-xe", phone: "0977888999" },
      ],
      lastMessageAt: "2026-07-10T04:10:00Z",
      updatedAt: "2026-07-10T04:10:00Z",
    },
    lastMessage: {
      _id: "msg-mock-1",
      senderId: { name: "Lê Văn Hoàng", role: "chu-hang" },
      messageType: "text",
      content: "Tôi đã nhận đủ hàng, cảm ơn tài xế.",
      createdAt: "2026-07-10T04:10:00Z",
    },
  },
];

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

const ROLE_LABEL: Record<string, string> = {
  "chu-hang": "Chủ hàng",
  "tai-xe": "Tài xế",
  shipper: "Chủ hàng",
  driver: "Tài xế",
  admin: "Admin",
  assistant: "Hệ thống",
};

const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString("vi-VN") : "---";

export default function AdminSupportPage() {
  const [tab, setTab] = useState<SupportTab>("tickets");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedChat, setSelectedChat] = useState<{ chat: SupportChat; messages: ChatMessage[] } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      limit: "50",
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    try {
      const res = await fetchWithAuth(`http://127.0.0.1:5000/api/v1/admin/users/support/tickets?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch support tickets");
      const data = await res.json();
      const nextTickets = data.data.tickets || [];
      setTickets(nextTickets);
      setSelectedTicket((current) => current ? nextTickets.find((item: SupportTicket) => item._id === current._id) || nextTickets[0] || null : nextTickets[0] || null);
      setIsOffline(false);
    } catch (err) {
      console.warn("Support ticket API offline, using mock data", err);
      const queryText = search.toLowerCase();
      let nextTickets = [...MOCK_TICKETS];
      if (queryText) {
        nextTickets = nextTickets.filter((ticket) =>
          `${ticket.title} ${ticket.description} ${ticket.userId?.name || ""}`.toLowerCase().includes(queryText)
        );
      }
      if (statusFilter) nextTickets = nextTickets.filter((ticket) => ticket.status === statusFilter);
      setTickets(nextTickets);
      setSelectedTicket(nextTickets[0] || null);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      limit: "50",
      ...(search ? { search } : {}),
    });
    try {
      const res = await fetchWithAuth(`http://127.0.0.1:5000/api/v1/admin/users/support/chats?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch support chats");
      const data = await res.json();
      const nextChats = data.data.chats || [];
      setChats(nextChats);
      if (nextChats[0]) await openChat(nextChats[0].chat._id, false);
      else setSelectedChat(null);
      setIsOffline(false);
    } catch (err) {
      console.warn("Support chat API offline, using mock data", err);
      setChats(MOCK_CHATS);
      setSelectedChat({
        chat: MOCK_CHATS[0].chat,
        messages: MOCK_CHATS[0].lastMessage ? [MOCK_CHATS[0].lastMessage] : [],
      });
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "tickets") fetchTickets();
    else fetchChats();
  }, [tab, search, statusFilter]);

  const openTicket = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetchWithAuth(`http://127.0.0.1:5000/api/v1/admin/users/support/tickets/${ticketId}`);
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

  const openChat = async (chatId: string, showLoading = true) => {
    if (showLoading) setDetailLoading(true);
    try {
      const res = await fetchWithAuth(`http://127.0.0.1:5000/api/v1/admin/users/support/chats/${chatId}`);
      if (!res.ok) throw new Error("Failed to fetch chat detail");
      const data = await res.json();
      setSelectedChat({ chat: data.data.chat, messages: data.data.messages || [] });
      setIsOffline(false);
    } catch (err) {
      console.warn("Chat detail API offline", err);
      const row = chats.find((item) => item.chat._id === chatId) || MOCK_CHATS[0];
      setSelectedChat({ chat: row.chat, messages: row.lastMessage ? [row.lastMessage] : [] });
    } finally {
      if (showLoading) setDetailLoading(false);
    }
  };

  const sendTicketReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetchWithAuth(`http://127.0.0.1:5000/api/v1/admin/users/support/tickets/${selectedTicket._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage.trim(), status: "in_progress" }),
      });
      if (!res.ok) throw new Error("Failed to reply ticket");
      const data = await res.json();
      setSelectedTicket(data.data.ticket);
      setTickets((current) => current.map((ticket) => ticket._id === data.data.ticket._id ? data.data.ticket : ticket));
      setReplyMessage("");
      setIsOffline(false);
    } catch (err) {
      console.warn("Reply ticket API offline", err);
      const nextTicket: SupportTicket = {
        ...selectedTicket,
        status: "in_progress",
        conversation: [
          ...selectedTicket.conversation,
          {
            senderRole: "admin",
            senderName: "Admin TXEPRO",
            message: replyMessage.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      setSelectedTicket(nextTicket);
      setTickets((current) => current.map((ticket) => ticket._id === nextTicket._id ? nextTicket : ticket));
      setReplyMessage("");
      setIsOffline(true);
    } finally {
      setSendingReply(false);
    }
  };

  const supportStats = useMemo(() => ({
    pending: tickets.filter((ticket) => ticket.status === "pending" || ticket.status === "open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length,
  }), [tickets]);

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" /> Backend đang offline, dữ liệu hiển thị là dữ liệu mẫu hoặc trạng thái cục bộ.
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trung Tâm Hỗ Trợ</h1>
          <p className="text-slate-400 text-xs mt-1">Theo dõi live chat và ticket/request người dùng gửi cho TXEPRO.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
          <div className="bg-white rounded-2xl border border-slate-200/50 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase">Chờ xử lý</p>
            <p className="text-xl font-black text-amber-600">{supportStats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/50 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase">Đang xử lý</p>
            <p className="text-xl font-black text-primary-600">{supportStats.inProgress}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/50 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase">Đã xử lý</p>
            <p className="text-xl font-black text-emerald-600">{supportStats.resolved}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-5 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setTab("tickets")}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${tab === "tickets" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500"}`}
          >
            <TicketCheck className="w-4 h-4" /> Ticket
          </button>
          <button
            onClick={() => setTab("chats")}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${tab === "chats" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500"}`}
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
            <h2 className="text-sm font-black text-slate-900">{tab === "tickets" ? "Ticket / Request" : "Live chat người dùng"}</h2>
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
                        <p className="font-black text-sm text-slate-900 truncate">{ticket.title}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate">{ticket.userId?.name || "Người dùng"} · {CATEGORY_LABEL[ticket.category] || ticket.category}</p>
                      </div>
                      <span className={`shrink-0 border rounded-lg px-2 py-1 text-[10px] font-black ${statusInfo.className}`}>{statusInfo.label}</span>
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
              ) : chats.map((row) => (
                <button
                  key={row.chat._id}
                  onClick={() => openChat(row.chat._id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer ${selectedChat?.chat._id === row.chat._id ? "bg-primary-50/70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-900 truncate">{row.chat.orderId?.orderCode || "Live chat"}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1 truncate">{row.chat.participants?.map((user) => user.name || user.phone).join(" ↔ ") || "---"}</p>
                    </div>
                    {row.chat.orderId?._id && (
                      <Link href={`/admin/orders/${row.chat.orderId._id}`} className="text-[10px] font-black text-primary-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                        Đơn
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{row.lastMessage?.content || "Chưa có tin nhắn"}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(row.lastMessage?.createdAt || row.chat.lastMessageAt || row.chat.updatedAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden min-h-[620px] flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">{tab === "tickets" ? selectedTicket?.title || "Chi tiết ticket" : selectedChat?.chat.orderId?.orderCode || "Chi tiết live chat"}</h2>
                <p className="text-xs font-semibold text-slate-400">{detailLoading ? "Đang tải chi tiết..." : tab === "tickets" ? selectedTicket?.userId?.name || "---" : selectedChat?.chat.participants?.map((user) => ROLE_LABEL[user.role || ""] || user.role || "Người dùng").join(" & ") || "---"}</p>
              </div>
            </div>
            {tab === "tickets" && selectedTicket && (
              <span className={`border rounded-xl px-3 py-1.5 text-xs font-black ${(STATUS_LABEL[selectedTicket.status] || STATUS_LABEL.pending).className}`}>
                {(STATUS_LABEL[selectedTicket.status] || STATUS_LABEL.pending).label}
              </span>
            )}
          </div>

          {tab === "tickets" ? (
            selectedTicket ? (
              <>
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <p><span className="font-black text-slate-400 uppercase">Người gửi:</span> <span className="font-bold text-slate-800">{selectedTicket.userId?.name || "---"}</span></p>
                    <p><span className="font-black text-slate-400 uppercase">Vai trò:</span> <span className="font-bold text-slate-800">{ROLE_LABEL[selectedTicket.userId?.role || ""] || selectedTicket.userId?.role || "---"}</span></p>
                    <p><span className="font-black text-slate-400 uppercase">Liên hệ:</span> <span className="font-bold text-slate-800">{selectedTicket.userId?.phone || selectedTicket.userId?.email || "---"}</span></p>
                  </div>
                  <p className="mt-3 text-slate-600 font-semibold leading-relaxed">{selectedTicket.description}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
                  {selectedTicket.conversation.map((message, index) => {
                    const fromAdmin = message.senderRole === "admin" || message.senderRole === "assistant";
                    return (
                      <div key={message._id || index} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 border ${fromAdmin ? "bg-primary-600 text-white border-primary-600" : "bg-white text-slate-700 border-slate-100"}`}>
                          <p className={`text-[10px] font-black uppercase mb-1 ${fromAdmin ? "text-primary-100" : "text-slate-400"}`}>{message.senderName} · {ROLE_LABEL[message.senderRole] || message.senderRole}</p>
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
                      onClick={sendTicketReply}
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
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs">
                <p><span className="font-black text-slate-400 uppercase">Đơn hàng:</span> <span className="font-bold text-slate-800">{selectedChat.chat.orderId?.orderCode || "---"}</span></p>
                <p className="mt-1"><span className="font-black text-slate-400 uppercase">Người tham gia:</span> <span className="font-bold text-slate-800">{selectedChat.chat.participants?.map((user) => `${user.name || user.phone || "Người dùng"} (${ROLE_LABEL[user.role || ""] || user.role || "---"})`).join(" · ")}</span></p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
                {selectedChat.messages.length === 0 ? (
                  <p className="text-center py-16 text-xs font-bold text-slate-400">Live chat này chưa có tin nhắn</p>
                ) : selectedChat.messages.map((message) => (
                  <div key={message._id} className="flex justify-start">
                    <div className="max-w-[78%] rounded-2xl px-4 py-3 border bg-white text-slate-700 border-slate-100">
                      <p className="text-[10px] font-black uppercase mb-1 text-slate-400">{message.senderId?.name || message.senderId?.phone || "Người dùng"} · {ROLE_LABEL[message.senderId?.role || ""] || message.senderId?.role || "---"}</p>
                      <p className="text-sm font-semibold leading-relaxed">{message.content}</p>
                      <p className="text-[10px] font-bold mt-2 text-slate-400">{formatDateTime(message.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
        <UserRound className="w-7 h-7" />
      </div>
      <p className="text-sm font-black text-slate-700">Chọn một hội thoại để xem chi tiết</p>
      <p className="text-xs text-slate-400 mt-1">Ticket và live chat sẽ hiển thị nội dung ở khu vực này.</p>
    </div>
  );
}
