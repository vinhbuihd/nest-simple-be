import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { POSTS_QUEUE } from './queue.constants';
import { PostsQueueProducer } from './posts-queue.producer';
import { SendEmailConsumer } from './send-email.consumer';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),

    BullModule.registerQueue({ name: POSTS_QUEUE }),
  ],

  providers: [PostsQueueProducer, SendEmailConsumer],
  exports: [PostsQueueProducer],
})
export class QueueModule {}
