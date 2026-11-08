const WEEKDAYS = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
];

export function normalizeRecurrence(value) {
  const recurrence = value ?? { type: "never" };

  if (
    typeof recurrence !== "object" ||
    Array.isArray(recurrence)
  ) {
    throw new Error("Invalid recurrence.");
  }

  switch (recurrence.type) {
    case "never":
      return { type: "never" };

    case "daily":
      return { type: "daily" };

    case "weekly": {
      if (
        !Array.isArray(recurrence.days) ||
        recurrence.days.length === 0 ||
        recurrence.days.some(day => !WEEKDAYS.includes(day))
      ) {
        throw new Error("Weekly events require valid weekdays.");
      }

      return {
        type: "weekly",
        days: WEEKDAYS.filter(day => recurrence.days.includes(day)),
      };
    }

    case "monthly":
      if (
        !Number.isInteger(recurrence.dayOfMonth) ||
        recurrence.dayOfMonth < 1 ||
        recurrence.dayOfMonth > 31
      ) {
        throw new Error("Monthly events require a day from 1 to 31.");
      }

      return {
        type: "monthly",
        dayOfMonth: recurrence.dayOfMonth,
      };

    default:
      throw new Error("Unsupported recurrence type.");
  }
}