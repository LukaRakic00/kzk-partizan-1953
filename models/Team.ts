import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  season: string; // "2024/25"
  title: string;
  description: string;
  teamImage: string;
  upravniOdborImage?: string;
  menadzmentImage?: string;
  rukovodstvoImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IManagement extends Document {
  name: string;
  position: string;
  image?: string;
  type: 'upravni_odbor' | 'menadzment' | 'rukovodstvo';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema = new Schema(
  {
    season: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    teamImage: {
      type: String,
      required: true,
    },
    upravniOdborImage: {
      type: String,
    },
    menadzmentImage: {
      type: String,
    },
    rukovodstvoImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ManagementSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    type: {
      type: String,
      enum: ['upravni_odbor', 'menadzment', 'rukovodstvo'],
      required: true,
      default: 'rukovodstvo',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
const Management: Model<IManagement> = mongoose.models.Management || mongoose.model<IManagement>('Management', ManagementSchema);

export default Team;
export { Management };

