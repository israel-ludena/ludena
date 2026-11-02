/* eslint-disable @typescript-eslint/no-explicit-any */
import envConfig, { defaultLocale } from "@/config";
import { redirect } from "@/i18n/navigation";
import {
  getAccessTokenFromLocalStorage,
  normalizePath,
  removeTokensFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
} from "@/lib/utils";
import { LoginResType } from "@/schemaValidations/auth.schema";
import Cookies from "js-cookie";

type CustomOptions = Omit<RequestInit, "method"> & {
  baseUrl?: string | undefined;
};

const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;

type EntityErrorPayload = {
  message: string;
  errors: {
    field: string;
    message: string;
  }[];
};

export class HttpError extends Error {
  status: number;
  payload: {
    message: string;
    [key: string]: any;
  };
  constructor({ status, payload, message = "HTTP error" }: { status: number; payload: any; message?: string }) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: typeof ENTITY_ERROR_STATUS;
  payload: EntityErrorPayload;
  constructor({ status, payload }: { status: typeof ENTITY_ERROR_STATUS; payload: EntityErrorPayload }) {
    super({ status, payload, message: "Entity validation error" });
    this.status = status;
    this.payload = payload;
  }
}

let clientLogoutRequest: null | Promise<any> = null;
const isClient = typeof window !== "undefined";

const request = async <Response>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined;

  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }

  const baseHeaders: {
    [key: string]: string;
  } =
    body instanceof FormData
      ? {}
      : {
          "Content-Type": "application/json",
        };

  if (isClient) {
    const accessToken = getAccessTokenFromLocalStorage();
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  // Server-side: use SERVER_API_ENDPOINT (not exposed to client)
  // Client-side: use NEXT_PUBLIC_API_ENDPOINT (can be empty for nginx proxy)
  const defaultBaseUrl = isClient
    ? envConfig.NEXT_PUBLIC_API_ENDPOINT
    : envConfig.SERVER_API_ENDPOINT || envConfig.NEXT_PUBLIC_API_ENDPOINT;

  const baseUrl = options?.baseUrl === undefined ? defaultBaseUrl : options.baseUrl;

  // If baseUrl is empty (nginx proxy mode), use relative URL
  const fullUrl = baseUrl ? `${baseUrl}/${normalizePath(url)}` : `/${normalizePath(url)}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options?.headers,
    } as any,
    body,
    method,
  });

  const payload: Response = await res.json();

  const data = {
    status: res.status,
    payload,
  };

  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: 422;
          payload: EntityErrorPayload;
        }
      );
    } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
      if (isClient) {
        const locale = Cookies.get("NEXT_LOCALE");
        if (!clientLogoutRequest) {
          clientLogoutRequest = fetch("/api/auth/logout", {
            method: "POST",
            body: null,
            headers: {
              ...baseHeaders,
            } as any,
          });
          try {
            await clientLogoutRequest;
          } catch (error) {
            console.error("Logout request failed:", error);
          } finally {
            removeTokensFromLocalStorage();
            clientLogoutRequest = null;
            location.href = `/${locale}/login`;
          }
        }
      } else {
        const locale = Cookies.get("NEXT_LOCALE");
        const accessToken = (options?.headers as any)?.Authorization.split("Bearer ")[1];
        redirect({ href: `/logout?accessToken=${accessToken}`, locale: locale ?? defaultLocale });
      }
    } else {
      throw new HttpError(data);
    }
  }

  if (isClient) {
    const normalizeUrl = normalizePath(url);
    if (["api/auth/login", "api/guest/auth/login"].includes(normalizeUrl)) {
      const { accessToken, refreshToken } = (payload as LoginResType).data;
      setAccessTokenToLocalStorage(accessToken);
      setRefreshTokenToLocalStorage(refreshToken);
    } else if ("api/auth/token" === normalizeUrl) {
      const { accessToken, refreshToken } = payload as {
        accessToken: string;
        refreshToken: string;
      };
      setAccessTokenToLocalStorage(accessToken);
      setRefreshTokenToLocalStorage(refreshToken);
    } else if (["api/auth/logout", "api/guest/auth/logout"].includes(normalizeUrl)) {
      removeTokensFromLocalStorage();
    }
  }

  return data;
};

const http = {
  get<Response>(url: string, options?: Omit<CustomOptions, "body"> | undefined) {
    return request<Response>("GET", url, options);
  },
  post<Response>(url: string, body: any, options?: Omit<CustomOptions, "body"> | undefined) {
    return request<Response>("POST", url, { ...options, body });
  },
  put<Response>(url: string, body: any, options?: Omit<CustomOptions, "body"> | undefined) {
    return request<Response>("PUT", url, { ...options, body });
  },
  delete<Response>(url: string, options?: Omit<CustomOptions, "body"> | undefined) {
    return request<Response>("DELETE", url, { ...options });
  },
};

export default http;
