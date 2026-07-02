import Bull from 'bull';
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const videoQueue = new Bull('video-jobs', redisUrl);
export async function addToVideoQueue(jobId: string, input: Record<string, any>) {
  return await videoQueue.add({ jobId, input }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
}
export default videoQueue;
