import api from "./api";
import { Bill, BillItem, PaginatedResponse, PaymentMethod, PaymentStatus } from "../types";

export interface BillInput {
  patient: string;
  items: BillItem[];
  discount?: number;
  taxPercent?: number;
  notes?: string;
}

export const billService = {
  list: async (params: {
    patient?: string;
    paymentStatus?: PaymentStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const { data } = await api.get<PaginatedResponse<Bill>>("/bills", { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Bill>(`/bills/${id}`);
    return data;
  },
  create: async (payload: BillInput) => {
    const { data } = await api.post<Bill>("/bills", payload);
    return data;
  },
  update: async (id: string, payload: Partial<BillInput>) => {
    const { data } = await api.put<Bill>(`/bills/${id}`, payload);
    return data;
  },
  recordPayment: async (id: string, amount: number, method: PaymentMethod) => {
    const { data } = await api.post<Bill>(`/bills/${id}/payment`, { amount, method });
    return data;
  },
  cancel: async (id: string) => {
    const { data } = await api.patch<Bill>(`/bills/${id}/cancel`);
    return data;
  },
  unbilled: async (patientId: string) => {
    const { data } = await api.get<{ items: BillItem[] }>("/bills/unbilled", {
      params: { patient: patientId },
    });
    return data.items;
  },
};
