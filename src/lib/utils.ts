import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

 export const formatTimeHelper = () =>
    (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();

      // Check if it's today
      const isToday = date.toDateString() === now.toDateString();

      // Check if it's yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      // Check if it's this week
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (isToday) {
        // Today: show time like "14:30"
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } else if (isYesterday) {
        // Yesterday: show "Hôm qua"
        return "Hôm qua";
      } else if (daysDiff < 7) {
        // This week: show day name like "Thứ hai", "Thứ ba"
        return date.toLocaleDateString('vi-VN', { weekday: 'long' });
      } else if (date.getFullYear() === now.getFullYear()) {
        // This year: show date like "12 Th10"
        return date.toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'short'
        });
      } else {
        // Different year: show full date like "12/10/2023"
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }

  // Format exact time function
  export const formatExactTimeHelper = () =>
    (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }
