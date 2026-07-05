import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRouter);
app.use('/farmer', farmerRouter);
app.use('/listings', listingsRouter);
app.use('/buyer', buyerRouter);
app.use('/rfqs', rfqRouter);
app.use('/deals', dealRouter);

app.get('/', (req, res) => {
  res.json({ message: 'AgriBridge API is running 🚀' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
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