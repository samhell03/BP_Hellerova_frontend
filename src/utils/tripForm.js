const MIN_TRIP_YEAR = 1950;
const MAX_TRIP_YEAR = 2100;
const MAX_TRIP_DURATION_DAYS = 365;

function isCompleteDateInput(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidDateValue(value) {
  if (!isCompleteDateInput(value)) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function getTripDurationInDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function createEmptyTripForm() {
  return {
    title: "",
    countryName: "",
    countryCode: "",
    city: "",
    cityLat: null,
    cityLng: null,
    startDate: "",
    endDate: ""
  };
}

export function mapTripToFormData(trip) {
  return {
    title: trip?.title || "",
    countryName: trip?.country || trip?.countryName || "",
    countryCode: trip?.countryCode || "",
    city: trip?.city || "",
    cityLat: trip?.cityLat ?? null,
    cityLng: trip?.cityLng ?? null,
    startDate: trip?.startDate ? String(trip.startDate).slice(0, 10) : "",
    endDate: trip?.endDate ? String(trip.endDate).slice(0, 10) : ""
  };
}

export function validateTripForm(trip) {
  const errors = {
    title: "",
    startDate: "",
    endDate: "",
    country: ""
  };

  const trimmedTitle = trip.title?.trim() || "";

  if (!trimmedTitle) {
    errors.title = "Vyplňte název cesty.";
  } else if (trimmedTitle.length < 3) {
    errors.title = "Název cesty musí mít alespoň 3 znaky.";
  } else if (trimmedTitle.length > 60) {
    errors.title = "Název cesty může mít maximálně 60 znaků.";
  }

  if (!trip.startDate) {
    errors.startDate = "Vyplňte datum odjezdu.";
  } else if (isCompleteDateInput(trip.startDate) && !isValidDateValue(trip.startDate)) {
    errors.startDate = "Datum odjezdu není platné.";
  }

  if (!trip.endDate) {
    errors.endDate = "Vyplňte datum návratu.";
  } else if (isCompleteDateInput(trip.endDate) && !isValidDateValue(trip.endDate)) {
    errors.endDate = "Datum návratu není platné.";
  }

  if (trip.startDate && isCompleteDateInput(trip.startDate) && isValidDateValue(trip.startDate)) {
    const start = new Date(trip.startDate);
    const startYear = start.getFullYear();

    if (startYear < MIN_TRIP_YEAR) {
      errors.startDate = `Datum odjezdu je možné zadat nejdříve v roce ${MIN_TRIP_YEAR}.`;
    } else if (startYear > MAX_TRIP_YEAR) {
      errors.startDate = `Datum odjezdu je možné zadat nejdéle v roce ${MAX_TRIP_YEAR}.`;
    }
  }

  if (trip.endDate && isCompleteDateInput(trip.endDate) && isValidDateValue(trip.endDate)) {
    const end = new Date(trip.endDate);
    const endYear = end.getFullYear();

    if (endYear < MIN_TRIP_YEAR) {
      errors.endDate = `Datum návratu je možné zadat nejdříve v roce ${MIN_TRIP_YEAR}.`;
    } else if (endYear > MAX_TRIP_YEAR) {
      errors.endDate = `Datum návratu je možné zadat nejdéle v roce ${MAX_TRIP_YEAR}.`;
    }
  }

  if (
    trip.startDate &&
    trip.endDate &&
    isCompleteDateInput(trip.startDate) &&
    isCompleteDateInput(trip.endDate) &&
    isValidDateValue(trip.startDate) &&
    isValidDateValue(trip.endDate) &&
    !errors.startDate &&
    !errors.endDate
  ) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (start > end) {
      errors.endDate = "Datum od nemůže být po datu do.";
    } else {
      const durationDays = getTripDurationInDays(start, end);

      if (durationDays > MAX_TRIP_DURATION_DAYS) {
        errors.endDate = `Výlet může trvat maximálně ${MAX_TRIP_DURATION_DAYS} dní.`;
      }
    }
  }

  if (!trip.countryName || !trip.countryCode) {
    errors.country = "Vyber zemi ze seznamu.";
  }

  return errors;
}

export function hasTripFormErrors(errors) {
  return Object.values(errors).some(Boolean);
}