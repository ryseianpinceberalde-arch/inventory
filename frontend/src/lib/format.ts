import { format } from "date-fns";

export const MAX_MONEY_INPUT = "9999999999.99";
export const MAX_MONEY_AMOUNT = Number(MAX_MONEY_INPUT);

export function isMoneyInputWithinLimit(value: string) {
  return value === "" || (/^\d{1,10}(\.\d{0,2})?$/.test(value) && Number(value) <= MAX_MONEY_AMOUNT);
}

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
