import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { authService } from "@/services/authService";
import { useAuth } from "./useAuth";

export interface ShipmentItem {
  chargeitem: string;
  chargeitemId: string;
  itemId: string;
  line: number;
  itemName: string;
  quantity: number;
  location: string;
  stockAvailable: string;
}

export const shipmentQueryKeys = {
  all: ["shipment"],
  detail: (jobId: string | number) => [
    ...shipmentQueryKeys.all,
    "detail",
    jobId,
  ],
};

export function useShipmentMaintenance(jobId?: string | number) {
  const { isAuthenticated } = useAuth();

  const {
    data: shipmentItems = [] as ShipmentItem[],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: shipmentQueryKeys.detail(jobId || "undefined"),
    queryFn: async () => {
      if (!jobId) {
        return [];
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
          type: "getShipmentMaintainance",
          jobId: jobId,
        },
      });

      let responseData: ShipmentItem[] = [];
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
          } else {
            console.warn("Shipment response is not an array:", parsedData);
            responseData = [];
          }
        } catch (parseErr) {
          console.warn("Failed to parse shipment response:", response.data);
          responseData = [];
        }
      }

      return responseData;
    },
    enabled: isAuthenticated && !!jobId,
    refetchOnWindowFocus: false,
  });

  return {
    shipmentItems,
    isLoading,
    error,
    isFetching,
    refetch,
  };
}
