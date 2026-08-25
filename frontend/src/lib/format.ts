import { format } from "date-fns";

export function peso(value: number | string) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value));
}

export function manilaDate(value: string | Date, pattern = "MMMM d, yyyy") {
  return format(new Date(value), pattern);
}

export function manilaTime(value: string | Date) {
  return format(new Date(value), "h:mm a");
}
