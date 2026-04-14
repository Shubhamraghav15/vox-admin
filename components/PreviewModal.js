// components/PreviewModal.js

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, FileText, Award, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle,
  Pencil, Check, XCircle, ExternalLink, Upload,
} from 'lucide-react';

// ─── Small helpers ────────────────────────────────────────────────────────────

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</span>
      {children}
    </div>
  );
}

function ReadText({ value, placeholder }) {
  return (
    <p className={`text-sm ${value ? 'text-white' : 'text-gray-600 italic'}`}>
      {value || placeholder}
    </p>
  );
}

// ─── PreviewModal ─────────────────────────────────────────────────────────────

const PreviewModal = ({ submission, user, onClose, onReject, onApprove, onSaved }) => {
  // ── All hooks must be declared before any early return ──────────────────
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [comments, setComments] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);

  const fileInputRef = useRef(null);

  // Sync form state whenever the submission prop changes
  useEffect(() => {
    if (!submission) return;
    setProjectTitle(submission.projectName || '');
    setInvoiceNumber(submission.invoiceNumber || '');
    setComments(submission.reviewerComments || '');
    setInvoiceUrl(submission.invoiceUrl || '');
    setInvoiceFile(null);
    setIsEditing(false);
    setSaveError('');
  }, [submission]);

  // ── Guard (after hooks) ──────────────────────────────────────────────────
  if (!submission || !user) return null;

  const photos = submission.photos || [];
  const isRejected = submission.status === 'rejected';
  const isApproved = submission.status === 'approved';

  // ── Photo navigation ─────────────────────────────────────────────────────
  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex((p) => (p + 1) % photos.length);
  };
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex((p) => (p - 1 + photos.length) % photos.length);
  };

  // ── Approve / Reject ─────────────────────────────────────────────────────
  const handleReject = async () => {
    setIsActionLoading(true);
    await onReject(submission._id);
    setIsActionLoading(false);
    onClose();
  };

  const handleApprove = async () => {
    setIsActionLoading(true);
    await onApprove(submission._id);
    setIsActionLoading(false);
    onClose();
  };

  // ── Edit / Cancel ────────────────────────────────────────────────────────
  const handleCancelEdit = () => {
    setProjectTitle(submission.projectName || '');
    setInvoiceNumber(submission.invoiceNumber || '');
    setComments(submission.reviewerComments || '');
    setInvoiceFile(null);
    setSaveError('');
    setIsEditing(false);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      // 1️⃣  Send the multipart update (PUT)
      const formData = new FormData();
      formData.append('projectName', projectTitle);
      formData.append('invoiceNumber', invoiceNumber);
      formData.append('reviewerComments', comments);
      if (invoiceFile) formData.append('invoice', invoiceFile);

      const putRes = await fetch(`/api/admin/submission/${submission._id}`, {
        method: 'PUT',
        body: formData,
        // Do NOT set Content-Type — browser sets it with the correct boundary
      });

      if (!putRes.ok) {
        const data = await putRes.json();
        throw new Error(data.message || 'Save failed');
      }

      // 2️⃣  Re-fetch the full, populated document from the backend
      //     so the modal and parent list are always in sync with DB truth.
      const getRes = await fetch(`/api/admin/submission/${submission._id}`);
      if (!getRes.ok) throw new Error('Failed to reload submission after save');
      const { submission: refreshed } = await getRes.json();

      // Sync local form state with whatever the server persisted
      setProjectTitle(refreshed.projectName || '');
      setInvoiceNumber(refreshed.invoiceNumber || '');
      setComments(refreshed.reviewerComments || '');
      setInvoiceFile(null);
      setIsEditing(false);
      setInvoiceUrl(refreshed.invoiceUrl || '');

      // Bubble up to parent so the card list re-renders too
      if (typeof onSaved === 'function') onSaved(refreshed);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-6xl bg-[#111] rounded-3xl overflow-hidden border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Close — anchored to the image panel's top-left ── */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* ── Left: image gallery ── */}
          <div className="flex-1 relative bg-[#050505] flex items-center justify-center group overflow-hidden">
            {photos.length > 0 ? (
              <>
                <motion.div
                  key={currentPhotoIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={photos[currentPhotoIndex]}
                    alt="Installation"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-contain"
                  />
                </motion.div>

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-4 p-3 bg-black/40 hover:bg-[#ff6a00] text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-4 p-3 bg-black/40 hover:bg-[#ff6a00] text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                      {photos.map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-[#ff6a00] w-6' : 'bg-white/30 w-2'
                            }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-gray-700 italic">No photos available</div>
            )}
          </div>

          {/* ── Right: details panel ── */}
          <div className="w-full md:w-[26rem] bg-[#111] p-8 flex flex-col border-l border-[#222] overflow-y-auto">

            {/* ── Header row: title + pencil ── */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#ff6a00]/50 focus:border-[#ff6a00] outline-none p-2 rounded-xl text-white text-xl font-bold"
                    placeholder="Project title"
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-white truncate">
                    {projectTitle || 'Untitled Project'}
                  </h3>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <MapPin className="w-4 h-4 text-[#ff6a00] shrink-0" />
                  <span>{submission.city || 'No City'}</span>
                  {submission.area && (
                    <>
                      <span className="w-1 h-1 bg-gray-700 rounded-full" />
                      <span>{submission.area} sq.ft</span>
                    </>
                  )}
                </div>
              </div>

              {/* Pencil / cancel icon — no longer at risk of overlap */}
              <button
                onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
                title={isEditing ? 'Cancel editing' : 'Edit submission'}
                className={`shrink-0 p-2 rounded-full border transition-colors ${isEditing
                  ? 'bg-red-900/30 border-red-700/40 text-red-400 hover:bg-red-900/50'
                  : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:text-[#ff6a00] hover:border-[#ff6a00]/40'
                  }`}
              >
                {isEditing ? <XCircle className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-6 flex-1 mt-6">

              {/* ── Uploader info ── */}
              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Uploader Details
                </h4>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center text-[#ff6a00] font-bold shrink-0">
                      {(user.fullName || user.name || 'U')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.fullName || user.name || 'Unknown'}</p>
                      <p className="text-[10px] text-gray-500">{user.phone}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#222] space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Team</span>
                      <span className="text-white font-medium">{user.teamName || 'No Team'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Total Points</span>
                      <span className="text-[#ff6a00] font-bold">{user.points || 0}</span>
                    </div>
                    {user.rejects > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Rejections</span>
                        <span className="text-red-500 font-bold">{user.rejects}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Submission notes (read-only) ── */}
              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Notes</h4>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222] min-h-[72px]">
                  <p className="text-sm text-gray-300 leading-relaxed italic">
                    {submission.notes ? `"${submission.notes}"` : 'No notes provided for this submission.'}
                  </p>
                </div>
              </section>

              {/* ── Admin-controlled fields ── */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Reviewer Controls
                </h4>

                {/* Invoice number */}
                <FieldRow label="Invoice Number">
                  {isEditing ? (
                    <input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-[#ff6a00] outline-none p-3 rounded-xl text-white text-sm transition-colors"
                      placeholder="e.g. INV-20240501"
                    />
                  ) : (
                    <ReadText value={invoiceNumber} placeholder="No invoice number" />
                  )}
                </FieldRow>

                {/* Invoice file */}
                <FieldRow label="Invoice File">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-dashed border-[#444] hover:border-[#ff6a00] text-gray-400 hover:text-[#ff6a00] rounded-xl text-xs transition-colors w-full"
                      >
                        <Upload className="w-4 h-4 shrink-0" />
                        {invoiceFile ? invoiceFile.name : 'Choose PDF or image…'}
                      </button>
                      {/* Keep existing link even while editing */}
                      {invoiceUrl && !invoiceFile && (
                        <a
                          href={invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-[#ff6a00] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View current invoice
                        </a>
                      )}
                    </div>
                  ) : submission.invoiceUrl ? (
                    <a
                      href={submission.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-[#ff6a00] hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Invoice
                    </a>
                  ) : (
                    <ReadText value="" placeholder="No invoice uploaded" />
                  )}
                </FieldRow>

                {/* Reviewer comments */}
                <FieldRow label="Reviewer Comments">
                  {isEditing ? (
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-[#ff6a00] outline-none p-3 rounded-xl text-white text-sm resize-none transition-colors"
                      placeholder="Add reviewer comments…"
                    />
                  ) : (
                    <ReadText value={comments} placeholder="No comments yet" />
                  )}
                </FieldRow>

                {/* Save / cancel when editing */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-2 pt-1"
                    >
                      {saveError && (
                        <p className="text-xs text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {saveError}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ff6a00] hover:bg-[#e05e00] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Save Update
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-50 text-gray-400 text-xs font-bold rounded-xl border border-[#333] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </div>

            {/* ── Approve / Reject actions ── */}
            <div className="mt-8 pt-8 border-t border-[#222] space-y-3">
              {!isApproved && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApprove}
                  disabled={isActionLoading || isSaving}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                >
                  {isActionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Award className="w-5 h-5" />
                      Approve Submission
                    </>
                  )}
                </motion.button>
              )}

              {isRejected ? (
                <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-2xl flex items-center gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-medium">
                    This submission has been rejected and is hidden from the user&apos;s dashboard.
                  </p>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  disabled={isActionLoading || isSaving}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                >
                  {isActionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Reject Submission
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreviewModal;

// import React, { useState, useEffect, useRef } from 'react';
// import Image from 'next/image';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   X, MapPin, FileText, Award, Trash2,
//   ChevronLeft, ChevronRight, AlertTriangle,
//   Pencil, Check, XCircle, ExternalLink, Upload,
// } from 'lucide-react';

// // ─── Small helpers ────────────────────────────────────────────────────────────

// function FieldRow({ label, children }) {
//   return (
//     <div className="flex flex-col gap-1">
//       <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</span>
//       {children}
//     </div>
//   );
// }

// function ReadText({ value, placeholder }) {
//   return (
//     <p className={`text-sm ${value ? 'text-white' : 'text-gray-600 italic'}`}>
//       {value || placeholder}
//     </p>
//   );
// }

// // ─── PreviewModal ─────────────────────────────────────────────────────────────

// const PreviewModal = ({ submission, user, onClose, onReject, onApprove, onSaved }) => {
//   // ── All hooks must be declared before any early return ──────────────────
//   const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
//   const [isActionLoading, setIsActionLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [saveError, setSaveError] = useState('');

//   const [isEditing, setIsEditing] = useState(false);
//   const [projectTitle, setProjectTitle] = useState('');
//   const [invoiceNumber, setInvoiceNumber] = useState('');
//   const [comments, setComments] = useState('');
//   const [invoiceFile, setInvoiceFile] = useState(null);

//   const fileInputRef = useRef(null);

//   // Sync form state whenever the submission prop changes
//   useEffect(() => {
//     if (!submission) return;
//     setProjectTitle(submission.projectName || '');
//     setInvoiceNumber(submission.invoiceNumber || '');
//     setComments(submission.reviewerComments || '');
//     setInvoiceFile(null);
//     setIsEditing(false);
//     setSaveError('');
//   }, [submission]);

//   // ── Guard (after hooks) ──────────────────────────────────────────────────
//   if (!submission || !user) return null;

//   const photos = submission.photos || [];
//   const isRejected = submission.status === 'rejected';
//   const isApproved = submission.status === 'approved';

//   // ── Photo navigation ─────────────────────────────────────────────────────
//   const handleNext = (e) => {
//     e.stopPropagation();
//     setCurrentPhotoIndex((p) => (p + 1) % photos.length);
//   };
//   const handlePrev = (e) => {
//     e.stopPropagation();
//     setCurrentPhotoIndex((p) => (p - 1 + photos.length) % photos.length);
//   };

//   // ── Approve / Reject ─────────────────────────────────────────────────────
//   const handleReject = async () => {
//     setIsActionLoading(true);
//     await onReject(submission._id);
//     setIsActionLoading(false);
//     onClose();
//   };

//   const handleApprove = async () => {
//     setIsActionLoading(true);
//     await onApprove(submission._id);
//     setIsActionLoading(false);
//     onClose();
//   };

//   // ── Edit / Cancel ────────────────────────────────────────────────────────
//   const handleCancelEdit = () => {
//     setProjectTitle(submission.projectName || '');
//     setInvoiceNumber(submission.invoiceNumber || '');
//     setComments(submission.reviewerComments || '');
//     setInvoiceFile(null);
//     setSaveError('');
//     setIsEditing(false);
//   };

//   // ── Save ─────────────────────────────────────────────────────────────────
//   const handleSave = async () => {
//     setIsSaving(true);
//     setSaveError('');

//     try {
//       // 1️⃣  Send the multipart update (PUT)
//       const formData = new FormData();
//       formData.append('projectName', projectTitle);
//       formData.append('invoiceNumber', invoiceNumber);
//       formData.append('reviewerComments', comments);
//       if (invoiceFile) formData.append('invoice', invoiceFile);

//       const putRes = await fetch(`/api/admin/submission/${submission._id}`, {
//         method: 'PUT',
//         body: formData,
//         // Do NOT set Content-Type — browser sets it with the correct boundary
//       });

//       if (!putRes.ok) {
//         const data = await putRes.json();
//         throw new Error(data.message || 'Save failed');
//       }

//       // 2️⃣  Re-fetch the full, populated document from the backend
//       //     so the modal and parent list are always in sync with DB truth.
//       const getRes = await fetch(`/api/admin/submission/${submission._id}`);
//       if (!getRes.ok) throw new Error('Failed to reload submission after save');
//       const { submission: refreshed } = await getRes.json();

//       // Sync local form state with whatever the server persisted
//       setProjectTitle(refreshed.projectName || '');
//       setInvoiceNumber(refreshed.invoiceNumber || '');
//       setComments(refreshed.reviewerComments || '');
//       setInvoiceFile(null);
//       setIsEditing(false);

//       // Bubble up to parent so the card list re-renders too
//       if (typeof onSaved === 'function') onSaved(refreshed);
//     } catch (err) {
//       setSaveError(err.message);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden"
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ scale: 0.9, opacity: 0, y: 20 }}
//           animate={{ scale: 1, opacity: 1, y: 0 }}
//           exit={{ scale: 0.9, opacity: 0, y: 20 }}
//           className="relative w-full max-w-6xl bg-[#111] rounded-3xl overflow-hidden border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-[90vh]"
//           onClick={(e) => e.stopPropagation()}
//         >
//           {/* ── Close ── */}
//           <button
//             onClick={onClose}
//             className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
//           >
//             <X className="w-6 h-6" />
//           </button>

//           {/* ── Left: image gallery ── */}
//           <div className="flex-1 relative bg-[#050505] flex items-center justify-center group overflow-hidden">
//             {photos.length > 0 ? (
//               <>
//                 <motion.div
//                   key={currentPhotoIndex}
//                   initial={{ opacity: 0, x: 20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   className="relative w-full h-full"
//                 >
//                   <Image
//                     src={photos[currentPhotoIndex]}
//                     alt="Installation"
//                     fill
//                     referrerPolicy="no-referrer"
//                     className="object-contain"
//                   />
//                 </motion.div>

//                 {photos.length > 1 && (
//                   <>
//                     <button
//                       onClick={handlePrev}
//                       className="absolute left-4 p-3 bg-black/40 hover:bg-[#ff6a00] text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
//                     >
//                       <ChevronLeft className="w-6 h-6" />
//                     </button>
//                     <button
//                       onClick={handleNext}
//                       className="absolute right-4 p-3 bg-black/40 hover:bg-[#ff6a00] text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
//                     >
//                       <ChevronRight className="w-6 h-6" />
//                     </button>
//                     <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
//                       {photos.map((_, i) => (
//                         <div
//                           key={i}
//                           className={`h-2 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-[#ff6a00] w-6' : 'bg-white/30 w-2'
//                             }`}
//                         />
//                       ))}
//                     </div>
//                   </>
//                 )}
//               </>
//             ) : (
//               <div className="text-gray-700 italic">No photos available</div>
//             )}

//             {!isRejected && (
//               <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity flex flex-col items-center">
//                 <ChevronLeft className="w-10 h-10 text-red-500 animate-pulse" />
//                 <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest mt-2">
//                   Swipe left to reject
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* ── Right: details panel ── */}
//           <div className="w-full md:w-[26rem] bg-[#111] p-8 flex flex-col border-l border-[#222] overflow-y-auto">

//             {/* ── Header row: title + pencil ── */}
//             <div className="flex items-start justify-between gap-3 mb-2">
//               <div className="flex-1 min-w-0">
//                 {isEditing ? (
//                   <input
//                     value={projectTitle}
//                     onChange={(e) => setProjectTitle(e.target.value)}
//                     className="w-full bg-[#1a1a1a] border border-[#ff6a00]/50 focus:border-[#ff6a00] outline-none p-2 rounded-xl text-white text-xl font-bold"
//                     placeholder="Project title"
//                   />
//                 ) : (
//                   <h3 className="text-2xl font-bold text-white truncate">
//                     {projectTitle || 'Untitled Project'}
//                   </h3>
//                 )}
//                 <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
//                   <MapPin className="w-4 h-4 text-[#ff6a00] shrink-0" />
//                   <span>{submission.city || 'No City'}</span>
//                   {submission.area && (
//                     <>
//                       <span className="w-1 h-1 bg-gray-700 rounded-full" />
//                       <span>{submission.area} sq.ft</span>
//                     </>
//                   )}
//                 </div>
//               </div>

//               {/* Pencil / cancel icon */}
//               <button
//                 onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
//                 title={isEditing ? 'Cancel editing' : 'Edit submission'}
//                 className={`shrink-0 p-2 rounded-full border transition-colors ${isEditing
//                     ? 'bg-red-900/30 border-red-700/40 text-red-400 hover:bg-red-900/50'
//                     : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:text-[#ff6a00] hover:border-[#ff6a00]/40'
//                   }`}
//               >
//                 {isEditing ? <XCircle className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
//               </button>
//             </div>

//             <div className="space-y-6 flex-1 mt-6">

//               {/* ── Uploader info ── */}
//               <section>
//                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
//                   Uploader Details
//                 </h4>
//                 <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222] space-y-3">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center text-[#ff6a00] font-bold shrink-0">
//                       {(user.fullName || user.name || 'U')[0]}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-white">{user.fullName || user.name || 'Unknown'}</p>
//                       <p className="text-[10px] text-gray-500">{user.phone}</p>
//                     </div>
//                   </div>
//                   <div className="pt-2 border-t border-[#222] space-y-2">
//                     <div className="flex justify-between text-xs">
//                       <span className="text-gray-500">Team</span>
//                       <span className="text-white font-medium">{user.teamName || 'No Team'}</span>
//                     </div>
//                     <div className="flex justify-between text-xs">
//                       <span className="text-gray-500">Total Points</span>
//                       <span className="text-[#ff6a00] font-bold">{user.points || 0}</span>
//                     </div>
//                     {user.rejects > 0 && (
//                       <div className="flex justify-between text-xs">
//                         <span className="text-gray-500">Rejections</span>
//                         <span className="text-red-500 font-bold">{user.rejects}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </section>

//               {/* ── Submission notes (read-only) ── */}
//               <section>
//                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Notes</h4>
//                 <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222] min-h-[72px]">
//                   <p className="text-sm text-gray-300 leading-relaxed italic">
//                     {submission.notes ? `"${submission.notes}"` : 'No notes provided for this submission.'}
//                   </p>
//                 </div>
//               </section>

//               {/* ── Admin-controlled fields ── */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
//                   Reviewer Controls
//                 </h4>

//                 {/* Invoice number */}
//                 <FieldRow label="Invoice Number">
//                   {isEditing ? (
//                     <input
//                       value={invoiceNumber}
//                       onChange={(e) => setInvoiceNumber(e.target.value)}
//                       className="w-full bg-[#1a1a1a] border border-[#333] focus:border-[#ff6a00] outline-none p-3 rounded-xl text-white text-sm transition-colors"
//                       placeholder="e.g. INV-20240501"
//                     />
//                   ) : (
//                     <ReadText value={invoiceNumber} placeholder="No invoice number" />
//                   )}
//                 </FieldRow>

//                 {/* Invoice file */}
//                 <FieldRow label="Invoice File">
//                   {isEditing ? (
//                     <div className="space-y-2">
//                       <input
//                         ref={fileInputRef}
//                         type="file"
//                         accept=".pdf,image/*"
//                         className="hidden"
//                         onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
//                       />
//                       <button
//                         onClick={() => fileInputRef.current?.click()}
//                         className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-dashed border-[#444] hover:border-[#ff6a00] text-gray-400 hover:text-[#ff6a00] rounded-xl text-xs transition-colors w-full"
//                       >
//                         <Upload className="w-4 h-4 shrink-0" />
//                         {invoiceFile ? invoiceFile.name : 'Choose PDF or image…'}
//                       </button>
//                       {/* Keep existing link even while editing */}
//                       {submission.invoiceUrl && !invoiceFile && (
//                         <a
//                           href={submission.invoiceUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="flex items-center gap-1.5 text-[11px] text-[#ff6a00] hover:underline"
//                         >
//                           <ExternalLink className="w-3 h-3" />
//                           View current invoice
//                         </a>
//                       )}
//                     </div>
//                   ) : submission.invoiceUrl ? (
//                     <a
//                       href={submission.invoiceUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="flex items-center gap-1.5 text-sm text-[#ff6a00] hover:underline"
//                     >
//                       <ExternalLink className="w-4 h-4" />
//                       View Invoice
//                     </a>
//                   ) : (
//                     <ReadText value="" placeholder="No invoice uploaded" />
//                   )}
//                 </FieldRow>

//                 {/* Reviewer comments */}
//                 <FieldRow label="Reviewer Comments">
//                   {isEditing ? (
//                     <textarea
//                       value={comments}
//                       onChange={(e) => setComments(e.target.value)}
//                       rows={3}
//                       className="w-full bg-[#1a1a1a] border border-[#333] focus:border-[#ff6a00] outline-none p-3 rounded-xl text-white text-sm resize-none transition-colors"
//                       placeholder="Add reviewer comments…"
//                     />
//                   ) : (
//                     <ReadText value={comments} placeholder="No comments yet" />
//                   )}
//                 </FieldRow>

//                 {/* Save / cancel when editing */}
//                 <AnimatePresence>
//                   {isEditing && (
//                     <motion.div
//                       initial={{ opacity: 0, y: -8 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -8 }}
//                       className="space-y-2 pt-1"
//                     >
//                       {saveError && (
//                         <p className="text-xs text-red-400 flex items-center gap-1.5">
//                           <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
//                           {saveError}
//                         </p>
//                       )}

//                       <div className="flex gap-2">
//                         <button
//                           onClick={handleSave}
//                           disabled={isSaving}
//                           className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ff6a00] hover:bg-[#e05e00] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
//                         >
//                           {isSaving ? (
//                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                           ) : (
//                             <>
//                               <Check className="w-4 h-4" />
//                               Save Update
//                             </>
//                           )}
//                         </button>

//                         <button
//                           onClick={handleCancelEdit}
//                           disabled={isSaving}
//                           className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-50 text-gray-400 text-xs font-bold rounded-xl border border-[#333] transition-colors"
//                         >
//                           Cancel
//                         </button>
//                       </div>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </section>
//             </div>

//             {/* ── Approve / Reject actions ── */}
//             <div className="mt-8 pt-8 border-t border-[#222] space-y-3">
//               {!isApproved && (
//                 <motion.button
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   onClick={handleApprove}
//                   disabled={isActionLoading || isSaving}
//                   className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
//                 >
//                   {isActionLoading ? (
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   ) : (
//                     <>
//                       <Award className="w-5 h-5" />
//                       Approve Submission
//                     </>
//                   )}
//                 </motion.button>
//               )}

//               {isRejected ? (
//                 <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-2xl flex items-center gap-3 text-red-400">
//                   <AlertTriangle className="w-5 h-5 shrink-0" />
//                   <p className="text-xs font-medium">
//                     This submission has been rejected and is hidden from the user&apos;s dashboard.
//                   </p>
//                 </div>
//               ) : (
//                 <motion.button
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   onClick={handleReject}
//                   disabled={isActionLoading || isSaving}
//                   className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20"
//                 >
//                   {isActionLoading ? (
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   ) : (
//                     <>
//                       <Trash2 className="w-5 h-5" />
//                       Reject Submission
//                     </>
//                   )}
//                 </motion.button>
//               )}
//             </div>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// };

// export default PreviewModal;