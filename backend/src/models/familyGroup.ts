import mongoose, { Document, Schema } from 'mongoose';

export interface IMember {
  user: mongoose.Types.ObjectId;
  role: 'admin' | 'member' | 'child';
  joinedAt: Date;
}

export interface IFamilyGroup extends Document {
  name: string;
  type: 'family' | 'halaqat';
  admin: mongoose.Types.ObjectId;
  members: IMember[];
  inviteCode: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member', 'child'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});

const FamilyGroupSchema = new Schema<IFamilyGroup>({
  name: { type: String, required: true },
  type: { type: String, enum: ['family', 'halaqat'], required: true },
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [MemberSchema],
  inviteCode: { type: String, unique: true, index: true },
  description: { type: String },
}, { timestamps: true });

export default mongoose.model<IFamilyGroup>('FamilyGroup', FamilyGroupSchema);
