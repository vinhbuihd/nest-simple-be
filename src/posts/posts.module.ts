import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CacheModule } from '../cache/cache.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, CacheModule, QueueModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
