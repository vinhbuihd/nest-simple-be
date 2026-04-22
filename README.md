# Mini Blog API

A production-style learning backend built with NestJS, PostgreSQL, Prisma, Redis, BullMQ, and JWT authentication.

This project is designed as a backend learning project. It demonstrates common backend patterns such as authentication, protected routes, database access, caching, background jobs, validation, and error handling.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- JWT Authentication
- Docker Compose
- class-validator / class-transformer

## Features

- Register user with email and password
- Hash password with bcrypt
- Login and receive JWT access token
- Protect routes with JWT guard
- CRUD posts
- Author-only update/delete posts
- Pagination for `GET /posts`
- Redis cache for `GET /posts`
- Cache invalidation when posts are created, updated, or deleted
- BullMQ background job when a post is created
- Prisma migrations
- Docker Compose for PostgreSQL and Redis

## Folder Structure

```txt
src/
  auth/
    dto/
    guards/
    strategies/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
  cache/
    cache.module.ts
    cache.service.ts
  common/
    decorators/
  posts/
    dto/
    posts.controller.ts
    posts.module.ts
    posts.service.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  queue/
    queue.constants.ts
    queue.module.ts
    posts-queue.producer.ts
    send-email.consumer.ts
  users/
    users.module.ts
    users.service.ts
  app.module.ts
  main.ts
```

## Environment Variables

```bash
copy.env.example.env;
```

## Run Infrastructure with Docker

Start infrastructure:

```bash
docker compose up -d
```

## Install Dependencies

```bash
yarn install
```

## Prisma Migration

Run migrations:

```bash
yarn prisma generate
```

Open Prisma Studio:

```bash
 yarn prisma studio
```

## Start Application

```bash
yarn start:dev
```

## API Overview

```http
GET /health
```

```http
POST /auth/register
POST /auth/login
```

## Learning Notes

BACKEND_LEARNING_NOTES.md
