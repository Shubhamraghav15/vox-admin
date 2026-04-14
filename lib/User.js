import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String },
  fullName: { type: String },
  city: { type: String },
  address: { type: String },
  dob: { type: String },
  wifeName: { type: String },
  anniversary: { type: String },
  profileComplete: { type: Boolean, default: false },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'champion'], default: 'bronze' },
  points: { type: Number, default: 0 },
  rejects: { type: Number, default: 0 },
  uploadCount: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // ── Permanent ban ─────────────────────────────────────────────────────────
  isBlocked: { type: Boolean, default: false }, // checked before OTP is sent
  blockedAt: { type: Date },                    // when the ban was applied

  purpleCap: { type: Boolean, default: false },
  teamName: { type: String },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);