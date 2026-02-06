import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract error message from API error response (axios)
 */
export const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } })
      .response
    if (response?.data?.message) {
      return response.data.message
    }
  }
  if (err instanceof Error) {
    return err.message
  }
  return "An unexpected error occurred. Please try again."
}
