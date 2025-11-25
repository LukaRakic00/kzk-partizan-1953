import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminUser extends Document {
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AdminUser: Model<IAdminUser> = mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema, 'adminusers');

export default AdminUser;

