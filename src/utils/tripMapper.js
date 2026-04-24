import { getDaysLeft } from "./date";

export function enrichTrip(trip) {
  return {
    ...trip,
    daysLeft: getDaysLeft(trip.startDate)
  };
}

export function enrichTrips(trips) {
  return trips.map(enrichTrip);
}

export function getUpcomingTrip(trips) {
  if (!Array.isArray(trips) || trips.length === 0) {
    return null;
  }

  return [...trips].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  )[0];
}