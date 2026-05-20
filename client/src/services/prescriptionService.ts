import api from "./api";
import { PaginatedResponse, Prescription, MedicineItem } from "../types";

export interface PrescriptionInput {
  appointment?: string;
  patient: string;
  doctor: string;
  diagnosis: string;
  symptoms?: string;
  medicines: MedicineItem[];
  advice?: string;
  followUpDate?: string;
}

export const prescriptionService = {
  list: async (params: {
    patient?: string;
    doctor?: string;
    appointment?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const { data } = await api.get<PaginatedResponse<Prescription>>("/prescriptions", { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Prescription>(`/prescriptions/${id}`);
    return data;
  },
  create: async (payload: PrescriptionInput) => {
    const { data } = await api.post<Prescription>("/prescriptions", payload);
    return data;
  },
  update: async (id: string, payload: Partial<PrescriptionInput>) => {
    const { data } = await api.put<Prescription>(`/prescriptions/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ message: string }>(`/prescriptions/${id}`);
    return data;
  },
};
