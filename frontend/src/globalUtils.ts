export const convertISOtoDDMMYYYY = (isoDateStr: string): string => {
  if (!isoDateStr) return "";
  const date = new Date(isoDateStr);
  const day = String(date.getDate()).padStart(1, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

export const formatDateWithTime = (isoDateStr: string): string => {
  if (!isoDateStr) return "";

  const date = new Date(isoDateStr);

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });

  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year} at ${hours}.${minutes}${ampm}`;
};

export const timeAgo = (isoDateStr: string): string => {
  const publishedTime = new Date(isoDateStr).getTime();
  const currentTime = Date.now();
  const diffInSeconds = Math.floor((currentTime - publishedTime) / 1000);

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / 3600);
  const days = Math.floor(diffInSeconds / 86400);

  if (diffInSeconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
};
