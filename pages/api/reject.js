import dbConnect from '../../lib/db';
import Upload from '../../lib/Upload';
import User from '../../lib/User';

const REJECTION_PENALTY = 50;
const APPROVAL_POINTS = 50;

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

    // Find the upload first to check its current status and get the user ID
    const upload = await Upload.findById(uploadId);

    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    // Only deduct points and increment rejects if it wasn't already rejected
    if (upload.status !== 'rejected') {
      const oldStatus = upload.status;
      upload.status = 'rejected';
      await upload.save();

      // Always remove 50 points when rejecting
      const pointsDelta = REJECTION_PENALTY;

      // Update the user: increment rejects and decrement points
      const user = await User.findByIdAndUpdate(
        upload.user,
        { 
          $inc: { 
            rejects: 1,
            points: -pointsDelta 
          } 
        },
        { new: true }
      );

      return res.status(200).json({ success: true, upload, user, delta: -pointsDelta });
    }

    return res.status(200).json({ success: true, upload, message: 'Already rejected', delta: 0 });
  } catch (error) {
    console.error('Error rejecting upload:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
