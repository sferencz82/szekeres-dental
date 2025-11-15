import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRouter from './routes/contact';
import appointmentsRouter from './routes/appointments';
import availabilityRouter from './routes/availability';
import { ApiResponse } from './types';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.use('/api/contact', contactRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/availability', availabilityRouter);

app.use(
  (
    err: Error,
    _req: Request,
    res: Response<ApiResponse>,
    _next: NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  console.log(`Szekeres Dental API listening on port ${PORT}`);
});
