import mongoose, { Document, Schema } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  topic: string;
  message: string;
  deliveredBy?: 'email' | 'db';
  deliverError?: string;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    topic: { type: String, required: true, trim: true, maxlength: 60 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    // How this submission was dispatched: 'email' when Gmail delivery succeeded,
    // otherwise 'db' (recorded in dev/fallback mode).
    deliveredBy: { type: String, enum: ['email', 'db'] },
    // Audit trail of why email delivery failed (e.g. Gmail auth/network error).
    deliverError: { type: String },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

export default mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);
