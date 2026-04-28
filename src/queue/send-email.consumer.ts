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
    if (job.name !== SEND_EMAIL_JOB) return;

    this.logger.log(
      `[START] jobId=${job.id} attemptsMade=${job.attemptsMade} data=${JSON.stringify(job.data)}`,
    );

    // TODO: giả lập gửi email
    await Promise.resolve();

    this.logger.log(
      `[DONE] jobId=${job.id} attemptsMade=${job.attemptsMade} postId=${job.data.postId}`,
    );
  }
}
