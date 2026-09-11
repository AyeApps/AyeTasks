/**
 * Utility for calculating deadline time-decay progress and dynamic color shifting
 *
 * Rules:
 * - Day of delivery (< 24h): Updates hourly, Urgent Red (#ff1744)
 * - Less than 1 week (1-7 days): Updates daily, Amber Warning (#ffab00)
 * - Less than 1 month (7-30 days): Updates weekly/daily, Cyan (#00e5ff)
 * - Less than 1 year (1-12 months): Updates monthly/weekly, Green (#00c853)
 * - Overdue: Critical Pulsing Red (#d50000)
 */

export interface DeadlineProgress {
  percentage: number; // 0 to 100 (percentage of time elapsed towards deadline)
  label: string; // e.g. "14H LEFT", "3 DAYS LEFT", "2 WKS LEFT", "4 MOS LEFT", "OVERDUE"
  color: string; // Hex color based on urgency
  backgroundColor: string;
  isUrgent: boolean;
  isToday: boolean;
  isOverdue: boolean;
}

export function calculateDeadlineProgress(
  createdAtStr?: string,
  dueDateStr?: string,
  dueTimeStr?: string,
  isDark: boolean = true
): DeadlineProgress | null {
  if (!dueDateStr) return null;

  const now = new Date();

  // Target deadline timestamp
  let targetTime: Date;
  if (dueTimeStr && /^\d{2}:\d{2}$/.test(dueTimeStr)) {
    targetTime = new Date(`${dueDateStr}T${dueTimeStr}:00`);
  } else {
    targetTime = new Date(`${dueDateStr}T23:59:59`);
  }

  // If invalid date, fallback
  if (isNaN(targetTime.getTime())) return null;

  // Start reference date (creation time or 7 days prior fallback)
  let startTime = createdAtStr ? new Date(createdAtStr) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (isNaN(startTime.getTime()) || startTime.getTime() >= targetTime.getTime()) {
    startTime = new Date(targetTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const totalDurationMs = Math.max(1000 * 60 * 60, targetTime.getTime() - startTime.getTime());
  const elapsedMs = Math.max(0, now.getTime() - startTime.getTime());
  const remainingMs = targetTime.getTime() - now.getTime();

  // Percentage elapsed towards deadline (0% = just started, 100% = deadline reached)
  const percentage = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  // Case 1: Overdue
  if (remainingMs < 0) {
    const overdueDays = Math.ceil(Math.abs(remainingMs) / (1000 * 60 * 60 * 24));
    return {
      percentage: 100,
      label: overdueDays <= 1 ? 'OVERDUE (TODAY)' : `OVERDUE (${overdueDays}D AGO)`,
      color: '#ff1744',
      backgroundColor: isDark ? '#2d0a0f' : '#fee2e2',
      isUrgent: true,
      isToday: false,
      isOverdue: true,
    };
  }

  const remainingDays = remainingMs / (1000 * 60 * 60 * 24);

  // Case 2: Due Today (0 to 24 hours remaining) -> Live Countdown & Flashing Red
  if (remainingDays <= 1) {
    const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
    const remainingMins = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
    const label =
      remainingHours > 0
        ? `DUE IN ${remainingHours}H ${remainingMins}M`
        : `DUE IN ${remainingMins}M`;

    return {
      percentage,
      label,
      color: '#ff1744',
      backgroundColor: isDark ? '#2d0a0f' : '#fee2e2',
      isUrgent: true,
      isToday: true,
      isOverdue: false,
    };
  }

  // Case 3: Less than 1 week (1 to 7 days) -> Daily updates & Amber Warning
  if (remainingDays <= 7) {
    const daysLeft = Math.ceil(remainingDays);
    return {
      percentage,
      label: `${daysLeft} ${daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT`,
      color: '#ffab00',
      backgroundColor: isDark ? '#2a1c05' : '#fef3c7',
      isUrgent: false,
      isToday: false,
      isOverdue: false,
    };
  }

  // Case 4: Less than 1 month (7 to 30 days) -> Weekly updates & Cyan/Cobalt
  if (remainingDays <= 30) {
    const weeksLeft = Math.ceil(remainingDays / 7);
    return {
      percentage,
      label: `${weeksLeft} ${weeksLeft === 1 ? 'WK' : 'WKS'} LEFT`,
      color: isDark ? '#00e5ff' : '#0284c7',
      backgroundColor: isDark ? '#082530' : '#e0f2fe',
      isUrgent: false,
      isToday: false,
      isOverdue: false,
    };
  }

  // Case 5: Less than 1 year (30 to 365 days) -> Monthly updates & Emerald Green
  if (remainingDays <= 365) {
    const monthsLeft = Math.ceil(remainingDays / 30);
    return {
      percentage,
      label: `${monthsLeft} ${monthsLeft === 1 ? 'MO' : 'MOS'} LEFT`,
      color: '#00c853',
      backgroundColor: isDark ? '#0a2e16' : '#e8f8ee',
      isUrgent: false,
      isToday: false,
      isOverdue: false,
    };
  }

  // Case 6: More than 1 year (> 365 days) -> Purple Extended
  const yearsLeft = Math.ceil(remainingDays / 365);
  return {
    percentage,
    label: `${yearsLeft} ${yearsLeft === 1 ? 'YR' : 'YRS'} LEFT`,
    color: isDark ? '#a855f7' : '#7e22ce',
    backgroundColor: isDark ? '#240a34' : '#f3e8ff',
    isUrgent: false,
    isToday: false,
    isOverdue: false,
  };
}
