import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";

export interface DropdownItem {
  value: string;
  label: string;
  [key: string]: any;
}

export type DropdownType =
  | "getCustomers"
  | "getPostingPeriod"
  | "getEquipmentUsageUnits"
  | "getDepartment"
  | "getClass"
  | "getOpp"
  | "getEmployees"
  | "getLocations"
  | "getSO"
  | "getMaintenanceTypes"
  | "getDepartments"
  | "getlist_Charge Item"
  | "getlist_Maintenance Occurrence Type"
  | "getlist_Billing Frequency"
  | "getlist_Billing Interval"
  | "getlist_Billing Week Day"
  | "getlist_Billing Month"
  | "getlist_Billing Months for Bi-mon/qtr"
  | "getlist_Equipment Usage Units"
  | "getlist_Billing Day"
  | "getChargeItems"
  | "getlist_Billing Cycle"
  | "getlist_Equipment Status"
  | "getItems"
  | "getlist_Technician Type"
  | "getlist_Maintenance Type"
  | "getlist_Maintenance Job Status"
  | "getVendors"
  | "getlist_Equipment";

export const dropdownQueryKeys = {
  all: ["dropdowns"],
  list: (type: DropdownType) => [...dropdownQueryKeys.all, type],
};

export function useDropdownData(type: DropdownType) {
  const { isAuthenticated } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const transformResponseToDropdownItems = (data: any[]): DropdownItem[] => {
    switch (type) {
      case "getCustomers":
        return data.map((item) => ({
          value: item["Internal ID"],
          label: `${item.ID} ${item.Name}`,
          id: item.ID,
          name: item.Name,
        }));

      case "getEmployees":
        return data.map((item) => ({
          value: item["Internal ID"],
          label: item.Name,
          id: item.ID,
          email: item.Email,
        }));

      case "getLocations":
        return data.map((item) => ({
          value: item["Internal ID"],
          label: item.Name,
        }));

      case "getSO":
        return data.map((item) => ({
          value: item["Internal ID"],
          label: item["Document Number"],
        }));

      default:
        return data.map((item) => {
          const label =
            item.Name ||
            item.Description ||
            item.Value ||
            item.name ||
            "Unknown";
          const value = item["Internal ID"] || item.ID || item.id;
          return {
            value,
            label,
          };
        });
    }
  };

  const {
    data: dropdownItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: dropdownQueryKeys.list(type),
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
          type,
        },
      });

      // Process the response
      let responseData: any[] = [];

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
            console.warn(`Invalid response format for ${type}:`, parsedData);
            responseData = [];
          }
        } catch (parseErr) {
          console.warn(`Failed to parse response for ${type}:`, response.data);
          responseData = [];
        }
      }

      return transformResponseToDropdownItems(responseData);
    },
    enabled: isAuthenticated,
    // Don't refetch on window focus for better UX
    refetchOnWindowFocus: true,
  });

  // Set isInitialLoading to false when loading is done

  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoading(false);
    }
  }, [isLoading]);

  return {
    items: dropdownItems,
    isLoading: isInitialLoading && isLoading,
    error,
    refetch,
  };
}
