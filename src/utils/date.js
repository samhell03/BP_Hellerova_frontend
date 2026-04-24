export function formatDate(dateValue) {
  try {
    return new Date(dateValue).toLocaleDateString("cs-CZ");
  } catch {
    return "";
  }
}

export function getDaysLeft(startDate) {
  const today = new Date();
  const start = new Date(startDate);
  return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
}

export function getTripStatusText(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  if (start <= today && end >= today) {
    return "Výlet právě probíhá";
  }

  if (end < today) {
    return "Výlet už proběhl";
  }

  const daysLeft = getDaysLeft(startDate);

  if (daysLeft === 0) {
    return "Výlet začíná dnes";
  }

  return `Začíná za ${daysLeft} dní`;
}