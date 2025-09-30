// index.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const knex = require('./db/knex');

// Muat variabel lingkungan dari .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware untuk memproses body JSON (penting untuk API)
app.use(express.json());

// CORS config (allow credentials for refresh cookie)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use((req, res, next) => {
  knex.raw('select 1')
    .then(() => next())
    .catch((err) => res.status(503).json({ error: 'Database connection failed', details: err.message }));
});

// Cookie parser for refresh tokens
app.use(cookieParser());

// Gunakan routes terpusat
const routes = require('./routes');
app.use('/', routes);

// --- Server Listener ---
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});