import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  season: string; // "2024/25"
  title: string;
  description: string;
  teamImage: string;
  upravniOdborImage?: string;
  menadzmentImage?: string;
  subcategoryImages?: {
    predsednik?: string;
    podpredsednik?: string;
    clanovi_upravnog_odbora?: string;
    menadzment?: string;
    direktor?: string;
    sportski_direktor?: string;
    direktor_marketinga?: string;
    pr_marketinga?: string;
    finansijski_direktor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IManagement extends Document {
  name: string;
  position?: string;
  image?: string;
  type: 'upravni_odbor' | 'menadzment';
  subcategory?: 'predsednik' | 'podpredsednik' | 'clanovi_upravnog_odbora' | 'menadzment' | 'direktor' | 'sportski_direktor' | 'direktor_marketinga' | 'pr_marketinga' | 'finansijski_direktor';
  order?: number;
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
    subcategoryImages: {
      type: {
        predsednik: String,
        podpredsednik: String,
        clanovi_upravnog_odbora: String,
        menadzment: String,
        direktor: String,
        sportski_direktor: String,
        direktor_marketinga: String,
        pr_marketinga: String,
        finansijski_direktor: String,
      },
      default: {},
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
    },
    image: {
      type: String,
    },
    type: {
      type: String,
      enum: ['upravni_odbor', 'menadzment'],
      required: true,
      default: 'upravni_odbor',
    },
    subcategory: {
      type: String,
      enum: ['predsednik', 'podpredsednik', 'clanovi_upravnog_odbora', 'menadzment', 'direktor', 'sportski_direktor', 'direktor_marketinga', 'pr_marketinga', 'finansijski_direktor'],
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

