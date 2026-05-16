import express from 'express';
import usersRouter from './routes/users.js';
import dbTest from './routes/db-test.js';

import authRouter from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';

import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.use('/api/auth', authRouter);

app.use('/api/users', authenticateToken, usersRouter);

app.use('/api/db-test', dbTest);

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});