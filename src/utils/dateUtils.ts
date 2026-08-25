/**
 * Utility functions for handling weeks, days and dates in AyeTasks
 */

export interface WeekDay {
  name: string; // e.g. "Lunes"
  dateString: string; // e.g. "2026-08-24"
  dayNumber: number; // e.g. 24
  monthName: string; // e.g. "Agosto"
  isToday: boolean;
}

export type Language = 'es' | 'en';

const DAY_NAMES: Record<Language, string[]> = {
  es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

const MONTH_NAMES: Record<Language, string[]> = {
  es: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
};

/**
 * Returns the Monday of the week for a given date
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the 7 days of the week starting from Monday
 */
export function getWeekDays(referenceDate: Date, lang: Language = 'es'): WeekDay[] {
  const monday = getMondayOfWeek(referenceDate);
  const todayStr = formatDateISO(new Date());

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);

    const dateString = formatDateISO(current);
    days.push({
      name: DAY_NAMES[lang][i],
      dateString,
      dayNumber: current.getDate(),
      monthName: MONTH_NAMES[lang][current.getMonth()],
      isToday: dateString === todayStr,
    });
  }
  return days;
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatWeekHeaderTitle(referenceDate: Date, lang: Language = 'es'): string {
  const monday = getMondayOfWeek(referenceDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const month = MONTH_NAMES[lang][monday.getMonth()];
  const weekNumber = Math.ceil(monday.getDate() / 7);

  const weekLabel = lang === 'es' ? 'Semana' : 'Week';
  return `${month} - ${weekLabel} ${weekNumber} (${monday.getDate()} - ${sunday.getDate()} ${month.slice(0, 3)})`;
}

/**
 * Safely parse UTC ISO timestamps received from backend without timezone skew
 */
export function parseUtcIsoTimestamp(isoString?: string): number {
  if (!isoString) return Date.now();
  let str = isoString.trim();
  // Ensure UTC indicator if missing
  if (!str.endsWith('Z') && !str.includes('+') && !str.slice(-6).includes('-')) {
    str += 'Z';
  }
  const parsed = new Date(str).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

/**
 * Formats seconds into HH:MM:SS with safety clamp against negative offsets
 */
export function formatDigitalTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats logged duration into human-readable compact format (e.g. 1H 20M, 45M, 30S)
 */
export function formatLoggedTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  if (safe <= 0) return '0M';

  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hrs > 0) {
    return mins > 0 ? `${hrs}H ${mins}M` : `${hrs}H`;
  }
  if (mins > 0) {
    return `${mins}M`;
  }
  return `${secs}S`;
}

/**
 * Formats estimated minutes into compact display with support for decimal hours and days
 */
export function formatEstimatedDuration(totalMinutes: number): string {
  const safeMins = Math.max(0, totalMinutes || 0);
  if (safeMins >= 1440) {
    const days = (safeMins / 1440).toFixed(1).replace(/\.0$/, '');
    return `${days}D`;
  }
  if (safeMins >= 60) {
    const hours = (safeMins / 60).toFixed(1).replace(/\.0$/, '');
    return `${hours}H`;
  }
  return `${safeMins}M`;
}

/**
 * Automatically masks and formats raw user input into valid HH:MM (24-hour)
 */
export function formatTimeInput(text: string): string {
  const cleaned = text.replace(/[^0-9:]/g, '');
  if (!cleaned) return '';

  const parts = cleaned.split(':');
  if (parts.length === 1) {
    const digits = parts[0];
    if (digits.length <= 2) {
      const h = parseInt(digits, 10);
      if (!isNaN(h) && h > 23) {
        return '23:';
      }
      if (digits.length === 2) {
        return `${digits}:`;
      }
      return digits;
    } else {
      let hStr = digits.slice(0, 2);
      let mStr = digits.slice(2, 4);
      let hNum = Math.min(23, parseInt(hStr, 10) || 0);
      let mNum = Math.min(59, parseInt(mStr, 10) || 0);
      return `${String(hNum).padStart(2, '0')}:${mStr.length === 1 ? mStr : String(mNum).padStart(2, '0')}`;
    }
  } else {
    let hStr = parts[0].slice(0, 2);
    let mStr = parts[1].slice(0, 2);
    let hNum = parseInt(hStr, 10);
    if (!isNaN(hNum) && hNum > 23) {
      hStr = '23';
    }
    let mNum = parseInt(mStr, 10);
    if (!isNaN(mNum) && mNum > 59) {
      mStr = '59';
    }
    return `${hStr}:${mStr}`;
  }
}

/**
 * Validates strictly formatted HH:MM (00:00 to 23:59)
 */
export function isValidTimeHHMM(timeStr?: string): boolean {
  if (!timeStr) return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr.trim());
}

/**
 * Formats 24h HH:MM to friendly 12h display with AM/PM (e.g. 18:30 -> 6:30 PM)
 */
export function formatTime12h(timeStr?: string): string {
  if (!timeStr || !isValidTimeHHMM(timeStr)) return timeStr || '';
  const [hStr, mStr] = timeStr.trim().split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}
