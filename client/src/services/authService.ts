import api from "./api";
import { User } from "../types";

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<User> => {
    const { data } = await api.post<User>("/auth/login", payload);
    return data;
  },
  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};
