/**
 * POST /api/admin/reject/[id]
 *
 * Body (JSON): { reviewerComments?: string }
 *
 * 1. Marks submission as rejected
 * 2. Saves reviewer comments
 * 3. Deducts points / increments rejects on the user
 * 4. Sends an SMS notification via Twilio (or swap for push)
 */

import dbConnect from '../../../../lib/db';
import Upload from '../../../../lib/Upload';
import User from '../../../../lib/User';
import twilio from 'twilio';
const REJECTION_PENALTY = 50;

// ── Notification helper ──────────────────────────────────────────────────────
// Replace with your preferred provider (Twilio, Firebase, etc.)
// The function is intentionally non-blocking — a notification failure
// must not roll back the rejection itself.
async function sendRejectionNotification({ phone, projectName, comments }) {
    try {
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const body = comments
            ? `VOX Master Installer: Your submission "${projectName}" was rejected.\nReviewer note: ${comments}\nPlease review and resubmit.`
            : `VOX Master Installer: Your recent submission "${projectName}" REJECTED on VOX Master Installer App. Please reach out to VOX Support Team on VOX App.`;
        // Your recent submission was REJECTED on VOX Master Installer App. Please reach out to VOX Support Team on VOX App.
        await client.messages.create({
            body,
            from: process.env.TWILIO_FROM_NUMBER,
            to: phone,   // already E.164 format (+91XXXXXXXXXX) from your auth flow
        });

        console.log(`[SMS] Rejection notice sent to ${phone}`);
    } catch (err) {
        console.error('[SMS] Failed to send rejection notice:', err.message);
    }
}

// ── Route handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // ── Admin guard ──────────────────────────────────────────────────────────
    // const session = await getServerSession(req, res, authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Forbidden' });
    // }

    const { id } = req.query;
    const { reviewerComments = '' } = req.body ?? {};

    try {
        await dbConnect();

        const upload = await Upload.findById(id);
        if (!upload) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Already rejected — just update comments if supplied and return
        if (upload.status === 'rejected') {
            if (reviewerComments) {
                upload.reviewerComments = reviewerComments;
                await upload.save();
            }
            return res.status(200).json({
                success: true,
                upload,
                message: 'Already rejected',
                delta: 0,
            });
        }

        // ── Apply rejection ──────────────────────────────────────────────────
        const oldStatus = upload.status;
        upload.status = 'rejected';
        if (reviewerComments) upload.reviewerComments = reviewerComments;
        await upload.save();

        // ── Update user stats ────────────────────────────────────────────────
        const user = await User.findByIdAndUpdate(
            upload.user,
            {
                $inc: {
                    rejects: 1,
                    points: -REJECTION_PENALTY,
                    // Undo the approval bonus if it was previously approved
                    ...(oldStatus === 'approved' ? {} : {}),
                },
            },
            { new: true }
        );

        // ── Send notification ────────────────────────────────────────────────
        if (user?.phone) {
            await sendRejectionNotification({
                phone: user.phone,
                projectName: upload.projectName || 'your submission',
                comments: reviewerComments,
            });
        }

        return res.status(200).json({
            success: true,
            upload,
            user,
            delta: -REJECTION_PENALTY,
        });
    } catch (error) {
        console.error('Error rejecting submission:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}