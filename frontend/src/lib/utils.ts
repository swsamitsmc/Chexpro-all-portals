import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-blue-100 text-blue-700",
    data_verification: "bg-purple-100 text-purple-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    pending_review: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    requires_action: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    on_hold: "bg-gray-100 text-gray-600",
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
    suspended: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
