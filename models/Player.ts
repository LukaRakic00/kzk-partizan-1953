import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  surname: string;
  position: string;
  number: number;
  year: number;
  image?: string;
  bio?: string;
  height?: number;
  weight?: number;
  dateOfBirth?: Date;
  category?: 'seniori' | 'juniori' | 'kadetkinje' | 'pionirke';
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: false,
    },
    number: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    bio: {
      type: String,
    },
    height: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    dateOfBirth: {
      type: Date,
    },
    category: {
      type: String,
      enum: ['seniori', 'juniori', 'kadetkinje', 'pionirke'],
    },
  },
  {
    timestamps: true,
  }
);

const Player: Model<IPlayer> = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;

