import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHello(): string {
    return '<h1>vland api stripe</h1><p>running...</p><p><a href="/api">Swagger Docs</a>';
  }
}
