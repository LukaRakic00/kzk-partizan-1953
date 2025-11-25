import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: string | object;
  type: 'text' | 'image' | 'json';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'json'],
      default: 'text',
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;

