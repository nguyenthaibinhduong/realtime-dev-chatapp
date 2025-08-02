import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { User } from './entities/user.entity';
import { DataSource } from 'typeorm';
import { AppDataSource } from './db/data-source';
import { AuthModule } from './modules/auth/auth.module';
import { PostgresModule } from './db/postgres.module';
import { MongoDBModule } from './db/mongodb.module';
import { RedisModule } from './db/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Làm cho config có sẵn toàn bộ ứng dụng
      envFilePath: '.env', // Đường dẫn đến tệp .env
    }),
    //Postgres
    // TypeOrmModule.forRoot(AppDataSource.options),
    PostgresModule,
    MongoDBModule,
    RedisModule,

    TypeOrmModule.forFeature([User]),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    if (this.dataSource.isInitialized) {
      console.log('Kết nối cơ sở dữ liệu thành công!'); // Thông báo khi kết nối thành công
    } else {
      console.error('Không thể kết nối tới cơ sở dữ liệu!');
    }
  }
}
