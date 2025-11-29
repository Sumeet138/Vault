import { format, isToday, isYesterday, fromUnixTime } from "date-fns";

/**
 * Formats a date for grouping activities
 * @param dateInput - Date object, ISO string, or Unix timestamp (in seconds)
 * @returns Formatted date string (Today, Yesterday, or formatted date)
 */
export const formatDateGroup = (dateInput: Date | string | number): string => {
  let date: Date;

  if (typeof dateInput === "number") {
    // Assume Unix timestamp in seconds, convert to Date
    date = fromUnixTime(dateInput);
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMM d, yyyy");
  }
};

/**
 * Gets a date key for grouping activities by date
 * @param dateInput - Date object, ISO string, or Unix timestamp (in seconds)
 * @returns Date string key for grouping
 */
export const getDateKey = (dateInput: Date | string | number): string => {
  let date: Date;

  if (typeof dateInput === "number") {
    // Assume Unix timestamp in seconds, convert to Date
    date = fromUnixTime(dateInput);
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  return format(date, "yyyy-MM-dd");
};

/**
 * Formats a timestamp for display (e.g., "2:30 PM")
 * @param dateInput - Date object, ISO string, or Unix timestamp (in seconds)
 * @returns Formatted time string
 */
export const formatTime = (dateInput: Date | string | number): string => {
  let date: Date;

  if (typeof dateInput === "number") {
    // Assume Unix timestamp in seconds, convert to Date
    date = fromUnixTime(dateInput);
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  return format(date, "h:mm a");
};

/**
 * Formats a full date and time for display
 * @param dateInput - Date object, ISO string, or Unix timestamp (in seconds)
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateInput: Date | string | number): string => {
  let date: Date;

  if (typeof dateInput === "number") {
    // Assume Unix timestamp in seconds, convert to Date
    date = fromUnixTime(dateInput);
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  return format(date, "MMM d, yyyy h:mm a");
};

/**
 * Gets relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateInput - Date object, ISO string, or Unix timestamp (in seconds)
 * @returns Relative time string
 */
export const getRelativeTime = (dateInput: Date | string | number): string => {
  let date: Date;

  if (typeof dateInput === "number") {
    // Assume Unix timestamp in seconds, convert to Date
    date = fromUnixTime(dateInput);
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  } else {
    return format(date, "MMM d, yyyy");
  }
};
