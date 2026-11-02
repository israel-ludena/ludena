/* eslint-disable @typescript-eslint/no-explicit-any */
import authApiRequest from "@/apiRequests/auth";
import { EntityError } from "@/lib/http";
import { clsx, type ClassValue } from "clsx";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { jwtDecode } from "jwt-decode";
import { DishStatus, OrderStatus, Role, TableStatus } from "@/constants/type";
import envConfig, { defaultLocale } from "@/config";
import { TokenPayload } from "@/types/jwt.types";
import guestApiRequest from "@/apiRequests/guest";
import { format } from "date-fns";
import { BookX, CookingPot, HandCoins, Loader, Truck } from "lucide-react";
import { io } from "socket.io-client";
import slugify from "slugify";
import Cookies from "js-cookie";

/**
 * Combines multiple class names into a single string, intelligently merging Tailwind CSS classes.
 *
 * @param inputs ClassValue[]
 * @returns string
 *
 * @example
 * cn('btn', 'btn-primary', { 'btn-disabled': isDisabled }) // returns 'btn btn-primary btn-disabled' if isDisabled is true
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a path by removing leading slashes.
 *
 * @param path Normalizes a path by removing leading slashes.
 * @returns The normalized path without leading slashes.
 *
 * @example
 * normalizePath("/api/auth/login") // returns "api/auth/login"
 * normalizePath("api/auth/login") // returns "api/auth/login"
 */
export const normalizePath = (path: string) => {
  return path.startsWith("/") ? path.slice(1) : path;
};

/**
 * Handles API errors by displaying them as toast notifications or setting form errors.
 * @param error The error object from the API.
 * @param setError Optional function to set form errors.
 * @param duration Optional duration for the toast notification.
 * @param fallbackErrorMessage Optional fallback error message when error message is not available.
 */
export const handleErrorApi = ({
  error,
  setError,
  duration,
  fallbackErrorMessage,
}: {
  error: any;
  setError?: UseFormSetError<any>;
  duration?: number;
  fallbackErrorMessage?: string;
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: "server",
        message: item.message,
      });
    });
  } else {
    toast.error(error?.payload?.message || fallbackErrorMessage || "Something went wrong", {
      duration: duration || 5000,
    });
  }
};

const isBrowser = typeof window !== "undefined";

/**
 * Retrieves the access token from local storage.
 *
 * @returns The access token if it exists, otherwise null.
 */
export const getAccessTokenFromLocalStorage = () => {
  return isBrowser ? localStorage.getItem("accessToken") : null;
};

/**
 * Retrieves the refresh token from local storage.
 *
 * @returns The refresh token if it exists, otherwise null.
 */
export const getRefreshTokenFromLocalStorage = () => {
  return isBrowser ? localStorage.getItem("refreshToken") : null;
};

/**
 * Stores the access token in local storage.
 *
 * @param token The access token to be stored.
 */
export const setAccessTokenToLocalStorage = (token: string) => {
  if (isBrowser) localStorage.setItem("accessToken", token);
};

/**
 * Stores the refresh token in local storage.
 *
 * @param token The refresh token to be stored.
 */
export const setRefreshTokenToLocalStorage = (token: string) => {
  if (isBrowser) localStorage.setItem("refreshToken", token);
};

/**
 * Removes both access and refresh tokens from local storage.
 *
 * @returns void
 */
export const removeTokensFromLocalStorage = () => {
  if (isBrowser) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
};

/**
 * Checks the validity of the access token and refreshes it if necessary.
 *
 * @param param Optional callbacks for success and error handling.
 * @returns A promise that resolves when the token check and refresh process is complete.
 */
export const checkAndRefreshToken = async (param?: {
  onError?: () => void;
  onSuccess?: () => void;
  force?: boolean;
}) => {
  const accessToken = getAccessTokenFromLocalStorage();
  const refreshToken = getRefreshTokenFromLocalStorage();
  if (!accessToken || !refreshToken) return;
  const decodedAccessToken = decodeToken(accessToken);
  const decodedRefreshToken = decodeToken(refreshToken);
  const now = new Date().getTime() / 1000 - 1;

  // If the refresh token is expired, do nothing (user needs to log in again)
  if (decodedRefreshToken.exp <= now) {
    removeTokensFromLocalStorage();
    return param?.onError?.();
  }

  if (param?.force || decodedAccessToken.exp - now < (decodedAccessToken.exp - decodedAccessToken.iat) / 3) {
    try {
      const role = decodedRefreshToken.role;
      const res = role === Role.Guest ? await guestApiRequest.refreshToken() : await authApiRequest.refreshToken();
      setAccessTokenToLocalStorage(res.payload.data.accessToken);
      setRefreshTokenToLocalStorage(res.payload.data.refreshToken);
      param?.onSuccess?.();
    } catch (error) {
      param?.onError?.();
      console.error("Error refreshing token:", error);
    }
  }
};

/**
 * Formats a number as currency in Vietnamese Dong (VND).
 *
 * @param number The number to be formatted as currency.
 * @returns The formatted currency string in Vietnamese Dong (VND).
 */
export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(number);
};

