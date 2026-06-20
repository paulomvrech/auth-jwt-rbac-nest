# 🔐 API de Autenticação e Autorização — NestJS + JWT + RBAC

API REST com cadastro, login, rotas protegidas, **access + refresh tokens** e
**controle de acesso por papéis (RBAC)**. Construída com NestJS, Passport, JWT,
bcrypt e Prisma/PostgreSQL.

## 🔄 Fluxo de autenticação

```
register / login → accessToken (15m) + refreshToken (7d)
       │                         │
       │ Authorization: Bearer <access>      hash do refresh é salvo no banco
       ▼                         
rotas protegidas (JWT) ── expira ──► /refresh (rotaciona o par) ──► /logout (revoga)
```

- O **access token** (curto) é enviado em cada requisição protegida.
- O **refresh token** (longo) renova o access sem precisar relogar.
- O hash do refresh fica no banco, permitindo **revogação** (logout).
- **RBAC**: rotas podem exigir um papel específico (`@Roles(Role.ADMIN)`).

## 🎬 Demonstração — RBAC em ação

![Usuário comum recebe 403 na rota de admin; admin acessa com sucesso](src/assets/AuthTest.gif)

Um usuário autenticado acessa `/auth/me` normalmente, mas recebe **403 Forbidden**
ao tentar uma rota restrita a administradores. Após login com um usuário de papel
ADMIN, a mesma rota retorna **200** — demonstrando o controle de acesso por papéis.

## 🛠️ Tecnologias
- NestJS + TypeScript
- Passport (`passport-jwt`) + `@nestjs/jwt`
- bcrypt (hash de senhas e refresh tokens)
- Prisma ORM (v7) + PostgreSQL
- Docker / Docker Compose

## ✅ Pré-requisitos
- Node.js 20 LTS+
- Docker e Docker Compose

## 🚀 Como rodar

```bash
# 1. Sobe o PostgreSQL
docker compose up -d

# 2. Instala dependências
npm install

# 3. Prisma 7 — dois comandos separados:
npx prisma migrate dev --name init-auth   # cria e aplica a migration (banco)
npx prisma generate                        # gera o client em src/generated/prisma

# 4. Sobe a aplicação
npm run start:dev
```

> **Prisma 7:** sempre que alterar o `prisma/schema.prisma`, rode
> `npx prisma generate` de novo. E importe o `PrismaClient` da pasta gerada
> (`../generated/prisma/client`), não de `@prisma/client`.

## ⚙️ Variáveis de ambiente (`.env`)

```env
DATABASE_URL="postgresql://admin:admin123@localhost:5432/auth?schema=public"
JWT_ACCESS_SECRET="um-segredo-longo-e-aleatorio-de-acesso"
JWT_REFRESH_SECRET="um-segredo-longo-e-aleatorio-de-refresh"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"
```

> Gere segredos fortes com `openssl rand -base64 48`. Nunca commite o `.env`.

## 🧪 Testando o fluxo completo

```bash
# 1. Registrar (retorna accessToken + refreshToken)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@exemplo.com","password":"senha123"}'

# 2. Acessar rota protegida (precisa do access token)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 3. Rota só de ADMIN (usuário comum recebe 403)
curl http://localhost:3000/auth/admin-only \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 4. Renovar tokens (quando o access expira)
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer <REFRESH_TOKEN>"

# 5. Logout (invalida o refresh token)
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Para testar o RBAC, promova um usuário a `ADMIN` (via `npx prisma studio` ou SQL),
**relogue** para gerar um token com o novo papel, e acesse `/auth/admin-only`.

## 📋 Endpoints

| Método | Rota                | Proteção          | Descrição                          |
|--------|---------------------|-------------------|------------------------------------|
| POST   | `/auth/register`    | pública           | Cadastra usuário e retorna tokens  |
| POST   | `/auth/login`       | pública           | Autentica e retorna tokens         |
| POST   | `/auth/refresh`     | refresh token     | Renova o par de tokens (rotação)   |
| POST   | `/auth/logout`      | access token      | Revoga o refresh token             |
| GET    | `/auth/me`          | access token      | Dados do usuário autenticado       |
| GET    | `/auth/admin-only`  | access + ADMIN    | Exemplo de rota protegida por papel|

## 📌 Versões testadas
- Prisma 7.8 · Node 20 · PostgreSQL 16

## 📚 Conceitos demonstrados
- Autenticação (JWT) vs. Autorização (RBAC)
- Hashing de senha com bcrypt (salt + cost factor)
- Access + refresh tokens com rotação e revogação
- Estratégias e guards do Passport no NestJS
- RBAC com `@Roles` + `RolesGuard` + `Reflector`
- Boas práticas de segurança (erros genéricos, segredos fora do código, etc.)

## ⚠️ Segurança
Projeto de estudo. Para produção, considere: validação de entrada
(`class-validator`), rate limiting no login, HTTPS obrigatório, e a escolha
consciente entre armazenar o token em `localStorage` (risco de XSS) ou cookie
`httpOnly` (risco de CSRF).