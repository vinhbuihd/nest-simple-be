# Mini Blog API Learning Notes

Ghi chu nay tong hop cac bai hoc da di qua khi xay Mini Blog API bang NestJS, PostgreSQL, Prisma, Redis va JWT. Muc tieu la giup ban xem lai "vi sao lam nhu vay", khong chi copy code.

## Bai 1: NestJS Project Basics

### Muc tieu

- Hieu app NestJS chay tu dau.
- Hieu 3 khai niem dau tien: Module, Controller, Service.
- Tao endpoint `GET /health` de kiem tra app dang song.

### Luong xu ly co ban

```txt
Client request
-> Controller
-> Service
-> Response
```

### Vai tro cac file starter

- `src/main.ts`: diem khoi dong app.
- `src/app.module.ts`: module goc cua ung dung.
- `src/app.controller.ts`: nhan HTTP request.
- `src/app.service.ts`: chua logic don gian ma controller goi.

### Module trong NestJS

```ts
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class SomeModule {}
```

- `imports`: module nay can dung module khac.
- `controllers`: controller thuoc module nay, dung de nhan request HTTP.
- `providers`: service/class ma NestJS se tao, quan ly va inject.
- `exports`: provider nao duoc cho module khac dung.

### Cau de nho

```txt
Controller nhan request.
Service xu ly logic.
Module gom controller/service lai va quan ly dependency.
```

## Bai 2: Docker PostgreSQL va Redis

### Muc tieu

- Chay PostgreSQL va Redis local bang Docker Compose.
- Hieu app backend ket noi toi service ben ngoai qua `.env`.

### File `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: mini_blog_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: mini_blog
      POSTGRES_PASSWORD: mini_blog_password
      POSTGRES_DB: mini_blog_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: mini_blog_redis
    restart: unless-stopped
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

### Cac lenh quan trong

```bash
docker compose up -d
docker compose ps
docker compose logs postgres
docker compose logs redis
docker compose down
```

### Y nghia `docker compose up -d`

Lenh nay doc `docker-compose.yml`, tai image neu can, tao container va chay chung o che do nen.

Trong project nay:

```txt
PostgreSQL: localhost:5432
Redis:      localhost:6379
```

### Loi thuong gap

Neu gap loi:

```txt
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

nghia la Docker Desktop/Docker Engine chua chay.

## Bai 3: Prisma ORM

### Muc tieu

- Dinh nghia database schema bang Prisma.
- Tao `User` va `Post`.
- Tao relation: 1 user co nhieu post.
- Chay migration vao PostgreSQL.

### Cai package

```bash
yarn add @prisma/client
yarn add -D prisma
```

### Khoi tao Prisma

```bash
yarn prisma init
```

### Prisma 7 luu y

Voi Prisma 7, `schema.prisma` khong con khai bao:

```prisma
url = env("DATABASE_URL")
```

Datasource chi con:

```prisma
datasource db {
  provider = "postgresql"
}
```

Connection URL nam trong `prisma.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

### Schema chinh

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@map("posts")
}
```

### Chay migration

```bash
yarn prisma migrate dev --name init
yarn prisma generate
```

### Dieu can nho

```txt
schema.prisma
-> migration SQL
-> PostgreSQL tables
-> Prisma Client
-> NestJS services
```

## Bai 4: PrismaService va UsersModule

### Muc tieu

- Dua Prisma vao NestJS dung cach.
- Tao `PrismaService` dung chung.
- Tao `UsersService` de thao tac bang users.
- Khong tra password hash ra API response.

### PrismaModule

```ts
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`exports: [PrismaService]` cho phep module khac import `PrismaModule` va inject `PrismaService`.

### PrismaService voi Prisma 7

Voi Prisma 7, app runtime can adapter PostgreSQL:

```bash
yarn add @prisma/adapter-pg pg
yarn add -D @types/pg
```

```ts
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Vi sao `this.prisma.user` va `this.prisma.post` ton tai?

`PrismaService extends PrismaClient`, ma `PrismaClient` duoc generate tu `schema.prisma`.

```txt
model User -> prisma.user
model Post -> prisma.post
```

`@@map("users")` chi doi ten table trong database, khong doi ten property trong code.

## Bai 5: Auth Register/Login voi JWT

### Muc tieu

- Register user.
- Hash password bang bcrypt.
- Login va tra JWT access token.
- Tao JWT strategy va guard.

### Package can co

```bash
yarn add @nestjs/config
yarn add @nestjs/jwt
yarn add @nestjs/passport passport passport-jwt
yarn add bcrypt
yarn add class-validator class-transformer
yarn add -D @types/passport-jwt @types/bcrypt
```

### ValidationPipe

Trong `main.ts`:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
);
```

