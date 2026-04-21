# Mini Blog API Learning Notes

Ghi chú này tổng hợp các bài học đã đi qua khi xây Mini Blog API bằng NestJS, PostgreSQL, Prisma, Redis và JWT. Mục tiêu là giúp bạn xem lại "vì sao làm như vậy", không chỉ copy code.

## Bài 1: NestJS Project Basics

### Mục tiêu

- Hiểu app NestJS chạy từ đâu.
- Hiểu 3 khái niệm đầu tiên: Module, Controller, Service.
- Tạo endpoint `GET /health` để kiểm tra app đang sống.

### Luồng xử lý cơ bản

```txt
Client request
-> Controller
-> Service
-> Response
```

### Vai trò các file starter

- `src/main.ts`: điểm khởi động app.
- `src/app.module.ts`: module gốc của ứng dụng.
- `src/app.controller.ts`: nhận HTTP request.
- `src/app.service.ts`: chứa logic đơn giản mà controller gọi.

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

- `imports`: module này cần dùng module khác.
- `controllers`: controller thuộc module này, dùng để nhận request HTTP.
- `providers`: service/class mà NestJS sẽ tạo, quản lý và inject.
- `exports`: provider nào được cho module khác dùng.

### Câu dễ nhớ

```txt
Controller nhận request.
Service xử lý logic.
Module gom controller/service lại và quản lý dependency.
```

## Bài 2: Docker PostgreSQL và Redis

### Mục tiêu

- Chạy PostgreSQL và Redis local bằng Docker Compose.
- Hiểu app backend kết nối tới service bên ngoài qua `.env`.

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

### Các lệnh quan trọng

```bash
docker compose up -d
docker compose ps
docker compose logs postgres
docker compose logs redis
docker compose down
```

### Ý nghĩa `docker compose up -d`

Lệnh này đọc `docker-compose.yml`, tải image nếu cần, tạo container và chạy chúng ở chế độ nền.

Trong project này:

```txt
PostgreSQL: localhost:5432
Redis:      localhost:6379
```

### Lỗi thường gặp

Nếu gặp lỗi:

```txt
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

nghĩa là Docker Desktop/Docker Engine chưa chạy.

## Bài 3: Prisma ORM

### Mục tiêu

- Định nghĩa database schema bằng Prisma.
- Tạo `User` và `Post`.
- Tạo relation: 1 user có nhiều post.
- Chạy migration vào PostgreSQL.

### Cài package

```bash
yarn add @prisma/client
yarn add -D prisma
```

### Khởi tạo Prisma

```bash
yarn prisma init
```

### Prisma 7 lưu ý

Với Prisma 7, `schema.prisma` không còn khai báo:

```prisma
url = env("DATABASE_URL")
```

Datasource chỉ còn:

```prisma
datasource db {
  provider = "postgresql"
}
```

Connection URL nằm trong `prisma.config.ts`:

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

### Schema chính

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

### Chạy migration

```bash
yarn prisma migrate dev --name init
yarn prisma generate
```

### Điều cần nhớ

```txt
schema.prisma
-> migration SQL
-> PostgreSQL tables
-> Prisma Client
-> NestJS services
```

## Bài 4: PrismaService và UsersModule

### Mục tiêu

- Đưa Prisma vào NestJS đúng cách.
- Tạo `PrismaService` dùng chung.
- Tạo `UsersService` để thao tác bảng users.
- Không trả password hash ra API response.

### PrismaModule

```ts
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`exports: [PrismaService]` cho phép module khác import `PrismaModule` và inject `PrismaService`.

### PrismaService với Prisma 7

Với Prisma 7, app runtime cần adapter PostgreSQL:

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

### Vì sao `this.prisma.user` và `this.prisma.post` tồn tại?

`PrismaService extends PrismaClient`, mà `PrismaClient` được generate từ `schema.prisma`.

```txt
model User -> prisma.user
model Post -> prisma.post
```

`@@map("users")` chỉ đổi tên table trong database, không đổi tên property trong code.

## Bài 5: Auth Register/Login với JWT

### Mục tiêu

- Register user.
- Hash password bằng bcrypt.
- Login và trả JWT access token.
- Tạo JWT strategy và guard.

### Package cần có

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

- `whitelist`: loại field lạ.
- `forbidNonWhitelisted`: nếu client gửi field lạ thì báo lỗi.
- `transform`: convert query/body theo DTO khi có thể.

### DTO bắt buộc nên dùng `!`

Với DTO required fields:

```ts
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
```

Dấu `!` nói với TypeScript rằng field này sẽ có giá trị lúc runtime, thông qua request body.

### JWT payload

```ts
const payload = {
  sub: user.id,
  email: user.email,
};
```

`sub` là convention thường dùng để lưu user id.

