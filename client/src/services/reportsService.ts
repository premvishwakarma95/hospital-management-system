import api from "./api";

export interface StatsResponse {
  totalPatients: number;
  activeDoctors: number;
  appointmentsToday: number;
  scheduledUpcoming: number;
  revenueToday: number;
  revenueMonth: number;
  pendingAmount: number;
  lowStock: number;
  expiringSoon: number;
  totalBills: number;
}

export interface MyStatsResponse {
  hasProfile: boolean;
  patientId?: string;
  upcomingAppointments: number;
  totalAppointments: number;
  prescriptions: number;
  labTests: number;
  outstandingAmount: number;
  totalBills: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  billed: number;
  count: number;
}

export interface TopDoctor {
  doctorId: string;
  name: string;
  specialization: string;
  appointments: number;
  revenue: number;
}

export interface SpecializationPoint {
  specialization: string;
  count: number;
  revenue: number;
}

export interface LabTestStat {
  status: string;
  count: number;
}

export const reportsService = {
  stats: async () => {
    const { data } = await api.get<StatsResponse>("/reports/stats");
    return data;
  },
  myStats: async () => {
    const { data } = await api.get<MyStatsResponse>("/reports/my-stats");
    return data;
  },
  revenue: async (days = 30) => {
    const { data } = await api.get<{ series: RevenuePoint[] }>("/reports/revenue", {
      params: { days },
    });
    return data.series;
  },
  topDoctors: async () => {
    const { data } = await api.get<{ top: TopDoctor[] }>("/reports/top-doctors");
    return data.top;
  },
  specializations: async () => {
    const { data } = await api.get<{ breakdown: SpecializationPoint[] }>("/reports/specializations");
    return data.breakdown;
  },
  labTests: async () => {
    const { data } = await api.get<{ stats: LabTestStat[] }>("/reports/lab-tests");
    return data.stats;
  },
};
