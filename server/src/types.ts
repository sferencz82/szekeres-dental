export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  preferredDay?: string;
  preferredTime?: string;
  message: string;
}

export interface AppointmentRequest {
  fullName: string;
  email: string;
  phone: string;
  treatment?: string;
  date: string;
  time: string;
  note?: string;
}

export interface BookingRequest extends AppointmentRequest {
  id: string;
  receivedAt: Date;
}

export type ApiResponse =
  | { success: true }
  | { success: false; error: string };
