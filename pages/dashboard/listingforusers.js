import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, RefreshCw, LogOut, Users, Shield,
    ShieldOff, Phone, MapPin, AlertCircle,
    CheckCircle2, Calendar, UserX, Clock, LayoutDashboard
} from 'lucide-react';

// ── Date helpers ──────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
}

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d) { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x; }

function groupByDate(users) {
    const now = new Date();
    const today = startOfDay(now);
    const yday = new Date(today); yday.setDate(yday.getDate() - 1);
    const week = startOfWeek(now);

    const buckets = new Map();
    for (const u of users) {
        const d = new Date(u.createdAt);
        let label;
        if (d >= today) label = 'Today';
        else if (d >= yday) label = 'Yesterday';
        else if (d >= week) label = 'This Week';
        else label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        if (!buckets.has(label)) buckets.set(label, []);
        buckets.get(label).push(u);
    }
    return buckets;
}

// ── User card ─────────────────────────────────────────────────────────────────
function UserCard({ user, onBlock, index }) {
    const initials = (user.fullName || user.name || '?')
        .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const isNew = Date.now() - new Date(user.createdAt).getTime() < 86400000;
    const rejected = user.rejectCount ?? 0;
    const uploads = user.uploadCount ?? 0;
    const pct = uploads > 0 ? Math.round((rejected / uploads) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
            className={`relative bg-[#111] rounded-2xl border p-4 flex flex-col gap-3
        hover:border-[#333] transition-all group
        ${user.isBlocked ? 'border-red-900/40 opacity-60' : 'border-[#222]'}`}
        >
            {/* NEW badge */}
            {isNew && !user.isBlocked && (
                <span className="absolute top-3 right-3 text-[9px] font-black tracking-widest uppercase
          bg-[#ff6a00]/15 text-[#ff6a00] border border-[#ff6a00]/25 px-2 py-0.5 rounded-full">
                    NEW
                </span>
            )}

            {/* BLOCKED badge */}
            {user.isBlocked && (
                <span className="absolute top-3 right-3 text-[9px] font-black tracking-widest uppercase
          bg-red-950/60 text-red-400 border border-red-900/40 px-2 py-0.5 rounded-full
          flex items-center gap-1">
                    <UserX className="w-3 h-3" /> BLOCKED
                </span>
            )}

            {/* Avatar + name */}
            <div className="flex items-center gap-3 pr-16">
                <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center
          justify-center shrink-0 text-sm font-black text-[#ff6a00]">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-tight truncate">
                        {user.fullName || user.name || <span className="text-gray-600 italic font-normal">No name</span>}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-600 shrink-0" />
                        <span className="text-xs text-gray-400 font-mono tracking-tight truncate">{user.phone}</span>
                    </div>
                </div>
            </div>

            {/* City */}
            {user.city && (
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{user.city}</span>
                </div>
            )}

            {/* Joined date */}
            <div className="flex items-start gap-2 bg-[#0a0a0a] rounded-xl px-3 py-2.5 border border-[#1a1a1a]">
                <Calendar className="w-3.5 h-3.5 text-[#ff6a00] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">Joined</p>
                    <p className="text-xs text-white font-bold">{formatDate(user.createdAt)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>{formatTime(user.createdAt)}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-[#ff6a00]/70">{timeAgo(user.createdAt)}</span>
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 border-t border-[#1a1a1a] pt-3">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">Uploads</span>
                    <span className="text-sm font-black text-white">{uploads}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">Points</span>
                    <span className="text-sm font-black text-[#ff6a00]">{user.points ?? 0}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">Rejected</span>
                    <span className={`text-sm font-black ${rejected > 0 ? 'text-red-400' : 'text-gray-700'}`}>
                        {rejected}
                    </span>
                    {rejected > 0 ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide
              bg-red-950/30 text-red-400 border border-red-900/25 rounded-md px-1.5 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {pct}%
                        </span>
                    ) : (
                        <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide
              bg-white/[0.03] text-gray-700 border border-[#222] rounded-md px-1.5 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#333] shrink-0" />
                            Clean
                        </span>
                    )}
                </div>
            </div>

            {/* Profile incomplete */}
            {!user.profileComplete && (
                <p className="text-[10px] text-yellow-700 font-semibold tracking-wide">⚠ Profile incomplete</p>
            )}

            {/* Block/Unblock — always visible on touch, hover-only on desktop */}
            <button
                onClick={() => onBlock(user)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold
          transition-all min-h-[40px]
          ${user.isBlocked
                        ? 'bg-green-950/40 text-green-400 border border-green-900/30 hover:bg-green-950/70'
                        : 'sm:opacity-0 sm:group-hover:opacity-100 opacity-100 bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-950/70'
                    }`}
            >
                {user.isBlocked
                    ? <><Shield className="w-3.5 h-3.5" /> UNBLOCK</>
                    : <><ShieldOff className="w-3.5 h-3.5" /> BLOCK</>
                }
            </button>
        </motion.div>
    );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ user, onConfirm, onCancel }) {
    if (!user) return null;

    const isBlocking = !user.isBlocked;
    const displayName = user.fullName || user.name || user.phone;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="bg-[#111] border border-[#222] rounded-t-3xl sm:rounded-3xl p-8 w-full sm:max-w-sm shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Drag handle for mobile sheet feel */}
                    <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-6 sm:hidden" />

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5
            ${isBlocking ? 'bg-red-950/40 border border-red-900/30' : 'bg-green-950/40 border border-green-900/30'}`}>
                        {isBlocking
                            ? <ShieldOff className="w-6 h-6 text-red-400" />
                            : <Shield className="w-6 h-6 text-green-400" />
                        }
                    </div>

                    <h2 className="text-white font-black text-lg text-center mb-2">
                        {isBlocking ? 'Block User?' : 'Unblock User?'}
                    </h2>
                    <p className="text-gray-500 text-sm text-center leading-relaxed mb-1">
                        {isBlocking
                            ? 'This user will lose access to the platform.'
                            : 'This user will regain access to the platform.'
                        }
                    </p>
                    <p className="text-center mb-8">
                        <span className="text-xs font-bold text-gray-400 bg-[#1a1a1a] border border-[#2a2a2a]
              px-3 py-1 rounded-full inline-block truncate max-w-[220px]">
                            {displayName}
                        </span>
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-gray-400 bg-[#1a1a1a]
                border border-[#2a2a2a] hover:border-[#333] hover:text-white transition-all min-h-[48px]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center
                justify-center gap-2 min-h-[48px]
                ${isBlocking
                                    ? 'bg-red-950/60 text-red-400 border border-red-900/40 hover:bg-red-950/90'
                                    : 'bg-green-950/60 text-green-400 border border-green-900/40 hover:bg-green-950/90'
                                }`}
                        >
                            {isBlocking
                                ? <><ShieldOff className="w-4 h-4" /> Block</>
                                : <><Shield className="w-4 h-4" /> Unblock</>
                            }
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Date section header ───────────────────────────────────────────────────────
function SectionHeader({ label, count }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{label}</span>
            <span className="text-xs text-gray-600 font-bold bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-[#222]">
                {count}
            </span>
            <div className="flex-1 h-px bg-[#1e1e1e]" />
        </div>
    );
}

// ── Date range presets ────────────────────────────────────────────────────────
const DATE_PRESETS = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'Month' },
    { id: 'custom', label: 'Custom' },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [datePreset, setDatePreset] = useState('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [showBlocked, setShowBlocked] = useState(true);
    const [toast, setToast] = useState(null);
    const [confirmUser, setConfirmUser] = useState(null);
    const router = useRouter();

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { data } = await axios.get('/api/admin/users');
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setUsers(data);
        } catch {
            setError('Failed to load users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
            if (isLoggedIn !== 'true') router.push('/');
            else fetchUsers();
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('isAdminLoggedIn');
        router.push('/');
    };

    const handleBlock = (user) => setConfirmUser(user);

    const handleConfirmBlock = async () => {
        const user = confirmUser;
        setConfirmUser(null);
        try {
            const res = await axios.patch(`/api/admin/user/${user._id}`, { block: !user.isBlocked });
            if (res.data.success) {
                setUsers(prev => prev.map(u =>
                    u._id === user._id ? { ...u, isBlocked: res.data.isBlocked } : u
                ));
                showToast(`User ${res.data.isBlocked ? 'blocked' : 'unblocked'} successfully`);
            }
        } catch {
            showToast('Failed to update block status', 'error');
        }
    };

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: users.length,
            active: users.filter(u => !u.isBlocked).length,
            today: users.filter(u => new Date(u.createdAt) >= startOfDay(now)).length,
            thisWeek: users.filter(u => new Date(u.createdAt) >= startOfWeek(now)).length,
            thisMonth: users.filter(u => new Date(u.createdAt) >= startOfMonth(now)).length,
        };
    }, [users]);

    // ── Filtered list ──────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...users];
        const now = new Date();

        if (datePreset === 'today') list = list.filter(u => new Date(u.createdAt) >= startOfDay(now));
        if (datePreset === 'week') list = list.filter(u => new Date(u.createdAt) >= startOfWeek(now));
        if (datePreset === 'month') list = list.filter(u => new Date(u.createdAt) >= startOfMonth(now));
        if (datePreset === 'custom' && customFrom) {
            const from = new Date(customFrom); from.setHours(0, 0, 0, 0);
            const to = customTo ? new Date(customTo) : new Date();
            to.setHours(23, 59, 59, 999);
            list = list.filter(u => {
                const d = new Date(u.createdAt);
                return d >= from && d <= to;
            });
        }

        if (!showBlocked) list = list.filter(u => !u.isBlocked);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(u =>
                (u.fullName || '').toLowerCase().includes(q) ||
                (u.name || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q) ||
                (u.city || '').toLowerCase().includes(q)
            );
        }

        return list;
    }, [users, datePreset, customFrom, customTo, showBlocked, searchQuery]);

    const grouped = useMemo(() => groupByDate(filtered), [filtered]);

    // ── Loading ────────────────────────────────────────────────────────────────
    if (isLoading && users.length === 0) {
        return (
            <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-[#ff6a00]/20 border-t-[#ff6a00] rounded-full mb-4"
                />
                <p className="text-[#ff6a00] font-bold tracking-widest text-xs uppercase">Loading Users…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">

            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-30 bg-[#111]/90 backdrop-blur-md border-b border-[#222]">
                {/* Top row */}
                <div className="flex items-center justify-between px-4 sm:px-8 h-14 sm:h-20">
                    {/* Left: title */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6a00]" />
                        <h1 className="text-xs sm:text-sm font-black tracking-widest uppercase text-white">All Users</h1>
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-[#ff6a00]/10 border border-[#ff6a00]/20
              text-[#ff6a00] text-xs font-bold">{stats.total}</span>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2">
                        {/* Search — hidden on mobile, shown in row below */}
                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500
                group-focus-within:text-[#ff6a00] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search name, phone, city…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-56 lg:w-64 bg-[#0a0a0a] border border-[#222] rounded-xl py-2 pl-10 pr-4 text-sm
                  focus:outline-none focus:border-[#ff6a00]/50 focus:ring-4 focus:ring-[#ff6a00]/5 transition-all"
                            />
                        </div>

                        <button onClick={fetchUsers}
                            className="p-2 sm:p-2.5 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl
                transition-all text-gray-400 hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#ff6a00]' : ''}`} />
                        </button>

                        <div className="hidden sm:block h-8 w-px bg-[#222]" />

                        <button onClick={() => router.push('/dashboard')}
                            className="hidden sm:flex px-3 py-2 bg-[#1a1a1a] border border-[#222] text-gray-400 hover:text-white
                hover:border-[#333] rounded-xl text-xs font-bold transition-all items-center gap-1.5">
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">DASHBOARD</span>
                        </button>

                        {/* Mobile dashboard icon */}
                        <button onClick={() => router.push('/dashboard')}
                            className="sm:hidden p-2 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl
                transition-all text-gray-400 hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4" />
                        </button>

                        <button onClick={handleLogout}
                            className="flex items-center gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 bg-red-950/20 hover:bg-red-950/40
                text-red-500 border border-red-900/30 rounded-xl text-xs font-bold transition-all min-h-[36px]">
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">LOGOUT</span>
                        </button>
                    </div>
                </div>

                {/* Mobile search row */}
                <div className="sm:hidden px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search name, phone, city…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl py-2.5 pl-10 pr-4 text-sm
                focus:outline-none focus:border-[#ff6a00]/50 transition-all"
                        />
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

                {/* ── Stats bar ──────────────────────────────────────────────────────── */}
                {/* Mobile: 2x2 + 1 spanning; Tablet+: 5 cols */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {[
                        { label: 'Total Users', value: stats.total, color: '#ff6a00' },
                        { label: 'Active', value: stats.active, color: '#22c55e' },
                        { label: 'Today', value: stats.today, color: '#38bdf8' },
                        { label: 'This Week', value: stats.thisWeek, color: '#a78bfa' },
                        { label: 'This Month', value: stats.thisMonth, color: '#fb923c' },
                    ].map(({ label, value, color }, i) => (
                        <div key={label}
                            className={`bg-[#111] border border-[#222] rounded-2xl px-4 py-3 sm:px-5 sm:py-4
                ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
                            <p className="text-xl sm:text-2xl font-black" style={{ color }}>{value}</p>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5 leading-tight">{label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Filters row ────────────────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 mb-6 sm:mb-8">
                    {/* Date preset pills — horizontal scroll on mobile */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0
            scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-center gap-1 bg-[#111] border border-[#222] rounded-xl p-1 shrink-0">
                            {DATE_PRESETS.map(({ id, label }) => (
                                <button
                                    key={id}
                                    onClick={() => setDatePreset(id)}
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap
                    ${datePreset === id ? 'bg-[#ff6a00] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Blocked toggle — beside pills */}
                        <button
                            onClick={() => setShowBlocked(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0
                ${!showBlocked
                                    ? 'bg-[#1a1a1a] border-[#333] text-gray-300'
                                    : 'bg-[#111] border-[#222] text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <UserX className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">{showBlocked ? 'Show all' : 'Hide blocked'}</span>
                        </button>
                    </div>

                    {/* Custom date inputs */}
                    {datePreset === 'custom' && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="flex-1 min-w-[130px] bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-xs text-white
                  focus:outline-none focus:border-[#ff6a00]/50 [color-scheme:dark]"
                            />
                            <span className="text-gray-600 text-xs">→</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="flex-1 min-w-[130px] bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-xs text-white
                  focus:outline-none focus:border-[#ff6a00]/50 [color-scheme:dark]"
                            />
                        </div>
                    )}

                    {/* Count label */}
                    <span className="text-xs text-gray-600">
                        Showing <span className="text-white font-bold">{filtered.length}</span> of {users.length} users
                    </span>
                </div>

                {/* ── Cards grouped by date ──────────────────────────────────────────── */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 sm:py-40 text-center">
                        <Calendar className="w-12 h-12 sm:w-14 sm:h-14 text-gray-800 mb-4" />
                        <p className="text-gray-500 font-bold">No users found</p>
                        <p className="text-gray-700 text-sm mt-1">Try a different date range or search</p>
                    </div>
                ) : (
                    <div className="space-y-8 sm:space-y-10">
                        {[...grouped.entries()].map(([label, group]) => (
                            <div key={label}>
                                <SectionHeader label={label} count={group.length} />
                                {/* 1 col on xs, 2 col on sm, 3 on md, 4 on lg, 5 on xl */}
                                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                                    {group.map((user, i) => (
                                        <UserCard key={user._id} user={user} onBlock={handleBlock} index={i} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Confirm Modal ─────────────────────────────────────────────────────────── */}
            <ConfirmModal
                user={confirmUser}
                onConfirm={handleConfirmBlock}
                onCancel={() => setConfirmUser(null)}
            />

            {/* ── Toast ─────────────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed bottom-6 left-3 right-3 sm:left-auto sm:right-8 sm:w-auto z-[100] px-5 py-3.5 rounded-2xl
              shadow-2xl flex items-center gap-3 border
              ${toast.type === 'success'
                                ? 'bg-green-950 border-green-900 text-green-400'
                                : 'bg-red-950 border-red-900 text-red-400'
                            }`}
                    >
                        {toast.type === 'success'
                            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                            : <AlertCircle className="w-5 h-5 shrink-0" />
                        }
                        <span className="text-sm font-bold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error overlay ─────────────────────────────────────────────────────── */}
            {error && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#111] p-6 sm:p-8 rounded-3xl border border-red-900/30 w-full max-w-md text-center">
                        <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-5" />
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Connection Error</h3>
                        <p className="text-gray-400 mb-6 sm:mb-8 text-sm">{error}</p>
                        <button onClick={fetchUsers}
                            className="w-full bg-[#ff6a00] text-white font-bold py-4 rounded-2xl hover:bg-[#ff7a1a] transition-all min-h-[52px]">
                            RETRY CONNECTION
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}