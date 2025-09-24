import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './auth/routes/index';

dotenv.config();

const app: Application = express();
const port = process.env.API_PORT || 3000;

// allow Vite app to call this API
app.use(cors({
    origin: process.env.WEB_ORIGIN || 'http://127.0.0.1:5173',
    credentials: true,
}));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Hello from spotify-stats!');
});

// simple health check
const startedAt = Date.now();
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        now: new Date().toISOString(),
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    });
});

// auth router
app.use(cookieParser(process.env.API_SESSION_SECRET)); // needed for verifier cookie

app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port http://127.0.0.1:${port}`);
});
