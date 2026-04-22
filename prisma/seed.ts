import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: {
      email: 'demo@example.com',
    },
    update: {
      password,
    },
    create: {
      email: 'demo@example.com',
      password,
    },
  });

  await prisma.post.deleteMany({
    where: {
      authorId: user.id,
    },
  });

  await prisma.post.createMany({
    data: [
      {
        title: 'Getting started with NestJS',
        content:
          'NestJS helps you build scalable backend applications with modules, controllers, and services.',
        authorId: user.id,
      },
      {
        title: 'Using Prisma with PostgreSQL',
        content:
          'Prisma provides a type-safe database client and migration workflow for PostgreSQL.',
        authorId: user.id,
      },
      {
        title: 'Caching posts with Redis',
        content:
          'Redis can cache frequently requested data and reduce repeated database queries.',
        authorId: user.id,
      },
    ],
  });

  console.log('Seed completed');
  console.log(`Demo user: ${user.email}`);
  console.log('Demo password: 123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