### JwtStrategy

Strategy đọc token từ header:

```txt
Authorization: Bearer <token>
```

Sau khi verify, Nest/Passport gắn user vào request.

### JwtAuthGuard

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Dùng trên route cần đăng nhập:

```ts
@UseGuards(JwtAuthGuard)
```

## Bài 6: Posts CRUD và Protected Routes

### Mục tiêu

Tạo API:

```txt
POST   /posts
GET    /posts?page=1&limit=10
GET    /posts/:id
PATCH  /posts/:id
DELETE /posts/:id
```

Quyền truy cập:

```txt
GET list/detail: public
POST/PATCH/DELETE: cần JWT
PATCH/DELETE: chỉ author được sửa/xóa
```

### CurrentUser decorator

Dùng để lấy `request.user` sau khi JWT guard verify token:

```ts
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();

    return request.user;
  },
);
```

Nên import type:

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

### Include author nhưng không lộ password

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

Ý nghĩa:

```txt
Lấy post kèm author,
nhưng chỉ lấy id và email của author.
```

### Pagination trong service

```ts
const page = query.page;
const limit = query.limit;
const skip = (page - 1) * limit;
```

Lấy data và đếm tổng số record:

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

### Lỗi get one bị 500

Nếu log có:

```txt
where: { id: undefined }
```

thì route param đang lấy sai.

Đúng:

```ts
@Get(':id')
findOne(@Param('id') id: string) {
  return this.postsService.findOne(id);
}
```

Sai thường gặp:

```ts
@Param('postId')
```

trong khi route là `:id`.

## Bài 7: Redis Cache cho GET /posts

### Mục tiêu

- Cache `GET /posts?page=1&limit=10`.
- TTL = 60 giây.
- Invalidate cache khi create/update/delete post.

### Cài package

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

Phải có `page` và `limit` trong key vì mỗi trang là một response khác nhau.

### Invalidate cache

```ts
private async invalidatePostsCache(): Promise<void> {
  await this.cacheService.delByPattern('posts:list:*');
}
```

Sau khi create/update/delete, gọi:

```ts
await this.invalidatePostsCache();
```

### Luồng cache

```txt
GET /posts
-> tạo cache key
-> check Redis
-> nếu có: return cache
-> nếu không: query DB
-> set Redis TTL 60s
-> return result
```

## Bài 8: BullMQ Queue và Worker

### Mục tiêu

- Hiểu queue dùng để làm việc nền.
- Khi tạo post thành công, đẩy job `send-email` vào queue.
- Worker xử lý job và log:

```txt
Send email for post: {postId}
```

### Vì sao cần queue?

Nếu một request phải làm việc chậm, ví dụ gửi email, tạo PDF, resize image, gọi API bên ngoài, ta không nên bắt client chờ ngay trong request.

Thay vào đó:

```txt
POST /posts
-> tạo post trong database
-> add job vào queue
-> response về client

Worker
-> lấy job từ queue
-> xử lý gửi email ở background
```

### Cài package

```bash
yarn add @nestjs/bullmq bullmq
```

BullMQ dùng Redis làm backend để lưu job.

### Cấu trúc folder

```txt
src/queue/
  queue.module.ts
  posts-queue.producer.ts
  send-email.consumer.ts
```

### Tên queue và job

Nên đặt constant để tránh gõ sai string:

```ts
export const POSTS_QUEUE = 'posts';
export const SEND_EMAIL_JOB = 'send-email';
```

Có thể tạo trong file:

```txt
src/queue/queue.constants.ts
```

### QueueModule

```ts
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PostsQueueProducer } from './posts-queue.producer';
import { SendEmailConsumer } from './send-email.consumer';
import { POSTS_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({
      name: POSTS_QUEUE,
    }),
  ],
  providers: [PostsQueueProducer, SendEmailConsumer],
  exports: [PostsQueueProducer],
})
export class QueueModule {}
```

Ý nghĩa:

- `BullModule.forRoot`: cấu hình kết nối Redis cho BullMQ.
- `BullModule.registerQueue`: đăng ký queue tên `posts`.
- `PostsQueueProducer`: service add job.
- `SendEmailConsumer`: worker xử lý job.
- `exports`: cho module khác inject `PostsQueueProducer`.

### Producer

```ts
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { POSTS_QUEUE, SEND_EMAIL_JOB } from './queue.constants';

type SendEmailJobData = {
  postId: string;
};

@Injectable()
export class PostsQueueProducer {
  constructor(
    @InjectQueue(POSTS_QUEUE)
    private readonly postsQueue: Queue<SendEmailJobData>,
  ) {}

  async addSendEmailJob(postId: string): Promise<void> {
    await this.postsQueue.add(SEND_EMAIL_JOB, {
      postId,
    });
  }
}
```

