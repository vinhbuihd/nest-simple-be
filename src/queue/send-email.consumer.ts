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

    await Promise.resolve();
  }
}
