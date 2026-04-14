/**
 * GET  /api/admin/submission/[id]  — fetch full submission + populated user
 * PUT  /api/admin/submission/[id]  — edit fields + optional S3 invoice upload
 *
 * bodyParser must be disabled globally for this route so multer can
 * handle the multipart stream on PUT. The GET branch reads nothing from
 * the body so this has no side-effects on reads.
 */

import dbConnect from '../../../../lib/db';
import Upload from '../../../../lib/Upload';
import { runMiddleware } from '../../../../middleware/upload';

export const config = {
    api: {
        bodyParser: false, // required for multer on PUT
    },
};

export default async function handler(req, res) {
    const { id } = req.query;

    // ── Admin guard (plug in your auth check here) ───────────────────────────
    // const session = await getServerSession(req, res, authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Forbidden' });
    // }

    await dbConnect();

    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
        try {
            const submission = await Upload.findById(id).populate('user').lean();

            if (!submission) {
                return res.status(404).json({ message: 'Submission not found' });
            }

            return res.status(200).json({ success: true, submission });
        } catch (error) {
            console.error('[GET submission]', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    // ── PUT ──────────────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
        // Parse multipart — multer-s3 uploads the file to S3 if present
        try {
            await runMiddleware(req, res, 'single', 'invoice');
        } catch (uploadError) {
            return res.status(400).json({ message: uploadError.message });
        }

        try {
            const submission = await Upload.findById(id);

            if (!submission) {
                return res.status(404).json({ message: 'Submission not found' });
            }

            // Apply text fields only when explicitly provided
            const { projectName, invoiceNumber, reviewerComments } = req.body ?? {};

            if (projectName !== undefined) submission.projectName = projectName;
            if (invoiceNumber !== undefined) submission.invoiceNumber = invoiceNumber;
            if (reviewerComments !== undefined) submission.reviewerComments = reviewerComments;

            // S3 URL is set by multer-s3 on req.file.location
            if (req.file?.location) {
                submission.invoiceUrl = req.file.location;
            }

            await submission.save();

            // Return the fresh, fully-populated document so the UI stays in sync
            const updated = await Upload.findById(id).populate('user').lean();

            return res.status(200).json({ success: true, submission: updated });
        } catch (error) {
            console.error('[PUT submission]', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}