Producer là người "đẩy việc" vào queue.

### Consumer

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { POSTS_QUEUE, SEND_EMAIL_JOB } from './queue.constants';

type SendEmailJobData = {
  postId: string;
};

@Processor(POSTS_QUEUE)
export class SendEmailConsumer extends WorkerHost {
  private readonly logger = new Logger(SendEmailConsumer.name);

  async process(job: Job<SendEmailJobData>): Promise<void> {
    if (job.name !== SEND_EMAIL_JOB) {
      return;
    }

    this.logger.log(`Send email for post: ${job.data.postId}`);
  }
}
```

Consumer là worker xử lý job ở background.

### Nối QueueModule vào PostsModule

Trong `PostsModule`, thêm:

```ts
imports: [PrismaModule, CacheModule, QueueModule]
```

Sau đó `PostsService` có thể inject:

```ts
constructor(
  private readonly prisma: PrismaService,
  private readonly cacheService: CacheService,
  private readonly postsQueueProducer: PostsQueueProducer,
) {}
```

### Add job khi tạo post

Sau khi tạo post thành công:

```ts
const post = await this.prisma.post.create({
  // ...
});

await this.invalidatePostsCache();
await this.postsQueueProducer.addSendEmailJob(post.id);

return post;
```

Thứ tự nên là:

```txt
1. Tạo post thành công
2. Xóa cache list posts
3. Add background job
4. Return response
```

### Test queue

Cần đảm bảo Redis đang chạy:

```bash
docker compose ps
```

Chạy app:

```bash
yarn start:dev
```

Tạo post:

```http
POST http://localhost:4000/posts
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "Post with queue",
  "content": "This post should trigger a background email job."
}
```

Nếu thành công, terminal NestJS sẽ có log:

```txt
Send email for post: <post-id>
```

### Điều cần nhớ

```txt
Producer add job.
Queue lưu job trong Redis.
Consumer/worker xử lý job.
Request không phải chờ việc nền hoàn thành.
```

### Giải thích lại bằng ví dụ đời thường

Hãy tưởng tượng `POST /posts` là quầy tiếp nhận hồ sơ.

Nếu nhân viên vừa nhận hồ sơ vừa phải gửi email ngay tại quầy, khách phải đứng chờ lâu. Backend cũng vậy: nếu request vừa tạo post vừa gửi email thật, response sẽ chậm và dễ lỗi nếu email service chập chờn.

Queue giải quyết bằng cách tách việc:

```txt
Controller/Service:
  Tôi tạo post xong rồi.
  Tôi ghi một phiếu việc: "send-email cho postId này".
  Tôi trả response cho client trước.

Worker:
  Tôi lấy phiếu việc từ queue.
  Tôi xử lý gửi email ở background.
```

Trong project này, "phiếu việc" là job:

```ts
await this.postsQueue.add(SEND_EMAIL_JOB, {
  postId,
});
```

Redis là nơi giữ danh sách job. BullMQ là thư viện giúp add job, lấy job, retry, quản lý trạng thái job. Consumer là worker nhận job và xử lý.

### Producer, Queue, Consumer là gì?

```txt
Producer = người tạo việc
Queue    = hàng đợi việc
Consumer = người xử lý việc
```

Áp vào code:

```txt
PostsService
-> gọi PostsQueueProducer
-> add job vào BullMQ queue
-> Redis lưu job
-> SendEmailConsumer nhận job
-> log Send email for post: {postId}
```

### Vì sao `process` phải là async?

`WorkerHost` của `@nestjs/bullmq` định nghĩa method `process` phải trả về `Promise`.

Nên consumer cần dạng:

```ts
async process(job: Job<SendEmailJobData>): Promise<void> {
  // xử lý job
}
```

Nhưng ESLint có rule: nếu hàm `async` thì bên trong nên có `await`.

Ở bài học này worker chỉ log, chưa có thao tác async thật, nên có thể tạm dùng:

```ts
await Promise.resolve();
```

Sau này khi gửi email thật, dòng đó sẽ được thay bằng:

```ts
await this.mailService.sendPostCreatedEmail(job.data.postId);
```

## Lệnh hay dùng

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

Nếu PowerShell chặn `yarn.ps1`, có thể build bằng:

```powershell
.\node_modules\.bin\nest.cmd build
```

Chạy dev:

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

## Checklist hiện tại

- [x] NestJS basics
- [x] Docker PostgreSQL và Redis
- [x] Prisma schema và migration
- [x] PrismaService
- [x] UsersService
- [x] Auth register/login/JWT
- [x] Posts CRUD
- [x] Redis cache cho posts
- [ ] BullMQ queue và worker
- [ ] README production-style
