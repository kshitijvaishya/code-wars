import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'contest_admin' | 'super_admin';
  avatarUrl: string | null;
  bio: string | null;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  totalBattles: number;
  isSuspended: boolean;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['user', 'contest_admin', 'super_admin'],
      default: 'user',
    },
    avatarUrl: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 500 },
    rating: { type: Number, default: 1200, index: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    totalBattles: { type: Number, default: 0 },
    isSuspended: { type: Boolean, default: false },
    refreshTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true },
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Never return passwordHash or refreshTokens in normal queries
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.refreshTokens;
    delete ret.__v;
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
