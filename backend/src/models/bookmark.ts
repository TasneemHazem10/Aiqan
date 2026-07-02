import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmark extends Document {
  user: mongoose.Types.ObjectId;
  surah: number;
  ayah: number;
  note?: string;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  surah: { type: Number, required: true },
  ayah: { type: Number, required: true },
  note: { type: String },
}, { timestamps: true });

export default mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