/**
 * Gets the Vietnamese translation of a dish status.
 *
 * @param status The status of the dish.
 * @returns The Vietnamese translation of the dish status.
 */
export const getVietnameseDishStatus = (status: (typeof DishStatus)[keyof typeof DishStatus]) => {
  switch (status) {
    case DishStatus.Available:
      return "Có sẵn";
    case DishStatus.Unavailable:
      return "Không có sẵn";
    default:
      return "Ẩn";
  }
};

/**
 * Gets the Vietnamese translation of an order status.
 *
 * @param status The status of the order.
 * @returns The Vietnamese translation of the order status.
 */
export const getVietnameseOrderStatus = (status: (typeof OrderStatus)[keyof typeof OrderStatus]) => {
  switch (status) {
    case OrderStatus.Delivered:
      return "Đã phục vụ";
    case OrderStatus.Paid:
      return "Đã thanh toán";
    case OrderStatus.Pending:
      return "Chờ xử lý";
    case OrderStatus.Processing:
      return "Đang nấu";
    default:
      return "Từ chối";
  }
};

/**
 * Gets the Vietnamese translation of a table status.
 *
 * @param status The status of the table.
 * @returns The Vietnamese translation of the table status.
 */
export const getVietnameseTableStatus = (status: (typeof TableStatus)[keyof typeof TableStatus]) => {
  switch (status) {
    case TableStatus.Available:
      return "Có sẵn";
    case TableStatus.Reserved:
      return "Đã đặt";
    default:
      return "Ẩn";
  }
};

/**
 * Generates a table link with the provided token and table number.
 *
 * @param param An object containing the token and table number.
 * @returns The generated table link as a string.
 */
export const getTableLink = ({ token, tableNumber }: { token: string; tableNumber: number }) => {
  const locale = isBrowser ? Cookies.get("NEXT_LOCALE") || defaultLocale : defaultLocale;
  return envConfig.NEXT_PUBLIC_URL + `/${locale}/tables/` + tableNumber + "?token=" + token;
};

/**
 * Decodes a JWT token and returns its payload.
 *
 * @param token The JWT token to be decoded.
 * @returns The decoded token payload or null if decoding fails.
 */
export const decodeToken = (token: string) => {
  return jwtDecode(token) as TokenPayload;
};

/**
 * Removes accents from a given string.
 *
 * @param str The string to be processed.
 * @returns The processed string with accents removed.
 */
export function removeAccents(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Performs a simple text match by checking if matchText is found within fullText.
 *
 * @param fullText  The full text to be searched.
 * @param matchText The text to match within the full text.
 * @returns True if matchText is found within fullText (case-insensitive and accent-insensitive), otherwise false.
 */
export const simpleMatchText = (fullText: string, matchText: string) => {
  return removeAccents(fullText.toLowerCase()).includes(removeAccents(matchText.trim().toLowerCase()));
};

/**
 * Formats a date to a locale string in the format "HH:mm:ss dd/MM/yyyy".
 *
 * @param date The date to be formatted, either as a string or a Date object.
 * @returns The formatted date string in the format "HH:mm:ss dd/MM/yyyy".
 */
export const formatDateTimeToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), "HH:mm:ss dd/MM/yyyy");
};

/**
 * Formats a date to a time string in the format "HH:mm:ss".
 *
 * @param date The date to be formatted, either as a string or a Date object.
 * @returns The formatted time string in the format "HH:mm:ss".
 */
export const formatDateTimeToTimeString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), "HH:mm:ss");
};

/**
 * Icons representing different order statuses.
 */
export const OrderStatusIcon = {
  [OrderStatus.Pending]: Loader,
  [OrderStatus.Processing]: CookingPot,
  [OrderStatus.Rejected]: BookX,
  [OrderStatus.Delivered]: Truck,
  [OrderStatus.Paid]: HandCoins,
};

/**
 * Generates a Socket.IO client instance connected to the server with the provided access token.
 *
 * @param accessToken The access token used for authentication.
 * @returns A Socket.IO client instance connected to the server with the provided access token.
 */
export const generateSocketInstance = (accessToken: string) => {
  return io(envConfig.NEXT_PUBLIC_SOCKET_URL, {
    auth: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/**
 * Wraps a server API function call, handling specific redirect errors.
 *
 * @param fn A function that returns a promise.
 * @returns The result of the promise if it resolves successfully, otherwise null.
 */
export const wrapServerApi = async <T>(fn: () => Promise<T>) => {
  let result = null;
  try {
    result = await fn();
  } catch (error: any) {
    if (error.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
  }
  return result;
};

/**
 * Generates a slug URL from a name and ID.
 *
 * @param param0 An object containing the name and ID.
 * @returns The generated slug URL in the format "{slugified-name}-i.{id}".
 */
export const generateSlugUrl = ({ name, id }: { name: string; id: number }) => {
  return `${slugify(name)}-i.${id}`;
};

/**
 * Extracts the ID from a slug URL.
 *
 * @param slug The slug URL in the format "{slugified-name}-i.{id}".
 * @returns The extracted ID as a number.
 */
export const getIdFromSlugUrl = (slug: string) => {
  return Number(slug.split("-i.")[1]);
};
