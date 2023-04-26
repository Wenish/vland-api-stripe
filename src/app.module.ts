import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { DatabaseModule } from './database/database.module';
import { AppService } from './app.service';
import { BearerStrategy } from './guards/bearer.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    DatabaseModule
  ],
  controllers: [AppController],
  providers: [AppService, BearerStrategy],
})
export class AppModule {}
