import axios, { AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HmacSHA256, enc } from "crypto-js";
import { Redirect, router } from "expo-router";
import { useJobStore } from "@/store/globalStore";

export interface NetSuiteConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
  scriptId: string;
  deployId: string;
  realm: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  instance?: string;
}

export interface UserData {
  username: string;
  name?: string;
  role?: string;
  id?: string;
  accountId?: string;
  clientId?: string;
  clientSecret?: string;
  tokenId?: string;
  tokensecret?: string;
  restletUrl?: string;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
}

const AUTH_TOKEN_KEY = "@auth_token";
const USER_DATA_KEY = "@user_data";

const defaultConfig: NetSuiteConfig = {
  accountId: "11218546",
  consumerKey:
    "cf727d4c720908990adb640676f54377feccb1c38d56850dc7f5a21182632dad",
  consumerSecret:
    "d6c12373dd2309d80ea359495cad3547c2dd0c631ccb9752a3fa62da7234f8ae",
  tokenId: "9e9d3872c75421ca8618f5097ccf27b5ed678e8c5b38982f1a54106f6fa6b5c8",
  tokenSecret:
    "3c4814d0575f6913339b460e9c82788dac19e7b5baad862cb381403091c39692",
  scriptId: "116",
  deployId: "1",
  realm: "11218546",
};

const generateNonce = (length: number = 10): string => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

const percentEncode = (str: string): string => {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
};

