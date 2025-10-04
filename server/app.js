// Main application file
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/error');

// Load env vars FIRST
dotenv.config();

// Import passport AFTER environment variables are loaded
const passport = require('./src/config/passport');

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Session middleware (required for OAuth state)
app.use(session({
  secret: process.env.SESSION_SECRET || 'oauth-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000 // 10 minutes (just for OAuth flow)
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Enable CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie']
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Route files
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});
