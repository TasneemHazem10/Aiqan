import mongoose, { Document, Schema } from 'mongoose';

export interface IParticipant {
  user: mongoose.Types.ObjectId;
  joinedAt: Date;
  score: number;
  completed: boolean;
}

export interface IChallenge extends Document {
  creator: mongoose.Types.ObjectId;
  participants: IParticipant[];
  type: 'memorization' | 'reading' | 'dhikr' | 'streak';
  goal: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  score: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
});

const ChallengeSchema = new Schema<IChallenge>({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [ParticipantSchema],
  type: { type: String, enum: ['memorization', 'reading', 'dhikr', 'streak'], required: true },
  goal: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
