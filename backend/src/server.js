import 'dotenv/config';
import app from './app.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.info(`Teen Expense Tracker API listening on port ${port}`));