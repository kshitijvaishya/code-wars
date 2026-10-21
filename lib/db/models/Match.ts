import mongoose, { Document, Schema } from 'mongoose';

export type MatchStatus = 
  | 'waiting' 
  | 'paired' 
  | 'ready' 
  | 'countdown' 
  | 'in_progress' 
  | 'completed'
  | 'cancelled'
  | 'abandoned';

export interface IMatch extends Document {
  _id: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  stage: 'preliminary' | 'final';
  groupLabel: string; // Dynamic: 'A', 'B', 'C', etc.
  
  playerIds: [mongoose.Types.ObjectId, mongoose.Types.ObjectId]; // Always exactly 2
  
  status: MatchStatus;
  
  currentRound: number; // 1, 2, or 3
  currentQuestionIndex: number;
  
  // Timer fields - server authoritative
  roundStartedAt?: Date;
  questionStartedAt?: Date;
  questionDeadlineAt?: Date; // Critical: server validates against this
  roundDeadlineAt?: Date; // For round 3
  
  // Scores per player
  round1Scores: Map<string, number>;
  round2Scores: Map<string, number>;
  preliminaryScores: Map<string, number>;
  finalScores?: Map<string, number>;
  
  winnerId?: mongoose.Types.ObjectId;
  
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
    stage: {
      type: String,
      enum: ['preliminary', 'final'],
      default: 'preliminary',
    },
    groupLabel: { type: String, required: true }, // Dynamic, not enum
    playerIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) => v.length === 2,
        message: 'Match must have exactly 2 players',
      },
    },
    status: {
      type: String,
      enum: ['waiting', 'paired', 'ready', 'countdown', 'in_progress', 'completed', 'cancelled', 'abandoned'],
      default: 'waiting',
      index: true,
    },
    currentRound: { type: Number, default: 0 },
    currentQuestionIndex: { type: Number, default: 0 },
    
    // Timers
    roundStartedAt: Date,
    questionStartedAt: Date,
    questionDeadlineAt: Date,
    roundDeadlineAt: Date,
    
    // Scores
    round1Scores: { type: Map, of: Number, default: () => new Map() },
    round2Scores: { type: Map, of: Number, default: () => new Map() },
    preliminaryScores: { type: Map, of: Number, default: () => new Map() },
    finalScores: { type: Map, of: Number },
    
    winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

MatchSchema.index({ tournamentId: 1, status: 1 });
MatchSchema.index({ playerIds: 1, status: 1 });
MatchSchema.index({ groupLabel: 1, tournamentId: 1 });

MatchSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    ret.id = ret._id.toString();
    delete ret._id;
    
    // Convert Map to object for JSON serialization
    if (ret.round1Scores) {
      ret.round1Scores = Object.fromEntries(ret.round1Scores);
    }
    if (ret.round2Scores) {
      ret.round2Scores = Object.fromEntries(ret.round2Scores);
    }
    if (ret.preliminaryScores) {
      ret.preliminaryScores = Object.fromEntries(ret.preliminaryScores);
    }
    if (ret.finalScores) {
      ret.finalScores = Object.fromEntries(ret.finalScores);
    }
    
    return ret;
  },
});

export const Match = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);
