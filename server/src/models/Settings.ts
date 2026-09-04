import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  font: 'jetbrains' | 'fira' | 'cascadia';
  fontSize: number;
  soundEnabled: boolean;
  caretStyle: 'bar' | 'block' | 'underline';
  testDuration: 60 | 120 | 300 | 600 | 900;
  wordCount: number;
  includeNumbers: boolean;
  includePunctuation: boolean;
}

const settingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    font: { type: String, enum: ['jetbrains', 'fira', 'cascadia'], default: 'jetbrains' },
    fontSize: { type: Number, default: 18, min: 12, max: 32 },
    soundEnabled: { type: Boolean, default: false },
    caretStyle: { type: String, enum: ['bar', 'block', 'underline'], default: 'bar' },
    testDuration: { type: Number, enum: [60, 120, 300, 600, 900], default: 60 },
    wordCount: { type: Number, default: 25, min: 10, max: 100 },
    includeNumbers: { type: Boolean, default: false },
    includePunctuation: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', settingsSchema);
