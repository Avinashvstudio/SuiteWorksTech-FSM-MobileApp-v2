// src/services/apiClient.ts
import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { authService, NetSuiteConfig } from "./authService";
import { QueryClient } from "@tanstack/react-query";

const defaultConfig: NetSuiteConfig = {
  accountId: "",
  consumerKey: "",
  consumerSecret: "",
  tokenId: "",
  tokenSecret: "",
  scriptId: "",
  deployId: "",
  realm: "",
};

class ApiClientClass {
  private axiosInstance: AxiosInstance;
  private config: NetSuiteConfig;

  constructor(config: NetSuiteConfig = defaultConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        
        if (!this.config.accountId || !this.config.scriptId || !this.config.deployId) {
          throw new Error("API client not configured. Please login first.");
        }

        const url = new URL(config.url || "", config.baseURL);
        const method = config.method?.toUpperCase() || "GET";

        const queryParams: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });

        if (!queryParams.script) {
          queryParams.script = this.config.scriptId;
          url.searchParams.set("script", this.config.scriptId);
        }

        if (!queryParams.deploy) {
          queryParams.deploy = this.config.deployId;
          url.searchParams.set("deploy", this.config.deployId);
        }

        config.url = url.toString().replace(config.baseURL || "", "");

        const authHeader = await authService.getAuthHeader(
          method,
          url.origin + url.pathname,
          queryParams
        );

        config.headers.Authorization = authHeader;

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Method to update configuration after login
  updateConfig(userData: any) {
    if (userData.restletUrl) {
      // Parse the restletUrl to extract components
      const url = new URL(userData.restletUrl);
      const scriptId = url.searchParams.get('script') || '';
      const deployId = url.searchParams.get('deploy') || '';
      
      this.config = {
        accountId: userData.accountId,
        consumerKey: userData.clientId,
        consumerSecret: userData.clientSecret,
        tokenId: userData.tokenId,
        tokenSecret: userData.tokensecret,
        scriptId: scriptId,
        deployId: deployId,
        realm: userData.accountId,
      };

      // Update baseURL for the axios instance
      const baseURL = `https://${userData.accountId}.restlets.api.netsuite.com/app/site/hosting/restlet.nl`;
      this.axiosInstance.defaults.baseURL = baseURL;
    }
  }

  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, {
      ...config,
      params: {
        ...params,
        script: this.config.scriptId,
        deploy: this.config.deployId,
      },
    });
    return response.data;
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data, {
      ...config,
      params: {
        script: this.config.scriptId,
        deploy: this.config.deployId,
      },
    });
    return response.data;
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data, {
      ...config,
      params: {
        script: this.config.scriptId,
        deploy: this.config.deployId,
      },
    });
    return response.data;
  }

  async delete<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint, {
      ...config,
      params: {
        script: this.config.scriptId,
        deploy: this.config.deployId,
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClientClass();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, 
    },
  },
});
