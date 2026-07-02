import mongoose, { Document, Schema } from 'mongoose';

export interface IReciter extends Document {
  reciterId: string;
  name: string;
  displayName?: string;
  available?: boolean;
}

const ReciterSchema = new Schema<IReciter>({
  reciterId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  displayName: { type: String },
  available: { type: Boolean, default: true },
});

export default mongoose.model<IReciter>('Reciter', ReciterSchema);
