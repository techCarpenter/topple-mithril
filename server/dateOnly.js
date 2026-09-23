/** Validate and preserve an API local calendar date. */
function dateOnly(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value) return value;
  }
  const error = new TypeError("Date must be a real YYYY-MM-DD calendar date");
  error.statusCode = 400;
  throw error;
}

export { dateOnly };
