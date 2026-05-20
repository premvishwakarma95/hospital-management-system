import api from "./api";
import { PaginatedResponse, UserRole } from "../types";

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  password?: string;
}

export const userService = {
  list: async (params: { role?: UserRole; search?: string; page?: number; limit?: number } = {}) => {
    const { data } = await api.get<PaginatedResponse<StaffUser>>("/users", { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<StaffUser>(`/users/${id}`);
    return data;
  },
  create: async (payload: CreateUserInput) => {
    const { data } = await api.post<StaffUser>("/users", payload);
    return data;
  },
  update: async (id: string, payload: UpdateUserInput) => {
    const { data } = await api.put<StaffUser>(`/users/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ message: string }>(`/users/${id}`);
    return data;
  },
};
