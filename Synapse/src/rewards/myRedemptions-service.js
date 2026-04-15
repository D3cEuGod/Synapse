import {
    collection, query, where, onSnapshot, doc, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


let currentUserId = null;

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        initRedemptionsPage();
    } else {
        window.location.href = "login.html";
    }
});

// Escapes a string for safe use inside a double-quoted HTML attribute
function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;");
}

// Sets up real-time listeners for vouchers and entitlements, and attaches
// delegated click handlers on the static container elements once.
function initRedemptionsPage() {
    if (!currentUserId) return;

    const voucherQuery = query(
        collection(db, "vouchers"),
        where("accountId", "==", currentUserId),
        where("status", "==", "ACTIVE")
    );

    onSnapshot(voucherQuery, (snapshot) => {
        handleExpiry(snapshot.docs);
        renderVouchers(snapshot.docs);
    });

    const entitlementQuery = query(
        collection(db, "Entitlements"),
        where("accountId", "==", currentUserId)
    );

    onSnapshot(entitlementQuery, (snapshot) => {
        renderEntitlements(snapshot.docs);
    });

    // Delegated listener for voucher "Use now" buttons
    const voucherContainer = document.getElementById("vouchers-list");
    if (voucherContainer) {
        voucherContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".use-voucher-btn");
            if (!btn) return;
            useVoucher(btn.dataset.voucherId, btn.dataset.voucherCode);
        });
    }

    // Delegated listener for entitlement "Mark Used" buttons
    const entitlementContainer = document.getElementById("entitlements-list");
    if (entitlementContainer) {
        entitlementContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".use-entitlement-btn");
            if (!btn) return;
            useEntitlement(btn.dataset.entId, btn.dataset.entName);
        });
    }
}

// Checks each voucher for expiry date, marks as EXPIRED if past due date
function handleExpiry(docs) {
    const now = new Date();

    docs.forEach(docSnap => {
        const d = docSnap.data();
        const expiryDate = d.expiryDate ? d.expiryDate.toDate() : null;

        if (expiryDate && now > expiryDate) {
            const vRef = doc(db, "vouchers", docSnap.id);

            runTransaction(db, async (transaction) => {
                transaction.update(vRef, { status: "EXPIRED" });
            }).catch(err => console.error("Auto-expire failed:", err));
        }
    });
}

// Marks a voucher as USED when user clicks "Use now"
async function useVoucher(voucherId, code) {
    if (!currentUserId) {
        alert("You must be logged in!");
        return;
    }

    const confirmUse = confirm(`Voucher code: ${code}\n\nMark this as used?`);

    if (!confirmUse) return;

    try {
        const vRef = doc(db, "vouchers", voucherId);

        await runTransaction(db, async (transaction) => {
            transaction.update(vRef, {
                status: "USED",
                usedAt: serverTimestamp()
            });
        });

        alert("Voucher marked as used.");
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// Consumes one day of entitlement when user clicks "Mark Used"
async function useEntitlement(entId, name) {
    if (!currentUserId) {
        alert("You must be logged in!");
        return;
    }

    const confirmUse = confirm(`Use one ${name} now?\n\nThis will reduce your balance by 1 day.`);

    if (!confirmUse) return;

    try {
        const entRef = doc(db, "Entitlements", entId);

        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(entRef);

            if (!snap.exists()) throw new Error("Entitlement not found");

            const data = snap.data();
            const currentUsed = data.usedQuantity || 0;
            const total = data.totalQuantity || 0;

            if (total - currentUsed <= 0) {
                throw new Error("No days remaining");
            }

            transaction.update(entRef, {
                usedQuantity: currentUsed + 1,
                updatedAt: serverTimestamp()
            });
        });

        alert(`Successfully used 1 ${name}!`);

    } catch (e) {
        alert("Error: " + e.message);
    }
}


function renderVouchers(docs) {
    const container = document.getElementById("vouchers-list");
    if (!container) return;

    const html = docs.map(docSnap => {
        const d = docSnap.data();
        const expiryDate = d.expiryDate ? d.expiryDate.toDate() : null;

        const expiryString = expiryDate
            ? expiryDate.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })
            : "No expiry";

        return `
        <div class="bg-gray-800 border border-gray-700 p-4 rounded-xl flex items-center justify-between gap-4 border-l-4 border-l-[#5f9f87] shadow-md">
            <div class="flex items-center gap-4">
                <div class="bg-gray-900 p-2.5 rounded-lg text-[#5f9f87]">
                    <i data-lucide="ticket" class="w-5 h-5"></i>
                </div>
                <div>
                    <h3 class="font-bold text-sm text-white leading-tight">${d.reward_name || 'Reward Voucher'}</h3>
                    <p class="text-[10px] text-gray-400">Code: <span class="font-mono text-[#5f9f87]">${d.voucherCode}</span></p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button
                        data-voucher-id="${docSnap.id}"
                        data-voucher-code="${escapeAttr(d.voucherCode)}"
                        class="use-voucher-btn bg-[#177a64] hover:bg-[#115e4c] text-white text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1">
                    <i data-lucide="external-link" class="w-3 h-3"></i> Use now
                </button>
                <span class="text-[10px] bg-red-900/30 text-red-400 px-2 py-1.5 rounded border border-red-800/50 font-bold whitespace-nowrap">
                    Expires: ${expiryString}
                </span>
            </div>
        </div>`;
    }).join("");

    container.innerHTML = html || `<p class="text-sm text-gray-500 italic p-4">No active vouchers.</p>`;

    if (window.lucide) lucide.createIcons();
}

function renderEntitlements(docs) {
    const container = document.getElementById("entitlements-list");
    if (!container) return;

    const html = docs.map(docSnap => {
        const d = docSnap.data();
        const total = d.totalQuantity || 0;
        const used = d.usedQuantity || 0;
        const remaining = total - used;

        if (remaining <= 0) return null;

        const dayLabel = remaining === 1 ? "day" : "days";

        return `
        <div class="bg-gray-800 border border-gray-700 p-4 rounded-xl flex items-center justify-between gap-4 border-l-4 border-l-[#5f9f87] shadow-md">
            <div class="flex items-center gap-4">
                <div class="bg-gray-900 p-2.5 rounded-lg text-[#5f9f87]">
                    <i data-lucide="award" class="w-5 h-5"></i>
                </div>
                <div>
                    <h3 class="font-bold text-sm text-white leading-tight">${d.reward_name || 'Benefit'}</h3>
                    <p class="text-[10px] text-[#5f9f87] font-semibold mt-1 uppercase tracking-wider">${remaining} ${dayLabel} available</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button
                        data-ent-id="${docSnap.id}"
                        data-ent-name="${escapeAttr(d.reward_name || 'Benefit')}"
                        class="use-entitlement-btn bg-[#177a64] hover:bg-[#115e4c] text-white text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1">
                    <i data-lucide="check-circle" class="w-3 h-3"></i> Mark Used
                </button>
            </div>
        </div>`;
    }).filter(Boolean).join("");

    container.innerHTML = html || `<p class="text-sm text-gray-500 italic p-4">No entitlements available.</p>`;

    if (window.lucide) lucide.createIcons();
}
