import { format } from "date-fns";

export function peso(value: number | string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    currencyDisplay: "narrowSymbol"
  }).format(Number(value));
}

export function manilaDate(value: string | Date, pattern = "MMMM d, yyyy") {
  return format(new Date(new Date(value).toLocaleString("en-US", { timeZone: "Asia/Manila" })), pattern);
}

export function manilaTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
