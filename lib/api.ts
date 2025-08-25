import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5281";

const TOKEN_KEY = "auth_token";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token on each request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple response normalization
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export type LoginResponse = { accessToken: string; expiration: string };

export async function login(email: string, password: string): Promise<void> {
  const { data } = await api.post<LoginResponse>("/api/Auth/login", { email, password });
  await saveToken(data.accessToken);
}

export async function registerUser(params: {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  appPassword: string;
}): Promise<void> {
  await api.post("/api/Auth/register", params);
}

// User APIs
export type UserDto = {
  userName: string;
  email: string;
  createdAt: string;
  lastUpdatedAt: string;
};

export async function getMe(): Promise<UserDto> {
  const { data } = await api.get<UserDto>("/api/User");
  return data;
}

export async function updateMe(payload: {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  appPassword: string;
}): Promise<void> {
  await api.put("/api/User", payload);
}

// App Auto Lock APIs
export type AppLockDto = {
  id: number;
  appName: string;
  lockDuration: string; // TimeSpan serialized
  startTime: string;
  isLocked: boolean;
};

export async function listLocks(): Promise<AppLockDto[]> {
  const { data } = await api.get<AppLockDto[]>("/api/AppAutoLock");
  return data;
}

export async function createLock(appName: string, lockDuration: string): Promise<AppLockDto> {
  // lockDuration should be in HH:MM:SS format for TimeSpan
  const { data } = await api.post<AppLockDto>("/api/AppAutoLock", { appName, lockDuration });
  return data;
}

export async function overrideLock(appName: string, appPassword: string): Promise<any> {
  const { data } = await api.post("/api/AppAutoLock/override", { appName, appPassword });
  return data;
}


