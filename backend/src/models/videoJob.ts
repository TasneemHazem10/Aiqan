import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoJob extends Document {
  user: mongoose.Types.ObjectId | string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: Record<string, any>;
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoJobSchema = new Schema<IVideoJob>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  input: { type: Schema.Types.Mixed, default: {} },
  outputUrl: { type: String },
  error: { type: String },
}, { timestamps: true });

export default mongoose.model<IVideoJob>('VideoJob', VideoJobSchema);
