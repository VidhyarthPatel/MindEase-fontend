import { format } from 'date-fns';

export const formatMilliseconds = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = [];
  if (hours > 0) formattedTime.push(`${hours}h`);
  if (minutes > 0) formattedTime.push(`${minutes}m`);
  if (seconds > 0) formattedTime.push(`${seconds}s`);

  return formattedTime.join(' ') || '0s';
};

export const getTodayStartAndEnd = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.setHours(0, 0, 0, 0));
  const end = new Date(now.setHours(23, 59, 59, 999));
  return { start, end };
};

export const totalTimeStr = (ms: number): string => {
  return formatMilliseconds(ms);
};