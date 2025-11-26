import { Request, Response, Router } from 'express';
import { ApiResponse } from '../types';
import { bookingRequests } from './appointments';
import {
  calendarId,
  calendarTimeZone,
  hasServiceAccountCredentials,
  getServiceAccountAccessToken,
} from '../googleServiceAccount';
import openingTimes from '../../../shared/openingTimes.json';
import treatmentDefinitions from '../../../shared/treatments.json';

interface AvailabilitySlot {
  start: string;
  end: string;
}

interface AvailabilityResponse {
  date: string;
  slots: AvailabilitySlot[];
  closedReason?: string;
}

interface BookableDatesResponse {
  dates: string[];
}

type DaySchedule = { open: string; close: string } | null;

interface OpeningTimesConfig {
  weekly: Partial<Record<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    DaySchedule
  >>;
  closures?: { date: string; reason?: string; schedule?: DaySchedule }[];
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface DateTimeParts extends DateParts {
  hour: number;
  minute: number;
}

interface GoogleCalendarEventDate {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

interface GoogleCalendarEvent {
  start?: GoogleCalendarEventDate;
  end?: GoogleCalendarEventDate;
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEvent[];
}

const SLOT_INTERVAL_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_DURATION_MINUTES = 30;

const dayKeyToIndex: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const openingTimesConfig = openingTimes as OpeningTimesConfig;

const weeklySchedule: Record<number, DaySchedule> = Object.entries(
  openingTimesConfig.weekly || {}
).reduce((acc, [key, value]) => {
  const weekdayIndex = dayKeyToIndex[key.toLowerCase()];
  if (weekdayIndex !== undefined) {
    acc[weekdayIndex] = value ?? null;
  }
  return acc;
}, {} as Record<number, DaySchedule>);

const closureSchedule = new Map<string, { schedule: DaySchedule; reason?: string }>(
  (openingTimesConfig.closures || []).map((closure) => [
    closure.date,
    { schedule: closure.schedule ?? null, reason: closure.reason },
  ])
);

const availabilityRouter = Router();

const normalizeTreatmentName = (name?: string): string | undefined => name?.trim();

const getTreatmentDefinition = (name?: string) => {
  const normalized = normalizeTreatmentName(name);
  if (!normalized) {
    return undefined;
  }

  return (treatmentDefinitions as { name: string; time_required_in_minutes: number }[]).find(
    (definition) =>
      definition.name.localeCompare(normalized, undefined, { sensitivity: 'base' }) === 0
  );
};

export const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}`);
  }
  return hours * 60 + minutes;
};

const formatMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const generateSlots = (open: string, close: string): string[] => {
  const startMinutes = parseTimeToMinutes(open);
  const endMinutes = parseTimeToMinutes(close);

  if (startMinutes >= endMinutes) {
    return [];
  }

  const slots: string[] = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += SLOT_INTERVAL_MINUTES) {
    slots.push(formatMinutes(minutes));
  }

  return slots;
};

export const getScheduleForDate = (
  date: string,
  weekday: number
): { schedule: DaySchedule; reason?: string } => {
  const override = closureSchedule.get(date);
  if (override) {
    return override;
  }

  return { schedule: weeklySchedule[weekday] ?? null };
};

type Interval = { start: number; end: number };

const parseDateParts = (value: string): DateParts => {
  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid date format: ${value}`);
  }
  return { year, month, day };
};

const datePartsToUtc = (parts: DateParts): number =>
  Date.UTC(parts.year, parts.month - 1, parts.day);

const differenceInDays = (a: DateParts, b: DateParts): number => {
  const diff = datePartsToUtc(a) - datePartsToUtc(b);
  return Math.round(diff / (24 * 60 * 60 * 1000));
};

const parseDateOnly = (value: string): DateParts => {
  const parts = parseDateParts(value);
  if (Number.isNaN(Date.UTC(parts.year, parts.month - 1, parts.day))) {
    throw new Error(`Invalid date format: ${value}`);
  }
  return parts;
};

