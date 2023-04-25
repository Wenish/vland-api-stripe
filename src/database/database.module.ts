import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Money, MoneySchema } from './schemas/money.schema';
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongodb.uri'),
        dbName: configService.get<string>('database.mongodb.name'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
        {
            name: Money.name,
            schema: MoneySchema
        }
    ])
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}