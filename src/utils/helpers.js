export const iso = (date) => date.toISOString().slice(0, 10);

export const shift = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return iso(date);
};

export const addDays = (value, days) => {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return iso(date);
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const money = (value = 0) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export const shortDate = (value) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
      })
    : "-";

export const daysTo = (value) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  const deadline = Date.UTC(year, month - 1, day);

  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((deadline - today) / 86400000);
};

export const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = name;
  anchor.click();

  URL.revokeObjectURL(url);
};
