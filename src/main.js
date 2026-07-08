import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ─── Socket.io Setup ───────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// JWT Auth على Socket
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

// Socket Events
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.user.id}`);

  // المستخدم يدخل غرفة الـ Deal
  socket.on('join_deal', (dealId) => {
    socket.join(`deal_${dealId}`);
    console.log(`User ${socket.user.id} joined deal_${dealId}`);
  });

  // المستخدم يدخل غرفة الإشعارات الخاصة فيه
  socket.on('join_notifications', () => {
    socket.join(`user_${socket.user.id}`);
    console.log(`User ${socket.user.id} joined notifications room`);
  });

  // المستخدم يخرج من غرفة الـ Deal
  socket.on('leave_deal', (dealId) => {
    socket.leave(`deal_${dealId}`);
    console.log(`User ${socket.user.id} left deal_${dealId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.user.id}`);
  });
});

// نخلي الـ io متاح للـ controllers
app.set('io', io);

// ─── Middleware ────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ─── Swagger ───────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/farmer', farmerRouter);
app.use('/listings', listingsRouter);
app.use('/buyer', buyerRouter);
app.use('/rfqs', rfqRouter);
app.use('/deals', dealRouter);
app.use('/inspection', inspectionRouter);
app.use('/deals/:id/messages', messageRouter);
app.use('/notifications', notificationRouter);

app.get('/', (req, res) => {
  res.json({ message: 'AgriBridge API is running 🚀' });
});

// ─── Start Server ──────────────────────────────────
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected');
    startCronJobs();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });