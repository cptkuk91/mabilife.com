import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToAuthDatabase } from '@/lib/mongodb';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  googleId: string;
  level: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  googleId: { type: String, required: true, unique: true },
  level: { type: Number, default: 1 },
  role: { type: String, default: 'user' },
}, {
  timestamps: true,
});

// We need to use the auth connection
let User: Model<IUser>;

const getUserModel = async () => {
  const db = await connectToAuthDatabase();
  // Check if the model is already registered on the connection
  if (db.models.User) {
    User = db.models.User as Model<IUser>;
  } else {
    User = db.model<IUser>('User', UserSchema);
  }
  return User;
};

export default getUserModel;
