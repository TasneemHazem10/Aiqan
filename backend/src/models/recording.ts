import mongoose, { Document, Schema } from 'mongoose';

export interface IRecording extends Document {
  userId: string;
  name: string;
  surahNumber: number;
  surahName: string;
  uri: string;
  duration: number;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const RecordingSchema = new Schema<IRecording>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  surahNumber: { type: Number, default: 0 },
  surahName: { type: String, default: '' },
  uri: { type: String, required: true },
  duration: { type: Number, default: 0 },
  fileSize: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

RecordingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IRecording>('Recording', RecordingSchema);
