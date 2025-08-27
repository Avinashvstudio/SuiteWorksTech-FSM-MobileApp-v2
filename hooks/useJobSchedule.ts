import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "./useAuth";
import { authService } from "@/services/authService";
import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { performJobDetailsQueryKey } from "./usePerformJobDetails";

export interface JobSchedule {
  "Document Number"?: string;
  "Internal ID"?: string;
  Name?: string;
  Item?: string;
  Equipment?: string;
  "Scheduled Maintenance Date"?: string;
  "Maintenance Completion Date"?: string;
  "Overall Job Status"?: string;
  startMap?: string;
  endMap?: string;
  [key: string]: any;
}

export interface JobPerformanceDetails {
  techType?: string;
  techPerformed?: string;
  scheduleDate?: string;
  jobStatus?: string;
  [key: string]: any;
}

export const jobScheduleQueryKeys = {
  all: ["jobSchedule"],
  list: (page?: number) => [...jobScheduleQueryKeys.all, "list", page],
  detail: (id: string) => [...jobScheduleQueryKeys.all, "detail", id],
};

export const jobPerformeQueryKeys = {
  all: ["jobPerformance"],
  detail: (jobSchId: string) => [
    ...jobPerformeQueryKeys.all,
    "detail",
    jobSchId,
  ],
};

export function useJobSchedule(itemsPerRequest = 20) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [allJobSchedules, setAllJobSchedules] = useState<JobSchedule[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);

  const pageSize = itemsPerRequest;

  const {
    data: paginatedJobSchedules = [] as JobSchedule[],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: jobScheduleQueryKeys.list(currentPage),
    queryFn: async () => {
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

      const authHeader = await authService.getAuthHeader(
        "POST",
        baseUrl,
        queryParams
      );

      const response = await axios({
        method: "POST",
        url: `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        data: {
          type: "getJobSchedule",
          pagination: {
            page: currentPage,
            pageSize: pageSize,
          },
        },
      });

      let responseData: JobSchedule[] = [];
      if (Array.isArray(response.data)) {
        responseData = response.data;
      } else {
        try {
          const parsedData =
            typeof response.data === "string"
              ? JSON.parse(response.data)
              : response.data;

          if (Array.isArray(parsedData)) {
            responseData = parsedData;
          } else if (parsedData.data && Array.isArray(parsedData.data)) {
            responseData = parsedData.data;
            setHasNextPage(
              parsedData.hasNextPage || responseData.length === pageSize
            );
          } else {
            console.warn("Response is not an array:", parsedData);
            responseData = [];
          }
        } catch (parseErr) {
          console.warn("Failed to parse response:", response.data);
          responseData = [];
        }
      }

      if (responseData.length < pageSize) {
        setHasNextPage(false);
      }

      return responseData;
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (paginatedJobSchedules?.length) {
      setAllJobSchedules((prev) => {
        if (currentPage === 0) {
          return [...paginatedJobSchedules];
        }

        return [...prev, ...paginatedJobSchedules];
      });
    }
  }, [paginatedJobSchedules, currentPage]);

  const loadMore = useCallback(() => {
    if (!isFetching && hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [isFetching, hasNextPage]);

  const resetJobSchedules = useCallback(() => {
    setCurrentPage(0);
    setAllJobSchedules([]);
    setHasNextPage(true);
    refetch();
  }, [refetch]);

  const performJobMutation = useMutation({
    mutationFn: async (performJobData: Partial<JobSchedule>) => {
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

      const authHeader = await authService.getAuthHeader(
        "POST",
        baseUrl,
        queryParams
      );

      const performData = { type: "PerformJob", Data: performJobData };
      console.log("perjob", JSON.stringify(performData, null, 2));

      const response = await axios({
        method: "POST",
        url: `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        data: performData,
      });

      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log("job performed", data);
      const jobId = variables.id;

      console.log("jobid", jobId);
      queryClient.invalidateQueries({ queryKey: jobScheduleQueryKeys.list() });

      if (jobId) {
        queryClient.invalidateQueries({
          queryKey: performJobDetailsQueryKey.detail(jobId),
        });
      }

      queryClient.invalidateQueries({ queryKey: jobScheduleQueryKeys.list() });
    },
    onError: (error) => {
      console.error("Error submitting:", error);
      Toast.show({
        type: "error",
        text1: "Error performing job",
        text2: error.message,
        position: "top",
        visibilityTime: 20000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 50,
      });
    },
  });
  const reassignTechbMutation = useMutation({
    mutationFn: async (reassignTech: Partial<JobSchedule>) => {
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

      const authHeader = await authService.getAuthHeader(
        "POST",
        baseUrl,
        queryParams
      );

      const reassignData = { type: "ReassignTech", Data: reassignTech };

      const response = await axios({
        method: "POST",
        url: `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        data: reassignData,
      });

      return response.data;
    },
    onSuccess: (data) => {
      console.log("reassigned tech data", data);

      queryClient.invalidateQueries({ queryKey: jobScheduleQueryKeys.list() });
    },
    onError: (error) => {
      console.error("Error submitting:", error);
      Toast.show({
        type: "error",
        text1: "Error reassigning techician",
        text2: error.message,
        position: "top",
        visibilityTime: 20000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 50,
      });
    },
  });

  return {
    jobSchedules: allJobSchedules,
    isLoading,
    error,
    isFetching,
    refetch,
    loadMore,
    hasNextPage,

    paginatedJobSchedules,
    currentPage,

    performJob: performJobMutation.mutate,
    isPerforming: performJobMutation.isPending,

    reassignTech: reassignTechbMutation.mutate,
    isReassigning: reassignTechbMutation.isPending,
    resetJobSchedules,
  };
}
