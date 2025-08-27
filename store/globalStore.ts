import { User } from "@/types";
import { create } from "zustand";

interface JobStore {
  totalJobs: number;
  pendingShipments: number;
  pendingJobs: number;
  completedJobs: number;
  setTotalJobs: (count: number) => void;
  setPendingShipments: (count: number) => void;
  setPendingJobs: (count: number) => void;
  setCompletedJobs: (count: number) => void;

  user: {};
  setUser: (user: User) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  totalJobs: 0,
  pendingShipments: 0,
  pendingJobs: 0,
  completedJobs: 0,
  setTotalJobs: (count) => set({ totalJobs: count }),
  setPendingShipments: (count) => set({ pendingShipments: count }),
  setPendingJobs: (count) => set({ pendingJobs: count }),
  setCompletedJobs: (count) => set({ completedJobs: count }),

  user: {},
  setUser: (userData) => set({ user: userData }),
}));
