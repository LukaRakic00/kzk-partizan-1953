import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClubStatus extends Document {
  title: string;
  content: string;
  sections: {
    title: string;
    content: string;
    image?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ClubStatusSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sections: {
      type: [
        {
          title: String,
          content: String,
          image: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ClubStatus: Model<IClubStatus> = mongoose.models.ClubStatus || mongoose.model<IClubStatus>('ClubStatus', ClubStatusSchema);

export default ClubStatus;

