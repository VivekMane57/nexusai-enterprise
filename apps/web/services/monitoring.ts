import { api } from "@/lib/api";

import type {
  MonitoringDashboard,
} from "@/types/monitoring";

export async function getMonitoringDashboard(): Promise<MonitoringDashboard> {
  const response =
    await api.get<MonitoringDashboard>(
      "/monitoring/dashboard",
    );

  return response.data;
}