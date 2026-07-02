import mongoose, { Document, Schema } from 'mongoose';

export interface IFasting extends Document {
  user: mongoose.Types.ObjectId;
  date: string;
  type: 'ramadan' | 'sunnah' | 'qada' | 'nazar';
  status: 'fasted' | 'missed' | 'partial' | 'planned';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FastingSchema = new Schema<IFasting>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['ramadan', 'sunnah', 'qada', 'nazar'], required: true },
  status: { type: String, enum: ['fasted', 'missed', 'partial', 'planned'], required: true },
  notes: { type: String },
}, { timestamps: true });

FastingSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model<IFasting>('Fasting', FastingSchema);
