import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IImage extends Document {
  publicId: string;
  url: string;
  category?: mongoose.Types.ObjectId | string;
  folder: string;
  order: number;
  width?: number;
  height?: number;
  format?: string;
  urlSajta?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema: Schema = new Schema(
  {
    publicId: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.Mixed,
      ref: 'ImageCategory',
      required: false,
    },
    folder: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    format: {
      type: String,
    },
    urlSajta: {
      type: String,
      required: false,
      default: null,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const Image: Model<IImage> = mongoose.models.Image || mongoose.model<IImage>('Image', ImageSchema);

export default Image;

