import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersRepository } from './users.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PassportModule,
    // Registro vazio: passamos secret/expiresIn em cada signAsync no service
    JwtModule.register({}),
  ],
  providers: [AuthService, UsersRepository, JwtStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
})
export class AuthModule {
}
