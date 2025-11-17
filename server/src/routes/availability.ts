import { Request, Response, Router } from 'express';
import { ApiResponse } from '../types';
import { bookingRequests } from './appointments';

interface AvailabilityResponse {
  date: string;
  slots: string[];
}

type DaySchedule = { open: string; close: string } | null;

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

const calendarId = process.env.GOOGLE_CALENDAR_ID;
const calendarApiKey = process.env.GOOGLE_CALENDAR_API_KEY;
const calendarTimeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || 'Europe/Budapest';

const weeklySchedule: Record<number, DaySchedule> = {
  0: null, // Sunday
  1: { open: '08:30', close: '16:00' },
  2: { open: '08:30', close: '16:00' },
  3: { open: '08:30', close: '16:00' },
  4: { open: '08:30', close: '16:00' },
  5: { open: '08:30', close: '16:00' },
  6: { open: '09:00', close: '13:00' },
};

const availabilityRouter = Router();

const parseTimeToMinutes = (time: string): number => {
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

const fetchCalendarBusySlots = async (
  date: string,
  daySlots: string[]
): Promise<Set<string>> => {
  if (!calendarId || !calendarApiKey || daySlots.length === 0) {
    return new Set();
  }

  const referenceDate = parseDateParts(date);
  const slotMinutePairs = daySlots.map((slot) => ({
    label: slot,
    minutes: parseTimeToMinutes(slot),
  }));

  const timeMin = new Date(`${date}T00:00:00Z`).toISOString();
  const timeMax = new Date(`${date}T23:59:59Z`).toISOString();

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`
  );
  url.searchParams.set('key', calendarApiKey);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('maxResults', '2500');
  url.searchParams.set('timeZone', calendarTimeZone);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      console.error(
        'Google Calendar API error:',
        response.status,
        response.statusText,
        body
      );
      return new Set();
    }

    const data = (await response.json()) as GoogleCalendarEventsResponse;
    const busySlots = new Set<string>();

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

      slotMinutePairs.forEach(({ label, minutes }) => {
        const slotStart = minutes;
        const slotEnd = minutes + SLOT_INTERVAL_MINUTES;
        if (slotStart < clampedEnd && slotEnd > clampedStart) {
          busySlots.add(label);
        }
      });
    });

    return busySlots;
  } catch (error) {
    console.error('Failed to fetch Google Calendar data', error);
    return new Set();
  }
};

availabilityRouter.get(
  '/',
  async (
    req: Request,
    res: Response<AvailabilityResponse | ApiResponse>
  ): Promise<Response<AvailabilityResponse | ApiResponse> | void> => {
    const { date } = req.query;

    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Kérjük, adjon meg egy érvényes dátumot (ÉÉÉÉ-HH-NN).',
      });
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'A megadott dátum formátuma érvénytelen.',
      });
    }

    const weekday = parsedDate.getUTCDay();
    const schedule = weeklySchedule[weekday] ?? null;

    if (!schedule) {
      return res.json({ date, slots: [] });
    }

    const daySlots = generateSlots(schedule.open, schedule.close);
    const existingBookings = bookingRequests
      .filter((booking) => booking.date === date)
      .map((booking) => booking.time);
    const bookedSet = new Set(existingBookings);

    const calendarBusySlots = await fetchCalendarBusySlots(date, daySlots);

    const availableSlots = daySlots.filter(
      (slot) => !bookedSet.has(slot) && !calendarBusySlots.has(slot)
    );

    return res.json({ date, slots: availableSlots });
  }
);

export default availabilityRouter;
