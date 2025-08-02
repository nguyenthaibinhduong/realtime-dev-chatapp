import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { SearchModule } from './modules/search/search.module';
import { GitHubIntegrationModule } from './modules/github-integration/github-integration.module';
import { PostgresConfig } from './config/database/postgres.config';
import { MongoConfig } from './config/database/mongo.config';
import { AppConfiguration } from './config/app.config';
import { SharedModule } from './shared/shared.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AppConfiguration],
      envFilePath: ['.env.local', '.env'],
    }),

    // PostgreSQL Database
    TypeOrmModule.forRootAsync({
      useClass: PostgresConfig,
    }),

    // MongoDB Database
    MongooseModule.forRootAsync({
      useClass: MongoConfig,
    }),

    // Shared Modules
    SharedModule,
    CommonModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    ChannelsModule,
    MessagesModule,
    SearchModule,
    GitHubIntegrationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
