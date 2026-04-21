# Mini Blog API Learning Notes

## Menu học tập

| Bài | Nội dung | Trạng thái |
| --- | --- | --- |
| [Bài 1](#bai-1) | NestJS Project Basics | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 2](#bai-2) | Docker PostgreSQL và Redis | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 3](#bai-3) | Prisma ORM | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 4](#bai-4) | PrismaService và UsersModule | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 5](#bai-5) | Auth Register/Login với JWT | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 6](#bai-6) | Posts CRUD và Protected Routes | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 7](#bai-7) | Redis Cache cho GET /posts | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 8](#bai-8) | BullMQ Queue và Worker | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 9](#bai-9) | Environment Config và App Configuration | <span style="color: #15803d; font-weight: 600;">Đã học</span> |
| [Bài 10](#bai-10) | Error Handling và Response Shape | Chưa học |
| [Bài 11](#bai-11) | API Testing bằng Postman hoặc cURL | Chưa học |
| [Bài 12](#bai-12) | README Production-Style | Chưa học |
| [Bài 13](#bai-13) | Refactor nhẹ cho sạch code | Chưa học |
| [Bài 14](#bai-14) | Basic Automated Tests | Chưa học |
| [Bài 15](#bai-15) | Database Seeding | Chưa học |
| [Bài 16](#bai-16) | Pagination nâng cao và Query Options | Chưa học |
| [Bài 17](#bai-17) | Cache nâng cao | Chưa học |
| [Bài 18](#bai-18) | Queue nâng cao | Chưa học |
| [Bài 19](#bai-19) | Security cơ bản | Chưa học |
| [Bài 20](#bai-20) | Production Thinking | Chưa học |

Ghi chú này tổng hợp các bài học đã đi qua khi xây Mini Blog API bằng NestJS, PostgreSQL, Prisma, Redis và JWT. Mục tiêu là giúp bạn xem lại "vì sao làm như vậy", không chỉ copy code.

<a id="bai-1"></a>

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

<a id="bai-2"></a>

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

<a id="bai-3"></a>

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

<a id="bai-4"></a>

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

<a id="bai-5"></a>

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

<a id="bai-6"></a>

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

<a id="bai-7"></a>

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

<a id="bai-8"></a>

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

<a id="bai-9"></a>

## Bài 9: Environment Config và App Configuration

### Mục tiêu

- Gom các biến môi trường quan trọng vào `.env.example`.
- Hiểu app không nên hard-code database URL, Redis host, JWT secret.
- Dùng `ConfigModule` và `ConfigService` nhất quán hơn.

### Các biến môi trường cần có

```env
PORT=4000

DATABASE_URL="postgresql://mini_blog:mini_blog_password@localhost:5432/mini_blog_db?schema=public"

JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="1d"

REDIS_HOST="localhost"
REDIS_PORT=6379

POSTS_CACHE_TTL_SECONDS=60
```

### Vì sao cần `.env.example`?

`.env` thường chứa secret thật, không nên commit trong project production.

`.env.example` là file mẫu để người khác biết cần cấu hình gì.

```txt
.env         -> giá trị thật trên máy/local/server
.env.example -> template để document config
```

### Điều cần học

- `process.env` là cách Node.js đọc environment variables.
- `ConfigModule.forRoot({ isGlobal: true })` giúp NestJS load `.env`.
- `ConfigService.getOrThrow()` giúp app fail sớm nếu thiếu config quan trọng.

### Đã làm trong project

- Thêm `validateEnv` để validate config lúc app khởi động.
- `PORT`, `REDIS_PORT`, `POSTS_CACHE_TTL_SECONDS` được parse thành number.
- `PrismaService` lấy `DATABASE_URL` qua `ConfigService`.
- `QueueModule` và `CacheService` lấy Redis config qua `ConfigService`.
- `PostsService` lấy TTL cache từ `POSTS_CACHE_TTL_SECONDS`.
- `main.ts` lấy port từ `ConfigService`.
- README có hướng dẫn copy `.env.example` thành `.env`.

### Tiêu chí hoàn thành

- Có `.env.example` đầy đủ.
- README giải thích cách copy `.env.example` thành `.env`.
- App chạy được khi chỉ cần đổi config trong `.env`.

<a id="bai-10"></a>

## Bài 10: Error Handling và Response Shape

### Mục tiêu

- Hiểu NestJS built-in exceptions.
- Biết khi nào trả `400`, `401`, `403`, `404`, `409`, `500`.
- Làm API trả lỗi có ý nghĩa cho client.

### Các exception đã dùng

```ts
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('You can only update your own posts');
throw new NotFoundException('Post not found');
throw new ConflictException('Email already exists');
```

### Ý nghĩa status code

```txt
400 Bad Request   -> body/query sai validation
401 Unauthorized  -> chưa đăng nhập hoặc token sai
403 Forbidden     -> có đăng nhập nhưng không có quyền
404 Not Found     -> không tìm thấy resource
409 Conflict      -> dữ liệu xung đột, ví dụ email đã tồn tại
500 Server Error  -> lỗi server chưa xử lý đúng
```

### Lỗi nên tránh

Nếu post không tồn tại, không nên trả 500.

Đúng:

```ts
if (!post) {
  throw new NotFoundException('Post not found');
}
```

### Tiêu chí hoàn thành

- Register email trùng trả `409`.
- Login sai trả `401`.
- Update/delete post của người khác trả `403`.
- Get post không tồn tại trả `404`.
- Validation body sai trả `400`.

<a id="bai-11"></a>

## Bài 11: API Testing bằng Postman hoặc cURL

### Mục tiêu

- Test toàn bộ flow auth và posts bằng tay.
- Hiểu cách dùng JWT trong header.
- Biết debug khi API trả lỗi.

### Flow test chính

```txt
1. Register user
2. Login lấy accessToken
3. Create post bằng Bearer token
4. Get posts
5. Get one post
6. Update post
7. Delete post
8. Test quyền với user khác
```

### Header JWT

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Test validation

Thử tạo post với title quá ngắn:

```json
{
  "title": "Hi",
  "content": "This is valid content."
}
```

Kỳ vọng: API trả `400`.

### Test quyền

```txt
User A tạo post.
User B login.
User B update/delete post của User A.
```

Kỳ vọng: API trả `403`.

### Tiêu chí hoàn thành

- Có thể demo toàn bộ flow bằng Postman/cURL.
- Hiểu nhìn lỗi ở client và log ở terminal NestJS.

<a id="bai-12"></a>

## Bài 12: README Production-Style

### Mục tiêu

- Viết README để người khác clone project và chạy được.
- Document tech stack, setup, env, migration, API.

### README nên có

```txt
1. Project overview
2. Tech stack
3. Folder structure
4. Environment variables
5. Run with Docker
6. Install dependencies
7. Prisma migrate/generate
8. Start dev server
9. API examples
10. Learning notes
```

### Ví dụ run flow

```bash
docker compose up -d
yarn install
yarn prisma migrate dev
yarn prisma generate
yarn start:dev
```

Nếu PowerShell chặn `yarn.ps1`, ghi thêm:

```powershell
.\node_modules\.bin\nest.cmd build
```

### Tiêu chí hoàn thành

- Người khác đọc README có thể chạy project từ đầu.
- README không chỉ ghi lệnh, mà còn giải thích ngắn chức năng chính.

<a id="bai-13"></a>

## Bài 13: Refactor Nhẹ Cho Sạch Code

### Mục tiêu

- Sửa typo và style.
- Giảm lặp code vừa đủ.
- Giữ project đơn giản, không over-engineer.

### Các điểm nên sửa

Ví dụ:

```ts
hashedPasswprd -> hashedPassword
exitedUser -> existingUser
```

Nên dùng `import type` với type-only imports:

```ts
import type { AuthUser } from '../auth/strategies/jwt.strategy';
```

### Không nên refactor quá sớm

Ở giai đoạn học, ưu tiên hiểu flow:

```txt
Controller -> Service -> Prisma/Redis/Queue
```

Chỉ tách abstraction khi code thật sự lặp hoặc khó đọc.

### Tiêu chí hoàn thành

- Build pass.
- Code dễ đọc hơn.
- Không đổi behavior API.

<a id="bai-14"></a>

## Bài 14: Basic Automated Tests

### Mục tiêu

- Hiểu khác nhau giữa unit test và e2e test.
- Viết test nhỏ cho service hoặc controller.
- Biết test không thay thế manual testing, mà bổ sung an toàn.

### Unit test là gì?

Test một phần nhỏ, ví dụ `AuthService.login`.

```txt
Input: email/password sai
Expected: UnauthorizedException
```

### E2E test là gì?

Test gần giống người dùng thật gọi API:

```txt
POST /auth/register
POST /auth/login
POST /posts
GET /posts
```

### Với project này nên học gì trước?

Nên học e2e flow trước vì dễ hiểu với backend beginner.

Sau đó mới học mock service/unit test.

### Tiêu chí hoàn thành

- Có ít nhất test kiểm tra `/health`.
- Có ít nhất test auth happy path hoặc posts happy path.
- Hiểu khi nào test cần database test riêng.

<a id="bai-15"></a>

## Bài 15: Database Seeding

### Mục tiêu

- Tạo dữ liệu mẫu cho database.
- Không phải register/create post thủ công mỗi lần reset DB.

### Seed dùng để làm gì?

```txt
Tạo user demo.
Tạo vài post demo.
Giúp test API nhanh hơn.
```

### Ý tưởng file seed

```txt
prisma/seed.ts
```

Seed sẽ:

```txt
1. Hash password demo
2. Upsert user demo
3. Tạo posts demo
```

### Tiêu chí hoàn thành

- Chạy một lệnh seed có dữ liệu mẫu.
- Login được bằng user demo.
- `GET /posts` có dữ liệu ngay.

<a id="bai-16"></a>

## Bài 16: Pagination Nâng Cao và Query Options

### Mục tiêu

- Hiểu pagination hiện tại là offset pagination.
- Thêm search/sort cơ bản nếu muốn.
- Biết tradeoff giữa offset và cursor pagination.

### Offset pagination hiện tại

```ts
const skip = (page - 1) * limit;
```

Dễ hiểu, phù hợp project nhỏ.

### Khi nào cần cursor pagination?

Khi dữ liệu rất lớn hoặc feed thay đổi liên tục.

Ví dụ:

```txt
GET /posts?cursor=postId&limit=10
```

### Tiêu chí hoàn thành

- Hiểu page/limit hoạt động.
- Biết vì sao `limit` nên có `@Max(100)`.
- Nếu thêm search/sort, query vẫn được validate bằng DTO.

<a id="bai-17"></a>

## Bài 17: Cache Nâng Cao

### Mục tiêu

- Hiểu thêm cache detail post.
- Hiểu cache invalidation khó ở đâu.
- Biết khi nào không nên cache.

### Có nên cache `GET /posts/:id` không?

Có thể, nhưng chưa bắt buộc.

Cache detail hữu ích khi:

```txt
Post rất hot.
Detail query có nhiều relation.
Response ít thay đổi.
```

Cache detail key:

```ts
posts:detail:${id}
```

Invalidate khi update/delete:

```ts
await this.cacheService.del(`posts:detail:${id}`);
await this.cacheService.delByPattern('posts:list:*');
```

### Tiêu chí hoàn thành

- Hiểu vì sao list posts được cache trước.
- Biết cache càng nhiều thì invalidate càng phải cẩn thận.

<a id="bai-18"></a>

## Bài 18: Queue Nâng Cao

### Mục tiêu

- Hiểu retry, delay, attempts.
- Biết job thất bại thì xử lý thế nào.

### Add job với options

```ts
await this.postsQueue.add(
  SEND_EMAIL_JOB,
  { postId },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
);
```

Ý nghĩa:

```txt
Nếu job fail, thử lại tối đa 3 lần.
Mỗi lần retry chờ lâu hơn lần trước.
```

### Tiêu chí hoàn thành

- Hiểu retry job khác gì retry request.
- Biết log lỗi trong worker.
- Biết vì sao job nên idempotent.

<a id="bai-19"></a>

## Bài 19: Security Cơ Bản

### Mục tiêu

- Hiểu các lớp bảo vệ cơ bản của API.
- Biết password hash không phải encryption.
- Biết không expose secret/password.

### Checklist security

```txt
Hash password bằng bcrypt.
Không trả password trong response.
JWT secret không hard-code.
Protected routes dùng guard.
User chỉ sửa/xóa post của chính mình.
ValidationPipe bật whitelist.
```

### Các phần có thể học thêm

- Rate limiting.
- CORS.
- Helmet.
- Refresh token.
- Role-based access control.

### Tiêu chí hoàn thành

- Hiểu khác nhau giữa authentication và authorization.
- Hiểu vì sao `authorId` lấy từ JWT, không lấy từ body client.

<a id="bai-20"></a>

## Bài 20: Production Thinking

### Mục tiêu

- Nhìn project như một backend production-lite.
- Hiểu app cần quan sát, cấu hình, deploy và rollback.

### Những thứ production thật thường cần

```txt
Structured logging
Health checks
Database migration strategy
Error monitoring
Metrics
Rate limiting
CI/CD
Separate worker process
Secrets management
```

### Với project học này nên biết gì?

Không cần làm hết ngay. Nhưng cần hiểu:

```txt
Docker Compose giúp chạy dependency local.
Prisma migration giúp version database schema.
Redis cache giúp giảm query DB.
Queue giúp tách background work khỏi request.
JWT guard giúp bảo vệ route.
```

### Tiêu chí hoàn thành

- Bạn có thể giải thích kiến trúc project từ request vào tới database/cache/queue.
- Bạn có thể tự debug lỗi thường gặp bằng log.
- Bạn có thể clone project mới và dựng lại từ đầu.

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
- [x] BullMQ queue và worker
- [x] Environment config
- [ ] README production-style
- [ ] Refactor nhẹ
- [ ] Basic automated tests
- [ ] Database seeding
- [ ] Pagination/query nâng cao
- [ ] Cache nâng cao
- [ ] Queue nâng cao
- [ ] Security cơ bản
- [ ] Production thinking
