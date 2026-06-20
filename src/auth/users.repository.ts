import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '../generated/prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findbyId(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  updateRefreshToken(id: string, refreshToken: string | null): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { refreshToken } });
  }
}