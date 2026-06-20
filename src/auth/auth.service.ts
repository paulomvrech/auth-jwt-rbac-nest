import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { User } from '../generated/prisma/client';

// O formato dos dados que vao dentro do JWT
export interface JwtPayload {
  sub: string; // ID do usuario(subject)
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
  }

  // ------------- REGISTRO ---------------
  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email ja cadastrado!');
    }

    // Faz o hash da senha antes de salvar
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await this.users.create({
      email: email,
      password: hashPassword,
    });

    return this.issueTokensAndPersist(user);
  }

  // ------------- LOGIN ---------------
  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    // Mesmo erro para "não existe" e "senha errada"
    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas!');
    }

    const passwordVerify = await bcrypt.compare(password, user.password);
    if (!passwordVerify) {
      throw new UnauthorizedException('Credenciais invalidas!');
    }

    return this.issueTokensAndPersist(user);
  }

  // ------------- REFRESH ---------------
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.users.findbyId(userId);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Acesso negado');
    }

    // Compara o refresh recebido com o hash guardado
    const hashVerify = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!hashVerify) {
      throw new ForbiddenException('Acesso negado');
    }

    // Rotação: emite um novo par e substitui o hash guardado.
    return this.issueTokensAndPersist(user);
  }

  // ------------- LOGOUT ---------------
  async logout(userId: string) {
    // Apaga o hash do refresh -> o refresh token atual deixa de funcionar
    await this.users.updateRefreshToken(userId, null);
    return { message: 'Logout efetuado.' };
  }

  // ---------- helpers privados ----------
  private async issueTokensAndPersist(user: User) {
    const tokens = await this.generateTokens(user);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.users.updateRefreshToken(user.id, refreshHash);
    return tokens;
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES') as StringValue,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES') as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

}
