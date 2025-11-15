import { Request, Response, Router } from 'express';
import { ApiResponse } from '../types';
import { bookingRequests } from './appointments';

interface AvailabilityResponse {
  date: string;
  slots: string[];
}

type DaySchedule = { open: string; close: string } | null;

const SLOT_INTERVAL_MINUTES = 30;

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

availabilityRouter.get(
  '/',
  (req: Request, res: Response<AvailabilityResponse | ApiResponse>) => {
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

    const availableSlots = daySlots.filter((slot) => !bookedSet.has(slot));

    return res.json({ date, slots: availableSlots });
  }
);

export default availabilityRouter;