- `whitelist`: loai field la.
- `forbidNonWhitelisted`: neu client gui field la thi bao loi.
- `transform`: convert query/body theo DTO khi co the.

### DTO bat buoc nen dung `!`

Voi DTO required fields:

```ts
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
```

Dau `!` noi voi TypeScript rang field nay se co gia tri luc runtime, thong qua request body.

### JWT payload

```ts
const payload = {
  sub: user.id,
  email: user.email,
};
```

`sub` la convention thuong dung de luu user id.

### JwtStrategy

Strategy doc token tu header:

```txt
Authorization: Bearer <token>
```

Sau khi verify, Nest/Passport gan user vao request.

### JwtAuthGuard

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Dung tren route can dang nhap:

```ts
@UseGuards(JwtAuthGuard)
```

## Bai 6: Posts CRUD va Protected Routes

### Muc tieu

Tao API:

```txt
POST   /posts
GET    /posts?page=1&limit=10
GET    /posts/:id
PATCH  /posts/:id
DELETE /posts/:id
```

Quyen truy cap:

```txt
GET list/detail: public
POST/PATCH/DELETE: can JWT
PATCH/DELETE: chi author duoc sua/xoa
```

### CurrentUser decorator

Dung de lay `request.user` sau khi JWT guard verify token:

```ts
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();

    return request.user;
  },
);
```

Nen import type:

```ts
import type { AuthUser } from '../../auth/strategies/jwt.strategy';
```

### DTO pagination

```ts
export class ListPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
```

### Include author nhung khong lo password

```ts
include: {
  author: {
    select: {
      id: true,
      email: true,
    },
  },
}
```

Y nghia:

```txt
Lay post kem author,
nhung chi lay id va email cua author.
```

### Pagination trong service

```ts
const page = query.page;
const limit = query.limit;
const skip = (page - 1) * limit;
```

Lay data va dem tong so record:

```ts
const [items, total] = await this.prisma.$transaction([
  this.prisma.post.findMany({ skip, take: limit }),
  this.prisma.post.count(),
]);
```

Response:

```ts
return {
  items,
  meta: {
    total,
    page,
    limit,
  },
};
```

### Loi get one bi 500

Neu log co:

```txt
where: { id: undefined }
```

thi route param dang lay sai.

Dung:

```ts
@Get(':id')
findOne(@Param('id') id: string) {
  return this.postsService.findOne(id);
}
```

Sai thuong gap:

```ts
@Param('postId')
```

trong khi route la `:id`.

## Bai 7: Redis Cache cho GET /posts

### Muc tieu

- Cache `GET /posts?page=1&limit=10`.
- TTL = 60 giay.
- Invalidate cache khi create/update/delete post.

### Cai package

```bash
yarn add ioredis
```

### CacheService

```ts
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);

    if (keys.length === 0) {
      return;
    }

    await this.redis.del(...keys);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
```

### Cache key

```ts
private getPostsCacheKey(page: number, limit: number): string {
  return `posts:list:page=${page}:limit=${limit}`;
}
```

Phai co `page` va `limit` trong key vi moi trang la mot response khac nhau.

### Invalidate cache

```ts
private async invalidatePostsCache(): Promise<void> {
  await this.cacheService.delByPattern('posts:list:*');
}
```

Sau khi create/update/delete, goi:

```ts
await this.invalidatePostsCache();
```

### Luong cache

```txt
GET /posts
-> tao cache key
-> check Redis
-> neu co: return cache
-> neu khong: query DB
-> set Redis TTL 60s
-> return result
```

## Lenh hay dung

### Docker

```bash
docker compose up -d
docker compose ps
docker compose down
```

### Prisma

```bash
yarn prisma migrate dev --name init
yarn prisma generate
yarn prisma studio
```

### NestJS

Neu PowerShell chan `yarn.ps1`, co the build bang:

```powershell
.\node_modules\.bin\nest.cmd build
```

Chay dev:

```bash
yarn start:dev
```

### API test

Register:

```http
POST http://localhost:4000/auth/register
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "123456"
}
```

Login:

```http
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "123456"
}
```

Create post:

```http
POST http://localhost:4000/posts
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "My first post",
  "content": "This is my first blog post content."
}
```

Get posts:

```http
GET http://localhost:4000/posts?page=1&limit=10
```

## Checklist hien tai

- [x] NestJS basics
- [x] Docker PostgreSQL va Redis
- [x] Prisma schema va migration
- [x] PrismaService
- [x] UsersService
- [x] Auth register/login/JWT
- [x] Posts CRUD
- [ ] Redis cache cho posts
- [ ] BullMQ queue va worker
- [ ] README production-style
