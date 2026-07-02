import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  user?: mongoose.Types.ObjectId;
  defaultReciter?: string;
  themeColors?: Record<string, string>;
  fontSize?: number;
  translationLanguage?: string;
  notificationPrefs?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  defaultReciter: { type: String, default: 'ar.alafasy' },
  themeColors: { type: Schema.Types.Mixed, default: {} },
  fontSize: { type: Number, default: 18 },
  translationLanguage: { type: String, default: 'en.sahih' },
  notificationPrefs: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model<ISettings>('Settings', SettingsSchema);
