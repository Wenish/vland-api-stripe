import { Strategy } from 'passport-http-bearer';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import * as admin from 'firebase-admin';

@Injectable()
export class BearerStrategy extends PassportStrategy(Strategy, 'bearer') {
  constructor() {
    super();
  }

  async validate(token: any, done) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      done(null, decodedToken);
    } catch (error) {
      done(new UnauthorizedException(), false);
    }
  }
}

export const BearerGuard = AuthGuard('bearer');