import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { DataResponseSuccess } from "./useJobs";
import { queryClient } from "@/services/apiClient";
import Toast from "react-native-toast-message";

export interface EquipmentUsageLog {
  "Document Number": string;
  Name: string;
  Date: string;
  Department?: string;
  Location: string;
  Class?: string;
  "Equipment Maintenance Job Order #": string;
  Equipment: string;
  "Usage Units": string;
  "Maintenance Coverage Limit (In Usage Units)": string;
  "Maintenance Threshold (In Usage Units)": string;
  "Maintenance Job Schedule"?: string;
  "Maintenance Start Date"?: string;
  "Maintenance End Date"?: string;
  "Last Maintenance": boolean;
  "Maintenance Completed": boolean;
  internalid?: number;
}

export interface AddUsageLogRequest {
  type: "addUsageLog";
  usageId: number;
  units: number;
  usageDate: string;
}

export const equipmentUsageLogQueryKeys = {
  all: ["equipmentUsageLogs"] as const,
  list: (page?: number) =>
    [...equipmentUsageLogQueryKeys.all, "list", page] as const,
  detail: (id: string) =>
    [...equipmentUsageLogQueryKeys.all, "detail", id] as const,
};

export const useEquipmentUsageLog = (options = {}) => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [allEquipmentLogs, setAllEquipmentLogs] = useState<EquipmentUsageLog[]>(
    []
  );

  const {
    data: paginatedEquipmentLogs = [] as EquipmentUsageLog[],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: equipmentUsageLogQueryKeys.list(currentPage),
    queryFn: async () => {
      // Get user data to access NetSuite credentials
      const userData = await authService.getUserData();
      if (!userData?.restletUrl) {
        throw new Error("User data not available. Please login again.");
      }

      // Parse the restletUrl to get base URL and parameters
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
          type: "getEquipmentUsageLog",
          pagination: {
            page: currentPage,
            pageSize: pageSize,
          },
        },
      });

      let responseData: EquipmentUsageLog[] = [];
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
    if (paginatedEquipmentLogs?.length > 0) {
      setAllEquipmentLogs((prev) => {
        const existingLogsMap = new Map(
          prev.map((log) => [log["Document Number"], log])
        );

        paginatedEquipmentLogs.forEach((log) => {
          if (!existingLogsMap.has(log["Document Number"])) {
            existingLogsMap.set(log["Document Number"], log);
          }
        });

        return Array.from(existingLogsMap.values());
      });
    }
  }, [paginatedEquipmentLogs]);

  const fetchNextPage = () => {
    if (hasNextPage && !isFetching) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const loadAllPages = async () => {
      if (hasNextPage && !isFetching && isAuthenticated) {
        fetchNextPage();
      }
    };

    loadAllPages();
  }, [hasNextPage, isFetching, isAuthenticated, paginatedEquipmentLogs]);

  const updateEquipUsage = useMutation({
    mutationFn: async (
      data: AddUsageLogRequest
    ): Promise<DataResponseSuccess> => {
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

      const authHeader = await authService.getAuthHeader(
        "POST",
        baseUrl,
        queryParams
      );

      console.log("API request data:", data);

      try {
        const response = await axios({
          method: "POST",
          url: `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            Accept: "application/json",
          },
          data: data,
        });

        const responseData = response?.data;
        if (
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData &&
          "success" in responseData &&
          typeof responseData.message === "string" &&
          typeof responseData.success === "string"
        ) {
          return responseData as DataResponseSuccess;
        } else {
          return {
            message: "Equipment usage log updated successfully.",
            success: "true",
          };
        }
      } catch (error: any) {
        console.error("API error:", error?.response?.data || error?.message);
        if (error?.response?.data) {
          throw new Error(JSON.stringify(error?.response.data));
        } else {
          throw error;
        }
      }
    },
    onSuccess: (data: DataResponseSuccess) => {
      console.log("Usage log created successfully:", data);

      queryClient.invalidateQueries({
        queryKey: equipmentUsageLogQueryKeys.list(),
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Equipment usage log updated successfully.",
        position: "top",
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50,
      });
    },
    onError: (error) => {
      console.error("Error creating usage log:", error);
      Toast.show({
        type: "error",
        text1: "Error updating usage log",
        text2: error.message,
        position: "top",
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 50,
      });
    },
  });

  return {
    equipmentLogs: allEquipmentLogs,
    isLoading: isLoading || isFetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    updateEquipUsage,
  };
};
