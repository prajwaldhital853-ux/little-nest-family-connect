import { format } from "date-fns";

export function formatMessageDateShort(iso: string): string {
  return format(new Date(iso), "MMM d");
}

export function formatMessageDateLong(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy");
}
