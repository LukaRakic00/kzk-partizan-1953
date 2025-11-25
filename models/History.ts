import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHistory extends Document {
  year: number;
  title: string;
  content: string;
  image?: string;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

const HistorySchema: Schema = new Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    achievements: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const History: Model<IHistory> = mongoose.models.History || mongoose.model<IHistory>('History', HistorySchema);

export default History;

