import express from 'express';
import helmet from 'helmet';
import logger from '#config/logger.ts';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.ts';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.get('/', (req, res) => {
  logger.info('Autointell backend is live!');
  res.status(200).send('Autointell backend is live!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Autointell API is running' });
});

app.use('/api/auth', authRoutes);

app.use((_, res) => {
  res.status(404).json({ Error: 'Route not found' });
});

export default app;
