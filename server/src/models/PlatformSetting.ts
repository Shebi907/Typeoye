import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSetting extends Document {
  key: string;
  value: unknown;
  label?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

const platformSettingSchema = new Schema<IPlatformSetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    label: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IPlatformSetting>('PlatformSetting', platformSettingSchema);