// components/BlockUserButton.jsx

import { useState } from "react";

export default function BlockUserButton({ user, onUpdate }) {
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        const action = user.isBlocked ? "unblock" : "block";
        const confirmed = window.confirm(
            user.isBlocked
                ? `Unblock ${user.name || user.phone}? They will be able to log in again.`
                : `Block ${user.name || user.phone}? They will be immediately locked out.`
        );
        if (!confirmed) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/user/${user._id}/block`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ block: !user.isBlocked }),
            });

            if (!res.ok) throw new Error("Request failed");
            const data = await res.json();

            // Bubble updated user up to parent so UI stays in sync
            onUpdate({ ...user, isBlocked: data.isBlocked });
        } catch (err) {
            alert("Failed to update block status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${user.isBlocked
                    ? "bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30"
                    : "bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/30"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {loading ? (
                <span className="animate-pulse">
                    {user.isBlocked ? "Unblocking..." : "Blocking..."}
                </span>
            ) : user.isBlocked ? (
                <>🔓 Unblock User</>
            ) : (
                <>🚫 Block User</>
            )}
        </button>
    );
}