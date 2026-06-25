import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database.js';
import authRouter from './auth/auth.router.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import usersRouter from './users/users.router.js';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRouter);
app.use('/users', usersRouter);

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
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });