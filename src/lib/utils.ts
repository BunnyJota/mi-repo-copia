import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Devuelve la URL base de la app tomando como fuente única la env `VITE_APP_URL`
 * y con fallback a `window.location.origin` en el cliente.
 */
export function getAppUrl() {
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined;
  const normalizedEnv = envUrl?.replace(/\/$/, "");

  if (normalizedEnv) return normalizedEnv;
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");

  // Fallback sensato para builds sin entorno definido
  return "https://trimly.it.com";
}
