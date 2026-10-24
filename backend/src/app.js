const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/env');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const authRoutes = require('./modules/auth/auth.routes');
const lawyerRoutes = require('./modules/lawyer/lawyer.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const directoryRoutes = require('./modules/directory/directory.routes');
const bookingRoutes = require('./modules/booking/booking.routes');
const enquiryRoutes = require('./modules/enquiry/enquiry.routes');
const matchingRoutes = require('./modules/matching/matching.routes');
const engagementRoutes = require('./modules/engagement/engagement.routes');
const { healthCheck } = require('./modules/auth/auth.controller');

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS - restrict strictly to allowed FRONTEND_URLS
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser agents (Supertest, curl, server-to-server) without Origin header
    if (!origin) return callback(null, true);
    if (config.frontendUrls.includes(origin)) {
      return callback(null, true);
    }
    return callback(new AppError('CORS error: Request origin is not permitted', 403));
  },
  credentials: true
};
app.use(cors(corsOptions));

// 3. HTTP Request Logging (suppressed in test environment)
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// 4. Request Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Base & Health Endpoints under /api/v1
app.get('/api/v1/health', healthCheck);

// 6. Modular API Routes under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/lawyer', lawyerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/lawyers', directoryRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/enquiries', enquiryRoutes);
app.use('/api/v1/match', matchingRoutes);
app.use('/api/v1/engagements', engagementRoutes);

// 7. Catch-all for unhandled routes
app.use(notFound);

// 8. Global Central Error Handler
app.use(errorHandler);

module.exports = app;
