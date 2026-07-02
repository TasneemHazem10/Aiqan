import mongoose, { Document, Schema } from 'mongoose';

export interface IBackup extends Document {
  user: mongoose.Types.ObjectId;
  data: Record<string, any>;
  version: string;
  size: number;
  platform: 'ios' | 'android';
  createdAt: Date;
}

const BackupSchema = new Schema<IBackup>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  version: { type: String, default: '1.0' },
  size: { type: Number, default: 0 },
  platform: { type: String, enum: ['ios', 'android'], default: 'android' },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model<IBackup>('Backup', BackupSchema);
