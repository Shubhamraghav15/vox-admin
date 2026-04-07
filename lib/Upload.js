import mongoose from 'mongoose';

const UploadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectName: { type: String },
  city: { type: String },
  area: { type: Number },
  notes: { type: String },
  photos: [{ type: String }], // Array of image URLs, max 3
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default mongoose.models.Upload || mongoose.model('Upload', UploadSchema);
