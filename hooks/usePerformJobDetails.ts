import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "./useAuth";
import { authService } from "@/services/authService";
import { useEffect } from "react";

export interface PerforJobDetails {
  techType?: string;
  techPerformed?: string;
  scheduleDate?: string;
  jobStatus?: string;
  [key: string]: any;
}

export const performJobDetailsQueryKey = {
  all: ["performJob"],
  detail: (jobSchId: string | number) => [
    ...performJobDetailsQueryKey.all,
    "detail",
    jobSchId,
  ],
};

export function usePerformJobDetails(jobSchId: string | number) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log("usePerformJobDetails called with jobSchId:", jobSchId);
  }, [jobSchId]);

  const {
    data: performJobDetails = {},
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: performJobDetailsQueryKey.detail(jobSchId),
    queryFn: async () => {
      console.log("Fetching job details for ID:", jobSchId);

      if (!jobSchId) {
        console.warn("No jobSchId provided");
        return {};
      }

      // Get user data to access NetSuite credentials
      const userData = await authService.getUserData();
      if (!userData?.restletUrl) {
        throw new Error("User data not available. Please login again.");
      }

      const url = new URL(userData.restletUrl);
      const baseUrl = url.origin + url.pathname;
      const queryParams = {
        script: url.searchParams.get('script') || '',
        deploy: url.searchParams.get('deploy') || '',
      };

      try {
        const authHeader = await authService.getAuthHeader(
          "POST",
          baseUrl,
          queryParams
        );

        console.log("Making API request for job details");
        const response = await axios({
          method: "POST",
          url: `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            Accept: "application/json",
          },
          data: {
            type: "viewPerformJobDetails",
            jobSchId: jobSchId,
          },
        });

        console.log("API Response:", response.data);

        let data: PerforJobDetails = response.data;

        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (err) {
            console.warn("Failed to parse response:", data);
            data = {};
          }
        }

        if (data && data.scheduleDate) {
          try {
            const dateObj = new Date(data.scheduleDate);
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            const year = dateObj.getFullYear();
            data.scheduleDate = `${month}/${day}/${year}`;
          } catch (err) {
            console.warn("Failed to format date:", data.scheduleDate);
          }
        }

        console.log("Processed data:", data);
        return data as PerforJobDetails;
      } catch (err) {
        console.error("Error fetching job details:", err);
        throw err;
      }
    },
    enabled: isAuthenticated && !!jobSchId,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    console.log("performJobDetails:", performJobDetails);
  }, [performJobDetails]);

  return {
    performJobDetails,
    isLoading,
    error,
    refetch,
  };
}
