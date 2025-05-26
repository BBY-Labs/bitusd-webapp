import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Function to determine the color based on LTV value
 * @param ltvValue - The LTV value as a percentage
 * @returns Tailwind CSS class for the appropriate color
 */
export function getLtvColor(ltvValue: number): string {
  if (ltvValue <= 25) return "bg-green-500";
  if (ltvValue <= 50) return "bg-blue-500";
  if (ltvValue <= 70) return "bg-yellow-500";
  return "bg-red-500";
}
