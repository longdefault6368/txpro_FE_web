export function orderListEndpoint(role: string, tab: string, page: number) {
 if (!["chu-hang", "tai-xe"].includes(role)) throw new Error("Vai trò không hợp lệ.");
 if (!["all", "in-progress", "waiting", "posts", "history"].includes(tab) || tab === "posts" && role !== "tai-xe") throw new Error("Danh sách không hợp lệ.");
 const path = tab === "all" ? role === "chu-hang" ? "/chu-hang/orders" : "/tai-xe/orders/all"
  : tab === "posts" ? "/tai-xe/posts" : "/" + role + "/orders/" + tab;
 return path + "?paginated=true&limit=20&page=" + (Number.isSafeInteger(page) && page > 0 ? page : 1)
  + (tab === "in-progress" ? "&includeAwaitingIncidentResponse=true" : "");
}
export function orderListAction(role: string, item: { id?: string; _id?: string; status: string; orderCode?: string; kind?: string }, isPost: boolean) {
 const id = item.id || item._id;
 if (isPost) return null;
 if (role === "chu-hang" && ["searching_driver", "waiting_driver"].includes(item.status) && id) return { label: "Tìm xe", href: "/chu-hang/form-tao-don?order=" + encodeURIComponent(id) };
 return item.orderCode ? { label: "Theo dõi", href: "/tracking?code=" + encodeURIComponent(item.orderCode) } : null;
}
