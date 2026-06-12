export function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return "Hozir";
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m} daqiqa oldin`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h} soat oldin`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Kecha";
    if (d < 7)   return `${d} kun oldin`;
    return new Date(iso).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export function clockTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
