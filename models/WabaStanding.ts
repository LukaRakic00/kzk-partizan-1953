import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWabaStanding extends Document {
  rank: number;
  team: string;
  gp: number; // Games Played
  w: number;  // Wins
  l: number;  // Losses
  points: number; // P (bodovi)
  pts: number; // PTS (Points For iz PTS/OPTS)
  opts: number; // OPTS (Opponent Points iz PTS/OPTS)
  diff: number; // Difference (+/-)
  leagueId: string;
  updatedAt: Date;
  createdAt: Date;
}

const WabaStandingSchema: Schema = new Schema(
  {
    rank: {
      type: Number,
      required: true,
    },
    team: {
      type: String,
      required: true,
    },
    gp: {
      type: Number,
      required: true,
      default: 0,
    },
    w: {
      type: Number,
      required: true,
      default: 0,
    },
    l: {
      type: Number,
      required: true,
      default: 0,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
    },
    pts: {
      type: Number,
      required: true,
      default: 0,
    },
    opts: {
      type: Number,
      required: true,
      default: 0,
    },
    diff: {
      type: Number,
      required: true,
      default: 0,
    },
    leagueId: {
      type: String,
      required: true,
      default: '31913',
    },
  },
  {
    timestamps: true,
  }
);

// Index za brže pretrage
WabaStandingSchema.index({ leagueId: 1, rank: 1 });
WabaStandingSchema.index({ team: 1 });

const WabaStanding: Model<IWabaStanding> = mongoose.models.WabaStanding || mongoose.model<IWabaStanding>('WabaStanding', WabaStandingSchema);

export default WabaStanding;
