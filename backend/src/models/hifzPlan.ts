import mongoose, { Document, Schema } from 'mongoose';

export interface IWeakAyah {
  surahNumber: number;
  ayahNumber: number;
  strength: number;
  lastReviewed: Date;
  reviewCount: number;
}

export interface IDailyTask {
  surahNumber: number;
  ayahRange: string;
  reps: number;
  completed: boolean;
}

export interface IDailyPlan {
  date: string;
  tasks: IDailyTask[];
}

export interface IHifzPlan extends Document {
  user: mongoose.Types.ObjectId;
  weakAyahs: IWeakAyah[];
  dailyPlans: IDailyPlan[];
  currentLevel: string;
  weeklyGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

const WeakAyahSchema = new Schema<IWeakAyah>({
  surahNumber: { type: Number, required: true },
  ayahNumber: { type: Number, required: true },
  strength: { type: Number, default: 50, min: 0, max: 100 },
  lastReviewed: { type: Date, default: Date.now },
  reviewCount: { type: Number, default: 0 },
});

const DailyTaskSchema = new Schema<IDailyTask>({
  surahNumber: { type: Number, required: true },
  ayahRange: { type: String, required: true },
  reps: { type: Number, default: 3 },
  completed: { type: Boolean, default: false },
});

const DailyPlanSchema = new Schema<IDailyPlan>({
  date: { type: String, required: true },
  tasks: [DailyTaskSchema],
});

const HifzPlanSchema = new Schema<IHifzPlan>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weakAyahs: [WeakAyahSchema],
  dailyPlans: [DailyPlanSchema],
  currentLevel: { type: String, enum: ['beginner', 'intermediate', 'hafiz'], default: 'beginner' },
  weeklyGoal: { type: Number, default: 7 },
}, { timestamps: true });

export default mongoose.model<IHifzPlan>('HifzPlan', HifzPlanSchema);
