import dbConnect from '../../lib/db';
import Upload from '../../lib/Upload';
import User from '../../lib/User'; // Ensure User model is registered

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Fetch uploads and populate user details
    // Only select necessary user fields: name, fullName, phone, city, teamName, points
    const uploads = await Upload.find({})
      .populate({
        path: 'user',
        select: 'name fullName phone city teamName points isBlocked' // Include isBlocked to check if user is banned
      })
      .sort({ createdAt: -1 })
      .lean();

    // Group uploads by user
    const groupedByUser = uploads.reduce((acc, upload) => {
      if (!upload.user) return acc; // Skip if user is missing

      const userId = upload.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: upload.user,
          submissions: []
        };
      }
      acc[userId].submissions.push(upload);
      return acc;
    }, {});

    // Convert object to array
    const result = Object.values(groupedByUser);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
