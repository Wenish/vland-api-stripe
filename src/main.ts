import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { json } from 'body-parser';
import * as cloneBuffer from 'clone-buffer'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  // Firebase
  const adminConfig: admin.ServiceAccount = {
    projectId: configService.get('firebase.projectId'),
    privateKey: configService.get('firebase.privateKey').replace(/\\n/g, '\n'),
    clientEmail: configService.get('firebase.clientEmail'),
  };
  admin.initializeApp({
    credential: admin.credential.cert(adminConfig),
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('V-Land Api Stripe')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'Bearer Authentication',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Cors
  app.enableCors();

  // Stripe Webhook
  app.use(json({
    verify: (req: any, res, buf, encoding) => {
      // important to store rawBody for Stripe signature verification
      if (req.headers['stripe-signature'] && Buffer.isBuffer(buf)) {
        req.rawBody = cloneBuffer(buf);
      }
      return true;
    },
  }));
  
  // Validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }));

  const port = configService.get<number>('port');
  await app.listen(port);
}
bootstrap();
