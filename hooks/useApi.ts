// src/hooks/useApi.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import { useAuth } from "./useAuth";

// Example of a custom hook for fetching data
export function useFetchData<T>(
  key: string[],
  endpoint: string,
  params?: Record<string, string | number | boolean>,
  options = {}
) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: key,
    queryFn: () => apiClient.get<T>(endpoint, params),
    enabled: isAuthenticated,
    ...options,
  });
}

// Example of a custom hook for creating data
export function useCreateData<T, R>(key: string[]) {
  return useMutation({
    mutationFn: (data: R) => apiClient.post<T>("", data),
  });
}

// Example of a custom hook for updating data
export function useUpdateData<T, R>(key: string[]) {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: R }) =>
      apiClient.put<T>(`/${id}`, data),
  });
}

// Example of a custom hook for deleting data
export function useDeleteData<T>(key: string[]) {
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<T>(`/${id}`),
  });
}
