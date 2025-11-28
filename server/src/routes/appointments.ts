import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { AppointmentRequest, ApiResponse, BookingRequest } from '../types';
import {
  calendarId,
  calendarTimeZone,
  hasServiceAccountCredentials,
  getServiceAccountAccessToken,
} from '../googleServiceAccount';
import openingTimes from '../../../shared/openingTimes.json';
import treatmentDefinitions from '../../../shared/treatments.json';

interface TreatmentDefinition {
  name: string;
  time_required_in_minutes: number;
  basic_price_from: string;
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

type Interval = { start: number; end: number };

const defaultTreatmentDurationMinutes = 30;
const MINUTES_PER_DAY = 24 * 60;

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

const getScheduleForDate = (
  date: string,
  weekday: number
): { schedule: DaySchedule; reason?: string } => {
  const override = closureSchedule.get(date);
  if (override) {
    return override;
  }

  return { schedule: weeklySchedule[weekday] ?? null };
};

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}`);
  }
  return hours * 60 + minutes;
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

const fetchCalendarBusyIntervals = async (date: string): Promise<Interval[]> => {
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
      console.error('Google Calendar API error:', response.status, response.statusText, body);
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

const isRangeFree = (start: number, end: number, intervals: Interval[]): boolean =>
  intervals.every((interval) => end <= interval.start || start >= interval.end);

const normalizeTreatmentName = (name?: string): string | undefined => name?.trim();

const getTreatmentDefinition = (name?: string): TreatmentDefinition | undefined => {
  const normalized = normalizeTreatmentName(name);

  if (!normalized) {
    return undefined;
  }

  return (treatmentDefinitions as TreatmentDefinition[]).find(
    (option) => option.name.localeCompare(normalized, undefined, { sensitivity: 'base' }) === 0
  );
};

const appointmentsRouter = Router();

// In-memory store for incoming appointment requests. In a production system,
// you would persist these records in a database such as PostgreSQL or MongoDB
// by replacing this array with data-access functions that insert and query
// records through an ORM or query builder.
export const bookingRequests: BookingRequest[] = [];

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

const formatAppointmentHtml = (payload: BookingRequest): string => {
  const lengthMinutes = payload.treatmentDurationMinutes ?? defaultTreatmentDurationMinutes;
  const price = payload.treatmentPriceFrom ? `${payload.treatmentPriceFrom}-tól` : 'N/A';

  return `
    <h2>Új időpontfoglalás érkezett</h2>
    <p><strong>Név:</strong> ${payload.fullName}</p>
    <p><strong>E-mail:</strong> ${payload.email}</p>
    <p><strong>Telefon:</strong> ${payload.phone}</p>
    <p><strong>Kezelés:</strong> ${payload.treatment ?? 'N/A'}</p>
    <p><strong>Alapár:</strong> ${price}</p>
    <p><strong>Tervezett időtartam:</strong> ${lengthMinutes} perc</p>
    <p><strong>Dátum:</strong> ${payload.date}</p>
    <p><strong>Idő:</strong> ${payload.time}</p>
    <p><strong>Megjegyzés:</strong> ${payload.note ?? 'N/A'}</p>
    <p><strong>Érkezett:</strong> ${payload.receivedAt.toISOString()}</p>
  `;
};

const formatPatientConfirmationHtml = (payload: BookingRequest): string => {
  const lengthMinutes = payload.treatmentDurationMinutes ?? defaultTreatmentDurationMinutes;
  const price = payload.treatmentPriceFrom ? `${payload.treatmentPriceFrom}-tól` : 'véglegesítés alatt';
  return `
    <h2>Köszönjük a foglalási igényét!</h2>
    <p>Kedves ${payload.fullName.split(' ')[0] || 'Páciensünk'},</p>
    <p>Foglalási szándékát rögzítettük. Kollégáink ellenőrzik a választott időpont elérhetőségét, és hamarosan felveszik Önnel a kapcsolatot telefonon vagy e-mailben.</p>
    <ul>
      <li><strong>Dátum:</strong> ${payload.date}</li>
      <li><strong>Időpont:</strong> ${payload.time}</li>
      <li><strong>Kezelés:</strong> ${payload.treatment ?? 'N/A'}</li>
      <li><strong>Alapár:</strong> ${price}</li>
      <li><strong>Tervezett időtartam:</strong> ${lengthMinutes} perc</li>
    </ul>
    <p>Amennyiben a fenti időpont mégsem megfelelő, kérjük jelezze ezt a válaszlevélben.</p>
    <p>Üdvözlettel,<br />Szekeres Dental csapata</p>
  `;
};

const formatDateTime = (
  date: string,
  time: string,
  addMinutes = 0
): { date: string; time: string } => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
    throw new Error('Invalid date or time supplied for calendar event');
  }

  const base = new Date(Date.UTC(year, month - 1, day, hour, minute));
  base.setUTCMinutes(base.getUTCMinutes() + addMinutes);

  const pad = (value: number) => value.toString().padStart(2, '0');

  return {
    date: `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(
      base.getUTCDate()
    )}`,
    time: `${pad(base.getUTCHours())}:${pad(base.getUTCMinutes())}`,
  };
};

const createCalendarEvent = async (booking: BookingRequest): Promise<void> => {
  if (!calendarId) {
    return;
  }

  if (!hasServiceAccountCredentials) {
    console.warn(
      'Google Calendar ID configured but GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is missing; skipping calendar event creation.'
    );
    return;
  }

  const accessToken = await getServiceAccountAccessToken();
  console.log(`Booking data: ${booking}`)
  console.log(`Booking treatmentTime: ${booking.treatmentDurationMinutes}`)
  const { date: endDate, time: endTime } = formatDateTime(
    booking.date,
    booking.time,
    booking.treatmentDurationMinutes ?? defaultTreatmentDurationMinutes
  );

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `Időpontfoglalás: ${booking.fullName}`,
        description:
          [
            booking.note || 'Foglalás a weboldalról (Google szolgáltatási fiók által mentve).',
            booking.treatment ? `Kezelés: ${booking.treatment}` : null,
            booking.treatmentPriceFrom ? `Alapár: ${booking.treatmentPriceFrom}-tól` : null,
            booking.treatmentDurationMinutes
              ? `Tervezett időtartam: ${booking.treatmentDurationMinutes} perc`
              : null,
          ]
            .filter(Boolean)
            .join('\n'),
        attendees: [],
        start: {
          dateTime: `${booking.date}T${booking.time}:00`,
          timeZone: calendarTimeZone,
        },
        end: {
          dateTime: `${endDate}T${endTime}:00`,
          timeZone: calendarTimeZone,
        },
        extendedProperties: {
          private: {
            bookingId: booking.id,
            phone: booking.phone,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create Google Calendar event: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
};

appointmentsRouter.post(
  '/',
  async (
    req: Request<unknown, ApiResponse, AppointmentRequest>,
    res: Response<ApiResponse>
  ) => {
    const { fullName, email, phone, date, time } = req.body;
    const missing = [
      !fullName && 'fullName',
      !email && 'email',
      !phone && 'phone',
      !date && 'date',
      !time && 'time',
    ].filter(Boolean) as string[];

    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    if (!process.env.CONTACT_TO_EMAIL) {
      return res.status(500).json({
        success: false,
        error: 'Email configuration is incomplete',
      });
    }

    const sanitizedTreatment = normalizeTreatmentName(req.body.treatment);
    const matchedTreatment = getTreatmentDefinition(sanitizedTreatment);
    const requestedDuration = Number(req.body.treatmentDurationMinutes);

    const resolvedTreatmentDurationMinutes =
      (!Number.isNaN(requestedDuration) && requestedDuration > 0
        ? requestedDuration
        : matchedTreatment?.time_required_in_minutes ?? defaultTreatmentDurationMinutes);

    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'A megadott dátum formátuma érvénytelen.',
      });
    }

    const { schedule, reason: closedReason } = getScheduleForDate(
      date,
      parsedDate.getUTCDay()
    );

    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: closedReason || 'A rendelő ezen a napon zárva tart.',
      });
    }

    let appointmentStart: number;
    try {
      appointmentStart = parseTimeToMinutes(time);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'A megadott időpont formátuma érvénytelen.',
      });
    }

    const dayOpen = parseTimeToMinutes(schedule.open);
    const dayClose = parseTimeToMinutes(schedule.close);
    const appointmentEnd = appointmentStart + resolvedTreatmentDurationMinutes;

    if (appointmentStart < dayOpen || appointmentEnd > dayClose) {
      return res.status(400).json({
        success: false,
        error:
          'A kiválasztott kezelés nem fér bele a rendelő nyitvatartási idejébe. Kérjük, válasszon korábbi időpontot.',
      });
    }

    const existingBookingIntervals: Interval[] = bookingRequests
      .filter((booking) => booking.date === date)
      .map((booking) => ({
        start: parseTimeToMinutes(booking.time),
        end:
          parseTimeToMinutes(booking.time) +
          (Number(booking.treatmentDurationMinutes) || defaultTreatmentDurationMinutes),
      }))
      .filter((interval) => interval.end > interval.start);

    const calendarBusyIntervals = await fetchCalendarBusyIntervals(date);
    const busyIntervals = existingBookingIntervals.concat(calendarBusyIntervals);

    if (!isRangeFree(appointmentStart, appointmentEnd, busyIntervals)) {
      return res.status(409).json({
        success: false,
        error: 'Ez az időpont ütközik egy másik foglalással. Kérjük, válasszon másik időpontot.',
      });
    }

    const booking: BookingRequest = {
      ...req.body,
      treatment: sanitizedTreatment ?? matchedTreatment?.name,
      treatmentDurationMinutes: resolvedTreatmentDurationMinutes,
      treatmentPriceFrom: matchedTreatment?.basic_price_from ?? req.body.treatmentPriceFrom,
      note: req.body.note ?? (req.body as any).notes,
      id: randomUUID(),
      receivedAt: new Date(),
    };

    bookingRequests.push(booking);

    try {
      await createCalendarEvent(booking);
    } catch (error) {
      console.error('Failed to add booking to Google Calendar', error);
      return res.status(500).json({
        success: false,
        error: 'Hiba történt a naptár frissítésekor. Próbálja meg később.',
      });
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_TO_EMAIL,
        subject: 'Új időpontfoglalás a weboldalról – Szekeres Dental',
        html: formatAppointmentHtml(booking),
      });

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: booking.email,
        subject: 'Időpontfoglalási igényed megérkezett – Szekeres Dental',
        html: formatPatientConfirmationHtml(booking),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to send appointment email', error);
      return res.status(500).json({
        success: false,
        error: 'Unable to send appointment request at this time',
      });
    }
  }
);

export default appointmentsRouter;
