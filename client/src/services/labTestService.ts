import api from "./api";
import { LabTest, LabTestStatus, PaginatedResponse } from "../types";

export interface LabTestInput {
  patient: string;
  orderedBy: string;
  appointment?: string;
  testName: string;
  testCategory: string;
  cost: number;
  priority?: "normal" | "urgent";
  notes?: string;
}

export interface LabTestUpdate {
  status?: LabTestStatus;
  resultText?: string;
  resultUrl?: string;
  notes?: string;
  priority?: "normal" | "urgent";
}

export const labTestService = {
  list: async (params: {
    patient?: string;
    status?: LabTestStatus;
    category?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const { data } = await api.get<PaginatedResponse<LabTest>>("/lab-tests", { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<LabTest>(`/lab-tests/${id}`);
    return data;
  },
  create: async (payload: LabTestInput) => {
    const { data } = await api.post<LabTest>("/lab-tests", payload);
    return data;
  },
  update: async (id: string, payload: LabTestUpdate) => {
    const { data } = await api.put<LabTest>(`/lab-tests/${id}`, payload);
    return data;
  },
};
