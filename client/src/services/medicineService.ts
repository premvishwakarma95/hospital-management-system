import api from "./api";
import { DispenseLog, Medicine, PaginatedResponse } from "../types";

export type MedicineInput = Omit<Medicine, "_id" | "createdAt" | "updatedAt">;

export interface DispenseInput {
  quantity: number;
  patient?: string;
  prescription?: string;
  notes?: string;
}

export const medicineService = {
  list: async (params: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
    page?: number;
    limit?: number;
  } = {}) => {
    const { data } = await api.get<PaginatedResponse<Medicine>>("/medicines", { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Medicine>(`/medicines/${id}`);
    return data;
  },
  create: async (payload: MedicineInput) => {
    const { data } = await api.post<Medicine>("/medicines", payload);
    return data;
  },
  update: async (id: string, payload: Partial<MedicineInput>) => {
    const { data } = await api.put<Medicine>(`/medicines/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ message: string }>(`/medicines/${id}`);
    return data;
  },
  dispense: async (id: string, payload: DispenseInput) => {
    const { data } = await api.post<{ medicine: Medicine; log: DispenseLog }>(
      `/medicines/${id}/dispense`,
      payload
    );
    return data;
  },
  listDispenseLogs: async (params: { medicine?: string; patient?: string; page?: number; limit?: number } = {}) => {
    const { data } = await api.get<PaginatedResponse<DispenseLog>>("/medicines/dispense-logs", { params });
    return data;
  },
};
