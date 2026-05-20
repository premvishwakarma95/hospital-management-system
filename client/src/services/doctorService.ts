import api from "./api";
import { Doctor, PaginatedResponse } from "../types";

export type DoctorInput = Omit<Doctor, "_id" | "createdAt" | "updatedAt">;

export const doctorService = {
  list: async (params: {
    search?: string;
    specialization?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  } = {}) => {
    const { data } = await api.get<PaginatedResponse<Doctor>>("/doctors", { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Doctor>(`/doctors/${id}`);
    return data;
  },
  create: async (payload: DoctorInput) => {
    const { data } = await api.post<Doctor>("/doctors", payload);
    return data;
  },
  update: async (id: string, payload: Partial<DoctorInput>) => {
    const { data } = await api.put<Doctor>(`/doctors/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ message: string }>(`/doctors/${id}`);
    return data;
  },
};
