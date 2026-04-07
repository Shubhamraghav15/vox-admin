import dbConnect from '../../lib/db';
import Upload from '../../lib/Upload';
import User from '../../lib/User';

const APPROVAL_POINTS = 50;
const REJECTION_PENALTY = 50;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uploadId } = req.body;

  if (!uploadId) {
    return res.status(400).json({ message: 'Upload ID is required' });
  }

  try {
    await dbConnect();

    const upload = await Upload.findById(uploadId);

    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    // Only add points if it wasn't already approved
    if (upload.status !== 'approved') {
      const oldStatus = upload.status;
      upload.status = 'approved';
      await upload.save();

      // Always add 50 points when approving
      const pointsDelta = APPROVAL_POINTS;

      const user = await User.findByIdAndUpdate(
        upload.user,
        { 
          $inc: { 
            points: pointsDelta,
            // If it was rejected, decrement rejects count
            rejects: oldStatus === 'rejected' ? -1 : 0
          } 
        },
        { new: true }
      );

      return res.status(200).json({ success: true, upload, user, delta: pointsDelta });
    }

    return res.status(200).json({ success: true, upload, message: 'Already approved', delta: 0 });
  } catch (error) {
    console.error('Error approving upload:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
