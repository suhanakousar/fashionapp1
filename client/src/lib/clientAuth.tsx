import { createContext, useContext, useState, useEffect } from "react";
import type { Client } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { getApiUrl } from "./api";

interface ClientAuthContextType {
  client: Client | null;
  isLoading: boolean;
  login: (phone: string, otp?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  requestOTP: (phone: string) => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const apiUrl = getApiUrl("/api/client/me");
      const response = await fetch(apiUrl, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
      }
    } catch {
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOTP = async (phone: string) => {
    await apiRequest("POST", "/api/client/request-otp", { phone });
  };

  const login = async (phone: string, otp?: string, password?: string) => {
    const response = await apiRequest("POST", "/api/client/login", {
      phone,
      otp,
      password,
    });
    const data = await response.json();
    if (!data.client) {
      throw new Error("Login failed: Invalid response");
    }
    setClient(data.client);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/client/logout");
    setClient(null);
  };

  return (
    <ClientAuthContext.Provider value={{ client, isLoading, login, logout, requestOTP }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth must be used within a ClientAuthProvider");
  }
  return context;
}

