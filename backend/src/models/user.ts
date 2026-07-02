import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String },
  email: { type: String, unique: true, index: true, sparse: true },
  password: { type: String },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
