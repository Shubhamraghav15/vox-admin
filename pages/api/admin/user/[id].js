/**
 * PATCH /api/admin/user/[id]/block
 *
 * Body (JSON): { block: boolean }
 *   block: true  → permanently block the user
 *   block: false → lift the ban
 *
 * Returns the updated user document.
 */

import dbConnect from '../../../../lib/db';
import User from '../../../../lib/User';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // ── Admin guard ──────────────────────────────────────────────────────────
    // const session = await getServerSession(req, res, authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Forbidden' });
    // }

    const { id } = req.query;
    const { block } = req.body ?? {};

    if (typeof block !== 'boolean') {
        return res.status(400).json({ message: '`block` (boolean) is required in the request body' });
    }

    try {
        await dbConnect();

        const user = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: block,
                blockedAt: block ? new Date() : null,
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            isBlocked: user.isBlocked,
            user,
        });
    } catch (error) {
        console.error('[PATCH block]', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}