import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from 'src/entities/user.entity';
import { RefreshToken } from 'src/entities/refresh_token.entity';
import { LoginAttempt } from 'src/entities/login_attempts.entity';
// Load biến môi trường từ file .env
dotenv.config();

export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as 'mysql', // Mặc định là MySQL
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  logging: false,
  entities: [User, RefreshToken, LoginAttempt],
  subscribers: [],
});
