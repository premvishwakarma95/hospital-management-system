import api from "./api";
import { Appointment, AppointmentStatus, PaginatedResponse, Slot } from "../types";

export interface AppointmentInput {
  patient: string;
  doctor: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  reason?: string;
}

export interface SlotsResponse {
  available: Slot[];
  total?: number;
  booked?: number;
  reason?: string;
}

export const appointmentService = {
  list: async (params: {
    status?: AppointmentStatus;
    doctor?: string;
    patient?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const { data } = await api.get<PaginatedResponse<Appointment>>("/appointments", { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Appointment>(`/appointments/${id}`);
    return data;
  },
  getSlots: async (doctorId: string, date: string) => {
    const { data } = await api.get<SlotsResponse>("/appointments/slots", {
      params: { doctorId, date },
    });
    return data;
  },
  create: async (payload: AppointmentInput) => {
    const { data } = await api.post<Appointment>("/appointments", payload);
    return data;
  },
  update: async (id: string, payload: { status?: AppointmentStatus; notes?: string; reason?: string }) => {
    const { data } = await api.put<Appointment>(`/appointments/${id}`, payload);
    return data;
  },
  cancel: async (id: string) => {
    const { data } = await api.patch<Appointment>(`/appointments/${id}/cancel`);
    return data;
  },
};
