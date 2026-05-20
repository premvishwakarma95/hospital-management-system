export const calculateAge = (dob: string | Date): number => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const formatDate = (d: string | Date): string => {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const toInputDate = (d?: string | Date): string => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

export const formatDateTime = (d: string | Date, time?: string): string => {
  const datePart = formatDate(d);
  return time ? `${datePart} at ${time}` : datePart;
};

export const statusColor = (status: string): string => {
  switch (status) {
    case "scheduled": return "bg-blue-50 text-blue-700";
    case "completed": return "bg-green-50 text-green-700";
    case "cancelled": return "bg-gray-100 text-gray-600";
    case "no_show": return "bg-red-50 text-red-700";
    default: return "bg-gray-100 text-gray-600";
  }
};

export const statusLabel = (status: string): string => {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const extractErrorMessage = (err: unknown, fallback = "Something went wrong"): string => {
  if (typeof err === "object" && err !== null) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
};
