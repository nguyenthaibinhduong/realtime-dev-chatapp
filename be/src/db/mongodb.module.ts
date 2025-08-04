import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService, ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
         const uri = `mongodb://${config.get('MONGO_INITDB_ROOT_USERNAME')}:${config.get('MONGO_INITDB_ROOT_PASSWORD')}@${config.get('DB_HOST')}:${config.get('MONGO_PORT')}/${config.get('MONGO_INITDB_DATABASE')}`;
        // console.log('MongoDB URI:', uri); // Thêm dòng này để xem URI trên console
        return { uri };
      },
      inject: [ConfigService],
    }),
  ],
})
  
export class MongoDBModule {}
