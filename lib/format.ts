export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

export function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function formatDelta(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPercent(value)}`;
}
