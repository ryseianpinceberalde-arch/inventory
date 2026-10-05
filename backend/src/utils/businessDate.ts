// SmartStock's existing business timezone is Asia/Manila (UTC+08:00, no DST).
export function businessDateKey(value: Date) {
  return new Date(value.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function businessDayStart(value: Date) {
  return new Date(`${businessDateKey(value)}T00:00:00+08:00`);
}
