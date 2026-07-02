import mongoose, { Document, Schema } from 'mongoose';

export interface IChildProgress extends Document {
  parentUser: mongoose.Types.ObjectId;
  childName: string;
  surahNumber: number;
  ayahNumber: number;
  status: 'memorized' | 'in_progress' | 'not_started';
  lastPracticed?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChildProgressSchema = new Schema<IChildProgress>({
  parentUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  childName: { type: String, required: true },
  surahNumber: { type: Number, required: true },
  ayahNumber: { type: Number, required: true },
  status: { type: String, enum: ['memorized', 'in_progress', 'not_started'], default: 'not_started' },
  lastPracticed: { type: Date },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model<IChildProgress>('ChildProgress', ChildProgressSchema);
