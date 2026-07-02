import mongoose, { Document, Schema } from 'mongoose';

export interface IProgress extends Document {
  user: mongoose.Types.ObjectId;
  type: 'quran' | 'memorization' | 'azkar' | 'dhikr' | 'meta';
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model<IProgress>('Progress', ProgressSchema);
