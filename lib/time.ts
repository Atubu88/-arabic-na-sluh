export function isNotificationWindow(now: Date, timeLocal: string, offsetMinutes: number) {
  const [hour, minute] = timeLocal.split(":").map(Number);
  const target = hour * 60 + minute;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const localMinutes = (utcMinutes + offsetMinutes + 1_440) % 1_440;
  const delta = (localMinutes - target + 1_440) % 1_440;
  return delta < 15;
}
