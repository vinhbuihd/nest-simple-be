import { Injectable } from '@nestjs/common';
import { POSTS_QUEUE, SEND_EMAIL_JOB } from './queue.constants';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

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
    await this.postsQueue.add(SEND_EMAIL_JOB, { postId });
  }
}
