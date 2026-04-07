import dbConnect from '../../lib/db';
import Upload from '../../lib/Upload';
import User from '../../lib/User';

const APPROVAL_POINTS = 50;
const REJECTION_PENALTY = 50;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uploadIds, action } = req.body;

  if (!uploadIds || !Array.isArray(uploadIds) || uploadIds.length === 0) {
    return res.status(400).json({ message: 'Upload IDs are required' });
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  try {
    await dbConnect();

    const results = [];

    for (const uploadId of uploadIds) {
      const upload = await Upload.findById(uploadId);
      if (!upload) continue;

      if (action === 'approve' && upload.status !== 'approved') {
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
              rejects: oldStatus === 'rejected' ? -1 : 0
            } 
          },
          { new: true }
        );
        results.push({ uploadId, status: 'approved', user, delta: pointsDelta });
      } else if (action === 'reject' && upload.status !== 'rejected') {
        const oldStatus = upload.status;
        upload.status = 'rejected';
        await upload.save();

        // Always remove 50 points when rejecting
        const pointsDelta = REJECTION_PENALTY;

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
        results.push({ uploadId, status: 'rejected', user, delta: -pointsDelta });
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Error in bulk action:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
