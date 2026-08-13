import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AppDataSource } from './config/database.js';
import authRouter from './auth/auth.router.js';
import farmerRouter from './farmer/farmer.router.js';
import listingsRouter from './listings/listing.router.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { startCronJobs } from './config/cron.js';
import buyerRouter from './buyer/buyer.router.js';
import rfqRouter from './rfq/rfq.router.js';
import dealRouter from './deals/deal.router.js';
import inspectionRouter from './inspection/inspection.router.js';
import messageRouter from './messages/message.router.js';
import notificationRouter from './notifications/notification.router.js';
import reviewRouter from './reviews/review.router.js';
import disputeRouter from './disputes/dispute.router.js';
import qoRouter from './QO/QO.router.js'; // ✅ إضافة
import adminRouter from './admin/admin.router.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.user.id}`);

  socket.on('join_deal', (dealId) => {
    socket.join(`deal_${dealId}`);
    console.log(`User ${socket.user.id} joined deal_${dealId}`);
  });

  socket.on('join_notifications', () => {
    socket.join(`user_${socket.user.id}`);
    console.log(`User ${socket.user.id} joined notifications room`);
  });

  socket.on('leave_deal', (dealId) => {
    socket.leave(`deal_${dealId}`);
    console.log(`User ${socket.user.id} left deal_${dealId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.user.id}`);
  });
});

app.set('io', io);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ============================================================
// SWAGGER DOCUMENTATION
// ============================================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================================
// ROUTES
// ============================================================
app.use('/auth', authRouter);
app.use('/farmer', farmerRouter);
app.use('/listings', listingsRouter);
app.use('/buyer', buyerRouter);
app.use('/rfqs', rfqRouter);
app.use('/deals', dealRouter);
app.use('/inspection', inspectionRouter);
app.use('/deals/:id/messages', messageRouter);
app.use('/notifications', notificationRouter);
app.use('/reviews', reviewRouter);
app.use('/disputes', disputeRouter);
app.use('/qo', qoRouter); // ← ناقص // ✅ إضافة Route النزاعات
app.use('/admin', adminRouter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'AgriBridge API is running 🚀',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      farmers: '/farmer',
      listings: '/listings',
      buyers: '/buyer',
      rfqs: '/rfqs',
      deals: '/deals',
      inspection: '/inspection',
      messages: '/deals/:id/messages',
      notifications: '/notifications',
      reviews: '/reviews',
      disputes: '/disputes',
       qo: '/qo', // ← ضيف هاد
      admin: '/admin',
      docs: '/api-docs',
    }
  });
});

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger docs available at: http://localhost:${PORT}/api-docs`);
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected');
    startCronJobs();
    console.log('⏰ Cron jobs started');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });