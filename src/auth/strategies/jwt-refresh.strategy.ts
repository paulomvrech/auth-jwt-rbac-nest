import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,  // passa o request para o validate, p/ pegar o token cru
    });
  }

  validate(req: Request, payload: JwtPayload) {
    // Pegamos o token cru do header para comparar com o hash do banco depois
    const refreshToken = req.get('authorization')?.replace('Bearer ', '').trim();
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken: refreshToken,
    };
  }
}