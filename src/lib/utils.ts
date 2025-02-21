import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function for exponential backoff (can be placed in a separate file)
export function exponentialBackoff(attempt: number, initialDelay: number): number {
  return initialDelay * Math.pow(2, attempt);
}