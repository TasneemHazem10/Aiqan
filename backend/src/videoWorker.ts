import { videoQueue } from './videoQueue';
import * as videoProcessor from './services/videoProcessor';

videoQueue.process(async (job: any) => {
  const { jobId, input } = job.data;
  console.log('Worker: processing job', jobId);
  await videoProcessor.processJob(jobId, input);
});

videoQueue.on('completed', (job) => {
  console.log('Worker: job completed', job.id);
});

videoQueue.on('failed', (job, err) => {
  console.error('Worker: job failed', job.id, err);
});

console.log('Video worker started, connected to queue');
