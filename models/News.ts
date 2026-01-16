import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INews extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image?: string;
  images?: string[]; // Više slika
  author: string;
  published: boolean;
  publishedAt?: Date;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    author: {
      type: String,
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    category: {
      type: String,
      default: 'Vesti',
    },
  },
  {
    timestamps: true,
  }
);

const News: Model<INews> = mongoose.models.News || mongoose.model<INews>('News', NewsSchema);

export default News;

