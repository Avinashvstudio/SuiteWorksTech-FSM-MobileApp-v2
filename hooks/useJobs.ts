import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "./useAuth";
import { authService } from "@/services/authService";
import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { MaintenanceJO } from "@/types";

export interface DataResponseSuccess {
  message: string;
  success: string;
}

export interface postShipmentLine {
  jobId: number | string;
  lines: number[];
}

export const jobsQueryKeys = {
  all: ["jobs"],
  list: (page?: number) => [...jobsQueryKeys.all, "list", page],
  detail: (id: string) => [...jobsQueryKeys.all, "detail", id],
};

export function useJobs(itemsPerRequest = 20) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [allJobs, setAllJobs] = useState<MaintenanceJO[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);

  const pageSize = itemsPerRequest;

  const {
    data: paginatedJobs = [] as MaintenanceJO[],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: jobsQueryKeys.list(currentPage),
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

      const requestUrl = `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`;
      const requestData = {
        type: "getjobs",
        pagination: {
          page: currentPage,
          pageSize: pageSize,
        },
      };

      try {
        const response = await axios({
          method: "POST",
          url: requestUrl,
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            Accept: "application/json",
          },
          data: requestData,
        });

        let responseData: MaintenanceJO[] = [];
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
      } catch (error: any) {
        console.error("API request failed:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        throw error;
      }
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (paginatedJobs?.length) {
      setAllJobs((prev) => {
        if (currentPage === 0) {
          return [...paginatedJobs];
        }
        return [...prev, ...paginatedJobs];
      });
    }
  }, [paginatedJobs, currentPage]);

  const loadMore = useCallback(() => {
    if (!isFetching && hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [isFetching, hasNextPage]);

  const resetJobs = useCallback(() => {
    setCurrentPage(0);
    setAllJobs([]);
    setHasNextPage(true);
    refetch();
  }, [refetch]);

  const updateJobMutation = useMutation({
    mutationFn: async (jobData: Partial<MaintenanceJO>) => {
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
        data: { type: "updatejob", data: jobData },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsQueryKeys.list() });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (
      jobData: Record<string, any>
    ): Promise<DataResponseSuccess> => {
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

      const apiRequestData = {
        type: "createJob",
        Data: jobData,
      };

      try {
        const response = await axios({
          method: "POST",
          url: `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            Accept: "application/json",
          },
          data: apiRequestData,
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
            message: "Job created successfully.",
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
      console.log("Job created successfully:", data);

      queryClient.invalidateQueries({ queryKey: jobsQueryKeys.list() });
    },
    onError: (error) => {
      console.error("Error creating job:", error);
      Toast.show({
        type: "error",
        text1: "Error creating Job",
        text2: error.message,
        position: "top",
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 50,
      });
    },
  });

  const postShipmentLinesMutation = useMutation({
    mutationFn: async ({
      jobId,
      lines,
    }: {
      jobId: string | number;
      lines: any;
    }) => {
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

      const apiRequestData = {
        type: "submitMaintainance",
        jobId: jobId,
        lines: lines,
      };

      try {
        const response = await axios({
          method: "POST",
          url: `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            Accept: "application/json",
          },
          data: apiRequestData,
        });

        return response?.data;
      } catch (error: any) {
        console.error("API error:", error?.response?.data || error?.message);
        if (error?.response?.data) {
          throw new Error(JSON.stringify(error?.response.data));
        } else {
          throw error;
        }
      }
    },
    onSuccess: (data: any) => {
      console.log("Maintenance submitted successfully:", data);

      queryClient.invalidateQueries({ queryKey: jobsQueryKeys.list() });

      if (data.status === 200) {
        Toast.show({
          type: "success",
          text1: "Successfully Created shipment",
          text2: "Equipment has been shipped for maintenance successfully",
          position: "top",
          visibilityTime: 10000,
          autoHide: true,
          topOffset: 50,
          bottomOffset: 50,
        });
      } else if (data.success !== 200) {
        Toast.show({
          type: "error",
          text1: "Error making shipment",
          text2: data.message,
          position: "top",
          visibilityTime: 20000,
          autoHide: true,
          topOffset: 50,
          bottomOffset: 50,
        });
      }
    },
    onError: (error) => {
      console.error("Error submitting maintenance:", error);
      Toast.show({
        type: "error",
        text1: "Error creating Shipment",
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
    jobs: allJobs,
    isLoading,
    error,
    isFetching,
    refetch,
    loadMore,
    hasNextPage,

    paginatedJobs,
    currentPage,

    updateJob: updateJobMutation.mutate,
    isUpdating: updateJobMutation.isPending,
    createJob: createJobMutation.mutate,
    isCreating: createJobMutation.isPending,

    postShipmentLines: postShipmentLinesMutation.mutate,
    isPostingShipmentLines: postShipmentLinesMutation.isPending,
    
    // Test function to verify API client configuration
    testApiClient: async () => {
      try {
        // Test current configuration
        const configTest = await authService.testCurrentConfig();
        
        if (!configTest.hasCredentials) {
          throw new Error("Missing NetSuite credentials");
        }
        
        // Test OAuth signature generation
        const authHeader = await authService.testOAuthSignature();
        
        return { configTest, authHeader };
      } catch (error) {
        console.error("API test failed:", error);
        throw error;
      }
    },
  };
}