const formatDateParts = (parts: DateParts): string =>
  `${parts.year}-${parts.month.toString().padStart(2, '0')}-${parts.day
    .toString()
    .padStart(2, '0')}`;

const getZonedDateTimeParts = (date: Date, timeZone: string): DateTimeParts => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  };
};

const minutesRelativeToDay = (
  value: GoogleCalendarEventDate | undefined,
  referenceDate: DateParts
): number | null => {
  if (!value) {
    return null;
  }

  if (value.date) {
    const parts = parseDateParts(value.date);
    const dayOffset = differenceInDays(parts, referenceDate);
    return dayOffset * MINUTES_PER_DAY;
  }

  if (value.dateTime) {
    const zonedParts = getZonedDateTimeParts(
      new Date(value.dateTime),
      value.timeZone || calendarTimeZone
    );
    const dayOffset = differenceInDays(zonedParts, referenceDate);
    return dayOffset * MINUTES_PER_DAY + zonedParts.hour * 60 + zonedParts.minute;
  }

  return null;
};

const parseRequestedDuration = (
  durationMinutes: unknown,
  treatmentName?: unknown
): number => {
  const treatmentDefinition =
    typeof treatmentName === 'string' ? getTreatmentDefinition(treatmentName) : undefined;

  if (treatmentDefinition?.time_required_in_minutes) {
    return treatmentDefinition.time_required_in_minutes;
  }

  const parsedDuration = Number(durationMinutes);
  if (!Number.isNaN(parsedDuration) && parsedDuration > 0) {
    return parsedDuration;
  }

  return DEFAULT_DURATION_MINUTES;
};

