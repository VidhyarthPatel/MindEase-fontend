import { TimeFormat } from '../types';

class TimeUtils {
  /**
   * Format milliseconds to human readable time
   */
  static formatTime(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format milliseconds to detailed time format
   */
  static formatDetailedTime(milliseconds: number): TimeFormat {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const totalSeconds = Math.floor(milliseconds / 1000);

    return {
      hours,
      minutes,
      seconds,
      totalMinutes,
      totalSeconds,
    };
  }

  /**
   * Format time for display in charts
   */
  static formatTimeForChart(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  }

  /**
   * Convert time string (HH:mm) to minutes
   */
  static timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string (HH:mm)
   */
  static minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get current time in HH:mm format
   */
  static getCurrentTimeString(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Check if current time is within a time range
   */
  static isTimeInRange(
    currentTime: string,
    startTime: string,
    endTime: string
  ): boolean {
    const current = this.timeStringToMinutes(currentTime);
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);

    if (start <= end) {
      // Same day range (e.g., 09:00 - 17:00)
      return current >= start && current <= end;
    } else {
      // Overnight range (e.g., 22:00 - 06:00)
      return current >= start || current <= end;
    }
  }

  /**
   * Calculate time difference between two times
   */
  static getTimeDifference(startTime: string, endTime: string): number {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);

    if (end >= start) {
      return end - start;
    } else {
      // Overnight difference
      return (24 * 60) - start + end;
    }
  }

  /**
   * Add minutes to a time string
   */
  static addMinutesToTime(timeString: string, minutesToAdd: number): string {
    const currentMinutes = this.timeStringToMinutes(timeString);
    const newMinutes = (currentMinutes + minutesToAdd) % (24 * 60);
    return this.minutesToTimeString(newMinutes);
  }

  /**
   * Get time ago string (e.g., "2 hours ago")
   */
  static getTimeAgo(timestamp: string | Date): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Format date for display
   */
  static formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
    const d = new Date(date);

    switch (format) {
      case 'short':
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      case 'long':
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'time':
        return d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      default:
        return d.toLocaleDateString();
    }
  }

  /**
   * Get start and end of day
   */
  static getDayBounds(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get start and end of week
   */
  static getWeekBounds(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get start and end of month
   */
  static getMonthBounds(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Get days between two dates
   */
  static getDaysBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Format duration for session display
   */
  static formatSessionDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  }

  /**
   * Calculate average session time
   */
  static calculateAverageSessionTime(sessions: { duration: number }[]): number {
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    return totalDuration / sessions.length;
  }

  /**
   * Get time of day category
   */
  static getTimeOfDayCategory(timeString: string): 'morning' | 'afternoon' | 'evening' | 'night' {
    const minutes = this.timeStringToMinutes(timeString);
    
    if (minutes >= 6 * 60 && minutes < 12 * 60) {
      return 'morning';
    } else if (minutes >= 12 * 60 && minutes < 17 * 60) {
      return 'afternoon';
    } else if (minutes >= 17 * 60 && minutes < 22 * 60) {
      return 'evening';
    } else {
      return 'night';
    }
  }
}

export default TimeUtils;

