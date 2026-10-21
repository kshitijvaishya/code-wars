import mongoose, { Document, Schema } from 'mongoose';
import type { BattleState, ScoringMode, ParticipantStatus } from '@code-wars/shared';

export interface IBattleParticipant {
  userId: mongoose.Types.ObjectId;
  username: string;
  avatarUrl: string | null;
  rating: number;
  status: ParticipantStatus;
  isReady: boolean;
  score: number;
  totalScore: number;
  submittedAt: Date | null;
  verdict: string | null;
  ratingDelta: number;
  socketId: string | null;
  lastSeenAt: Date;
}

export interface IBattle extends Document {
  _id: mongoose.Types.ObjectId;
  inviteCode: string;
  inviteExpiresAt: Date | null;
  state: BattleState;
  scoringMode: ScoringMode;
  difficulty: 'easy' | 'medium' | 'hard';
  durationSeconds: number;
  startTime: Date | null;
  endTime: Date | null;
  participants: IBattleParticipant[];
  problemId: mongoose.Types.ObjectId | null;
  winnerId: mongoose.Types.ObjectId | null;
  isDraw: boolean;
  isPrivate: boolean;
  finalizationToken: string | null; // idempotency key
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IBattleParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, default: null },
  rating: { type: Number, required: true },
  status: {
    type: String,
    enum: ['waiting', 'connected', 'ready', 'coding', 'submitted', 'disconnected'],
    default: 'waiting',
  },
  isReady: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  submittedAt: { type: Date, default: null },
  verdict: { type: String, default: null },
  ratingDelta: { type: Number, default: 0 },
  socketId: { type: String, default: null },
  lastSeenAt: { type: Date, default: Date.now },
});

const BattleSchema = new Schema<IBattle>(
  {
    inviteCode: { type: String, required: true, unique: true, index: true },
    inviteExpiresAt: { type: Date, default: null, index: true },
    state: {
      type: String,
      enum: ['WAITING', 'READY_CHECK', 'COUNTDOWN', 'ACTIVE', 'FINALIZING', 'COMPLETED', 'CANCELLED', 'FAILED'],
      default: 'WAITING',
      index: true,
    },
    scoringMode: {
      type: String,
      enum: ['first_accepted', 'score_based', 'time_based', 'best_of_three'],
      default: 'first_accepted',
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    durationSeconds: { type: Number, required: true, default: 1800 },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    participants: { type: [ParticipantSchema], default: [] },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', default: null },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDraw: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    finalizationToken: { type: String, default: null },
  },
  { timestamps: true },
);

BattleSchema.index({ state: 1, createdAt: -1 });
BattleSchema.index({ 'participants.userId': 1, state: 1 });

BattleSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const Battle = mongoose.model<IBattle>('Battle', BattleSchema);