export const fetchCalendarBusyIntervals = async (date: string): Promise<Interval[]> => {
  if (!calendarId) {
    return [];
  }

  if (!hasServiceAccountCredentials) {
    return [];
  }

  let accessToken: string;
  try {
    accessToken = await getServiceAccountAccessToken();
  } catch (error) {
    console.error('Unable to authorize Google Calendar request', error);
    return [];
  }

  const referenceDate = parseDateParts(date);

  const timeMin = new Date(`${date}T00:00:00Z`).toISOString();
  const timeMax = new Date(`${date}T23:59:59Z`).toISOString();

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`
  );
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('maxResults', '2500');
  url.searchParams.set('timeZone', calendarTimeZone);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(
        'Google Calendar API error:',
        response.status,
        response.statusText,
        body
      );
      return [];
    }

    const data = (await response.json()) as GoogleCalendarEventsResponse;
    const busyIntervals: Interval[] = [];

    data.items?.forEach((event) => {
      const startMinutes = minutesRelativeToDay(event.start, referenceDate);
      const endMinutes = minutesRelativeToDay(event.end, referenceDate);

      if (startMinutes === null || endMinutes === null) {
        return;
      }

      const clampedStart = Math.max(0, Math.floor(startMinutes));
      const clampedEnd = Math.min(MINUTES_PER_DAY, Math.ceil(endMinutes));

      if (clampedStart >= clampedEnd) {
        return;
      }

      busyIntervals.push({ start: clampedStart, end: clampedEnd });
    });

    return busyIntervals;
  } catch (error) {
    console.error('Failed to fetch Google Calendar data', error);
    return [];
  }
};

export const isRangeFree = (start: number, end: number, intervals: Interval[]): boolean =>
  intervals.every((interval) => end <= interval.start || start >= interval.end);

const getDayAvailability = async (
  date: string,
  requestedDuration: number
): Promise<AvailabilityResponse> => {
  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date value');
  }

  const weekday = parsedDate.getUTCDay();
  const { schedule, reason: closedReason } = getScheduleForDate(date, weekday);

  if (!schedule) {
    return {
      date,
      slots: [],
      closedReason: closedReason || 'A rendelő ezen a napon zárva tart.',
    };
  }

  const daySlots = generateSlots(schedule.open, schedule.close);
  const startMinutes = parseTimeToMinutes(schedule.open);
  const endMinutes = parseTimeToMinutes(schedule.close);

  const existingBookingIntervals: Interval[] = bookingRequests
    .filter((booking) => booking.date === date)
    .map((booking) => ({
      start: parseTimeToMinutes(booking.time),
      end:
        parseTimeToMinutes(booking.time) +
        (Number(booking.treatmentDurationMinutes) || DEFAULT_DURATION_MINUTES),
    }))
    .filter((interval) => interval.end > interval.start);

  const calendarBusyIntervals = await fetchCalendarBusyIntervals(date);
  const busyIntervals = existingBookingIntervals.concat(calendarBusyIntervals);

  const availableSlots = daySlots
    .map((slot) => parseTimeToMinutes(slot))
    .filter((slotStart) => slotStart + requestedDuration <= endMinutes)
    .filter((slotStart) => slotStart >= startMinutes)
    .filter((slotStart) => isRangeFree(slotStart, slotStart + requestedDuration, busyIntervals))
    .map((slotStart) => ({
      start: formatMinutes(slotStart),
      end: formatMinutes(slotStart + requestedDuration),
    }));

  return { date, slots: availableSlots, closedReason };
};

availabilityRouter.get(
  '/',
  async (
    req: Request,
    res: Response<AvailabilityResponse | ApiResponse>
  ): Promise<Response<AvailabilityResponse | ApiResponse> | void> => {
    const { date, durationMinutes, treatment } = req.query;

    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Kérjük, adjon meg egy érvényes dátumot (ÉÉÉÉ-HH-NN).',
      });
    }

    const requestedDuration = parseRequestedDuration(durationMinutes, treatment);
    if (requestedDuration <= 0) {
      return res.status(400).json({
        success: false,
        error: 'A kezelés időtartama nem lehet 0 percnél rövidebb.',
      });
    }

    try {
      const availability = await getDayAvailability(date, requestedDuration);
      return res.json(availability);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'A megadott dátum formátuma érvénytelen.',
      });
    }
  }
);

availabilityRouter.get(
  '/dates',
  async (
    req: Request,
    res: Response<BookableDatesResponse | ApiResponse>
  ): Promise<Response<BookableDatesResponse | ApiResponse> | void> => {
    const { durationMinutes, treatment, startDate, daysAhead } = req.query;

    const requestedDuration = parseRequestedDuration(durationMinutes, treatment);
    if (requestedDuration <= 0) {
      return res.status(400).json({
        success: false,
        error: 'A kezelés időtartama nem lehet 0 percnél rövidebb.',
      });
    }

    const totalDaysToCheck = Math.min(Math.max(Number(daysAhead) || 90, 1), 365);

    let startDateParts: DateParts;
    try {
      startDateParts =
        typeof startDate === 'string' && startDate
          ? parseDateOnly(startDate)
          : getZonedDateTimeParts(new Date(), calendarTimeZone);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Kérjük, adjon meg egy érvényes kezdődátumot (ÉÉÉÉ-HH-NN).',
      });
    }

    const availableDates: string[] = [];

    for (let offset = 0; offset < totalDaysToCheck; offset += 1) {
      const currentDate = new Date(Date.UTC(startDateParts.year, startDateParts.month - 1, startDateParts.day));
      currentDate.setUTCDate(currentDate.getUTCDate() + offset);

      const dateString = formatDateParts(
        getZonedDateTimeParts(currentDate, calendarTimeZone)
      );

      const availability = await getDayAvailability(dateString, requestedDuration);
      if (availability.slots.length > 0) {
        availableDates.push(dateString);
      }
    }

    return res.json({ dates: availableDates });
  }
);

export default availabilityRouter;
