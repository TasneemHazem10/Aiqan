import VideoJob from '../models/videoJob';
import { addToVideoQueue } from '../videoQueue';

export async function enqueueVideoJob(userId: string | undefined, input: Record<string, any>) {
  const job = new VideoJob({ user: userId, input, status: 'pending' });
  await job.save();

  // Enqueue to Redis-backed queue for worker processing
  await addToVideoQueue(job._id.toString(), input);
  return job;
}


export async function getJob(jobId: string) {
  return await VideoJob.findById(jobId).lean().exec();
}