const createSignature = (
  method: string,
  baseUrl: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  const paramString = Object.keys(sortedParams)
    .map((key) => `${percentEncode(key)}=${percentEncode(sortedParams[key])}`)
    .join("&");

  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(
    tokenSecret
  )}`;

  return HmacSHA256(signatureBaseString, signingKey).toString(enc.Base64);
};

const generateOAuthHeader = (
  method: string,
  baseUrl: string,
  queryParams: Record<string, string>,
  config: NetSuiteConfig
): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.tokenId,
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: "1.0",
  };

  // Combine OAuth params with query params for signature calculation
  const signatureParams = { ...oauthParams, ...queryParams };

  // Generate signature
  const signature = createSignature(
    method,
    baseUrl,
    signatureParams,
    config.consumerSecret,
    config.tokenSecret
  );

  // Add signature to OAuth params
  oauthParams.oauth_signature = signature;

  // Build OAuth header string
  const oauthHeader = [
    `OAuth realm="${config.realm}"`,
    `oauth_consumer_key="${percentEncode(oauthParams.oauth_consumer_key)}"`,
    `oauth_token="${percentEncode(oauthParams.oauth_token)}"`,
    `oauth_signature_method="${percentEncode(oauthParams.oauth_signature_method)}"`,
    `oauth_timestamp="${oauthParams.oauth_timestamp}"`,
    `oauth_nonce="${percentEncode(oauthParams.oauth_nonce)}"`,
    `oauth_version="${oauthParams.oauth_version}"`,
    `oauth_signature="${percentEncode(oauthParams.oauth_signature)}"`
  ].join(",");

  return oauthHeader;
};

class AuthServiceClass {
  private config: NetSuiteConfig;

  constructor(config: NetSuiteConfig = defaultConfig) {
    this.config = config;
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ success: boolean; userData?: UserData }> {
    try {
      const { username, password, instance = "PROD" } = credentials;

      // Always use the PROD URL - the server handles instance routing via the instance parameter
      const accountIdLower = this.config.accountId.toLowerCase();
      const baseUrl = `https://${accountIdLower}.restlets.api.netsuite.com/app/site/hosting/restlet.nl`;
      const queryParams = {
        script: this.config.scriptId,
        deploy: this.config.deployId,
      };

      const endpoint = `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`;

      console.log("🔐 Login attempt with instance:", instance);
      console.log("🔐 Using account ID:", this.config.accountId);
      console.log("🔐 Endpoint URL:", endpoint);
      console.log("🔐 Request body:", { username, password, instance, type: "login" });

      const authHeader = generateOAuthHeader(
        "POST",
        baseUrl,
        queryParams,
        this.config
      );

      const requestBody = {
        username,
        password,
        instance,
        type: "login",
      };

      const response = await axios({
        method: "POST",
        url: endpoint,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        data: requestBody,
      });

      console.log("res", response.data);

      if (
        response.data === true ||
        response.data === "true" ||
        response.data.status === 200
      ) {
        const mockToken: AuthToken = {
          token: `${username}_${Date.now()}`,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };

        const fullUserData = {
          username,
          name: response.data.message.name,
          role: response.data.message.role,
          accountId: response.data.message.accountId,
          clientId: response.data.message.clientId,
          clientSecret: response.data.message.clientSecret,
          tokenId: response.data.message.tokenId,
          tokensecret: response.data.message.tokensecret,
          restletUrl: response.data.message.restletUrl,
          tabs: response.data.message.tabs, // Add the tabs data
        };

        await this.storeAuthToken(mockToken);
        await this.storeUserData(fullUserData);

        console.log("userdata", fullUserData);

        return { success: true, userData: fullUserData };
      }

      return { success: false };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async storeAuthToken(token: AuthToken): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token));
    } catch (error) {
      console.error("Error storing auth token:", error);
      throw error;
    }
  }

  async storeUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("Error storing user data:", error);
      throw error;
    }
  }

  async getAuthToken(): Promise<AuthToken | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return token ? JSON.parse(token) : null;
    } catch (error) {
      console.error("Error retrieving auth token:", error);
      return null;
    }
  }

  async getUserData(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return false;

    return token.expiresAt > Date.now();
  }

  async changePassword(changePasswordData: {
    username: string;
    oldPassword: string;
    newPassword: string;
    instance?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const { username, oldPassword, newPassword, instance = "PROD" } = changePasswordData;

      // Always use the PROD URL - the server handles instance routing via the instance parameter
      const accountIdLower = this.config.accountId.toLowerCase();
      const baseUrl = `https://${accountIdLower}.restlets.api.netsuite.com/app/site/hosting/restlet.nl`;
      const queryParams = {
        script: this.config.scriptId,
        deploy: this.config.deployId,
      };

      const endpoint = `${baseUrl}?script=${queryParams.script}&deploy=${queryParams.deploy}`;

      console.log("🔐 Change password attempt with instance:", instance);
      console.log("🔐 Using account ID:", this.config.accountId);
      console.log("🔐 Endpoint URL:", endpoint);
      console.log("🔐 Request body:", { username, oldpassword: oldPassword, newpassword: newPassword, instance, type: "changePassword" });

      const authHeader = generateOAuthHeader(
        "POST",
        baseUrl,
        queryParams,
        this.config
      );

      const requestBody = {
        type: "changePassword",
        username,
        oldpassword: oldPassword,
        newpassword: newPassword,
        instance,
      };

      const response = await axios({
        method: "POST",
        url: endpoint,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        data: requestBody,
      });
      console.log("fe", response.data);
      if (response.data === true || response.data === "true") {
        return { success: true, message: "Password changed successfully" };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to change password",
      };
    } catch (error) {
      console.error("Password change error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear auth token
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      
      // Clear user data (including NetSuite credentials)
      await AsyncStorage.removeItem(USER_DATA_KEY);
      
      // Clear any other cached data if needed
      // You can add more cleanup here if needed
      
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  }

  async getAuthHeader(
    method: string,
    url: string,
    queryParams: Record<string, string> = {}
  ): Promise<string> {
    // Get the current user data to use dynamic credentials
    const userData = await this.getUserData();
    if (!userData?.restletUrl) {
      throw new Error("User data not available. Please login again.");
    }

    // Create dynamic config from user data
    const dynamicConfig: NetSuiteConfig = {
      accountId: userData.accountId || '',
      consumerKey: userData.clientId || '',
      consumerSecret: userData.clientSecret || '',
      tokenId: userData.tokenId || '',
      tokenSecret: userData.tokensecret || '',
      scriptId: new URL(userData.restletUrl).searchParams.get('script') || '',
      deployId: new URL(userData.restletUrl).searchParams.get('deploy') || '',
      realm: userData.accountId || '',
    };

    return generateOAuthHeader(method, url, queryParams, dynamicConfig);
  }

  // Method to update configuration after login
  updateConfig(userData: any) {
    if (userData.restletUrl) {
      // Parse the restletUrl to extract components
      const url = new URL(userData.restletUrl);
      const scriptId = url.searchParams.get('script') || '';
      const deployId = url.searchParams.get('deploy') || '';
      
      // Extract account ID from the restlet URL (handles SB1, SB2, PROD)
      const urlParts = userData.restletUrl.split('.');
      const accountId = urlParts[0].replace('https://', '');
      
      this.config = {
        accountId: accountId,
        consumerKey: userData.clientId,
        consumerSecret: userData.clientSecret,
        tokenId: userData.tokenId,
        tokenSecret: userData.tokensecret,
        scriptId: scriptId,
        deployId: deployId,
        realm: accountId,
      };

      // Update baseURL for the axios instance
      const baseURL = `https://${accountId}.restlets.api.netsuite.com/app/site/hosting/restlet.nl`;
      this.axiosInstance.defaults.baseURL = baseURL;
      
      console.log("API Client configured with:", {
        accountId: this.config.accountId,
        scriptId: this.config.scriptId,
        deployId: this.config.deployId,
        baseURL: baseURL
      });
    }
  }

  // Method to test current configuration
  async testCurrentConfig(): Promise<{
    hasUserData: boolean;
    hasCredentials: boolean;
    config: Partial<NetSuiteConfig>;
    restletUrl: string | null;
  }> {
    try {
      const userData = await this.getUserData();
      const hasUserData = !!userData;
      
      if (!userData) {
        return {
          hasUserData: false,
          hasCredentials: false,
          config: {},
          restletUrl: null
        };
      }

      const hasCredentials = !!(
        userData.accountId &&
        userData.clientId &&
        userData.clientSecret &&
        userData.tokenId &&
        userData.tokensecret &&
        userData.restletUrl
      );

      const config: Partial<NetSuiteConfig> = {
        accountId: userData.accountId,
        consumerKey: userData.clientId,
        consumerSecret: userData.clientSecret,
        tokenId: userData.tokenId,
        tokenSecret: userData.tokensecret,
        scriptId: userData.restletUrl ? new URL(userData.restletUrl).searchParams.get('script') : null,
        deployId: userData.restletUrl ? new URL(userData.restletUrl).searchParams.get('deploy') : null,
        realm: userData.accountId,
      };

      return {
        hasUserData,
        hasCredentials,
        config,
        restletUrl: userData.restletUrl
      };
    } catch (error) {
      console.error("Error testing current config:", error);
      return {
        hasUserData: false,
        hasCredentials: false,
        config: {},
        restletUrl: null
      };
    }
  }

  // Test OAuth signature generation
  async testOAuthSignature(): Promise<string> {
    try {
      const userData = await this.getUserData();
      if (!userData?.restletUrl) {
        throw new Error("No user data available");
      }

      const url = new URL(userData.restletUrl);
      const baseUrl = url.origin + url.pathname;
      const queryParams = {
        script: url.searchParams.get('script') || '',
        deploy: url.searchParams.get('deploy') || '',
      };

      const authHeader = await this.getAuthHeader("POST", baseUrl, queryParams);
      
      return authHeader;
    } catch (error) {
      console.error("Error testing OAuth signature:", error);
      throw error;
    }
  }
}

export const authService = new AuthServiceClass();
