import express from 'express';

import countries from './routes/countries/index.js';
import { authByToken } from './middlewares/authByToken.js';

const app = express();

app.use(authByToken);

app.use('/api', countries);

export default app;
