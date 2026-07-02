import mongoose, { Document, Schema } from 'mongoose';

export interface IIslamicEvent extends Document {
  eventType: 'ramadan_start' | 'eid_fitr' | 'eid_adha' | 'day_of_arafah' | 'muharram' | 'ashura' | 'mawlid' | 'isra_miraj' | 'nisf_shaban' | 'other';
  gregorianDate: string;
  hijriDate: string;
  name: { ar: string; en: string };
  description?: { ar: string; en: string };
  reminderDaysBefore: number;
}

const IslamicEventSchema = new Schema<IIslamicEvent>({
  eventType: { type: String, enum: ['ramadan_start', 'eid_fitr', 'eid_adha', 'day_of_arafah', 'muharram', 'ashura', 'mawlid', 'isra_miraj', 'nisf_shaban', 'other'], required: true },
  gregorianDate: { type: String, required: true },
  hijriDate: { type: String, required: true },
  name: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  description: {
    ar: { type: String },
    en: { type: String },
  },
  reminderDaysBefore: { type: Number, default: 3 },
});

export default mongoose.model<IIslamicEvent>('IslamicEvent', IslamicEventSchema);
