import api from "./api";
import { Patient, PaginatedResponse } from "../types";

export type PatientInput = Omit<Patient, "_id" | "createdAt" | "updatedAt">;

export const patientService = {
  list: async (params: { search?: string; page?: number; limit?: number } = {}) => {
    const { data } = await api.get<PaginatedResponse<Patient>>("/patients", { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Patient>(`/patients/${id}`);
    return data;
  },
  create: async (payload: PatientInput) => {
    const { data } = await api.post<Patient>("/patients", payload);
    return data;
  },
  update: async (id: string, payload: Partial<PatientInput>) => {
    const { data } = await api.put<Patient>(`/patients/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ message: string }>(`/patients/${id}`);
    return data;
  },
};
