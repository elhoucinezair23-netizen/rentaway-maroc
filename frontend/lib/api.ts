import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  const token = (session as { accessToken?: string })?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error || err.message || "Une erreur est survenue";
    return Promise.reject(new Error(message));
  }
);

export default api;

// Vehicle API
export const vehicleApi = {
  search: (params: Record<string, string | number>) =>
    api.get("/vehicles", { params }),
  getById: (id: string) => api.get(`/vehicles/${id}`),
  create: (formData: FormData) =>
    api.post("/vehicles", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: string, data: Partial<unknown>) => api.patch(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
  getAvailability: (id: string, month: number, year: number) =>
    api.get(`/vehicles/${id}/availability`, { params: { month, year } }),
  setAvailability: (id: string, dates: string[], isBlocked: boolean) =>
    api.post(`/vehicles/${id}/availability`, { dates, isBlocked }),
};

// Reservation API
export const reservationApi = {
  create: (data: { vehicleId: string; startDate: string; endDate: string }) =>
    api.post("/reservations", data),
  list: (params?: Record<string, string | number>) => api.get("/reservations", { params }),
  getById: (id: string) => api.get(`/reservations/${id}`),
  updateStatus: (id: string, status: string, cancelReason?: string) =>
    api.patch(`/reservations/${id}/status`, { status, cancelReason }),
  cancel: (id: string, reason?: string) => api.post(`/reservations/${id}/cancel`, { reason }),
};

// Payment API
export const paymentApi = {
  createIntent: (reservationId: string) =>
    api.post("/payments/create-intent", { reservationId }),
  capturePayment: (reservationId: string) =>
    api.post(`/payments/capture/${reservationId}`),
  releaseCaution: (reservationId: string) =>
    api.post(`/payments/release-caution/${reservationId}`),
};

// Agency API
export const agencyApi = {
  getById: (id: string) => api.get(`/agencies/${id}`),
  getStats: (id: string) => api.get(`/agencies/${id}/stats`),
  update: (id: string, data: Partial<unknown>) => api.patch(`/agencies/${id}`, data),
};

// Review API
export const reviewApi = {
  create: (data: unknown) => api.post("/reviews", data),
  getByAgency: (agencyId: string, params?: Record<string, string | number>) =>
    api.get(`/reviews/agency/${agencyId}`, { params }),
  reply: (id: string, reply: string) => api.post(`/reviews/${id}/reply`, { reply }),
};

// Message API
export const messageApi = {
  getConversations: () => api.get("/messages/conversations"),
  getMessages: (userId: string, params?: Record<string, string | number>) =>
    api.get(`/messages/${userId}`, { params }),
  send: (formData: FormData) =>
    api.post("/messages", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  getPendingAgencies: () => api.get("/admin/agencies/pending"),
  approveAgency: (id: string) => api.post(`/admin/agencies/${id}/approve`),
  rejectAgency: (id: string, reason: string) =>
    api.post(`/admin/agencies/${id}/reject`, { reason }),
  blacklistUser: (id: string) => api.post(`/admin/users/${id}/blacklist`),
  unblacklistUser: (id: string) => api.delete(`/admin/users/${id}/blacklist`),
  getDisputedReservations: () => api.get("/admin/reservations/disputed"),
  resolveDispute: (id: string, resolution: string) =>
    api.post(`/admin/reservations/${id}/resolve`, { resolution }),
  exportCSV: () => api.get("/admin/export/csv", { responseType: "blob" }),
};

// Prospect API (admin)
export const prospectApi = {
  list: (params?: Record<string, string>) => api.get("/admin/prospects", { params }),
  invite: (id: string) => api.post(`/admin/prospects/${id}/invite`),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/admin/prospects/${id}/status`, { status, notes }),
  remove: (id: string) => api.delete(`/admin/prospects/${id}`),
};

// Admin — Email testing
export const adminEmailApi = {
  test: (type: string, to: string) => api.post("/admin/emails/test", { type, to }),
  log:  ()                          => api.get("/admin/emails/log"),
};

// Admin — Scraped vehicles moderation
export const scrapedVehicleApi = {
  list: (params?: Record<string, string>) =>
    api.get("/admin/scraped-vehicles", { params }),
  approve:    (id: string) => api.post(`/admin/scraped-vehicles/${id}/approve`),
  reject:     (id: string) => api.post(`/admin/scraped-vehicles/${id}/reject`),
  approveAll: ()           => api.post("/admin/scraped-vehicles/approve-all"),
  update:     (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/scraped-vehicles/${id}`, data),
};

// Public API (no auth)
export const publicApi = {
  loueurSignup: (data: {
    agencyName: string;
    contactName: string;
    city: string;
    phone: string;
    email: string;
    categories: string[];
    message?: string;
  }) => api.post("/public/loueur-signup", data),
  contact: (data: { name: string; email: string; subject: string; message: string }) =>
    api.post("/public/contact", data),
};

// Auth helpers (public)
export const authPublicApi = {
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post("/auth/reset-password", { token, newPassword }),
};
