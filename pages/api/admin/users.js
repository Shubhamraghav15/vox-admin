// pages/api/admin/users.js
import dbConnect from '../../../lib/db';
import User from '../../../lib/User';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await dbConnect();

        const users = await User.find({ role: 'user' })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(users);
    } catch (err) {
        console.error('Users fetch error:', err);
        return res.status(500).json({ message: 'Failed to fetch users' });
    }
}