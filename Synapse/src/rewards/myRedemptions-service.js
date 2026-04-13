import { 
    collection, query, where, onSnapshot, doc, runTransaction, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "../firebase-config.js";

const currentAccountId = "bAPwy5Lx4Wdet0xhaJwC859pKs23";

function initRedemptionsPage() {
    if (!currentAccountId) return;

    
    const voucherQuery = query(
        collection(db, "vouchers"),
        where("accountId", "==", currentAccountId),
        where("status", "==", "ACTIVE")
    );
    onSnapshot(voucherQuery, (snapshot) => renderVouchers(snapshot.docs));

    
    const entitlementQuery = query(
        collection(db, "Entitlements"), 
        where("accountId", "==", currentAccountId)
    );
    onSnapshot(entitlementQuery, (snapshot) => renderEntitlements(snapshot.docs));
}


async function useVoucher(voucherId, code) {
    const confirmUse = confirm(`VOUCHER CODE: ${code}\n\nReady to use this? Click OK to mark as used and remove from your list.`);
    
    if (confirmUse) {
        try {
            const vRef = doc(db, "vouchers", voucherId);
            await runTransaction(db, async (transaction) => {
                transaction.update(vRef, {
                    status: "USED",
                    usedAt: serverTimestamp()
                });
            });
            alert("Voucher marked as used!");
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
}


async function useEntitlement(entId, name) {
    const confirmUse = confirm(`Use one ${name} now?\n\nThis will reduce your available balance by 1 day.`);
    
    if (confirmUse) {
        try {
            const entRef = doc(db, "Entitlements", entId);
            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(entRef);
                const currentUsed = snap.data().usedQuantity || 0;
                const total = snap.data().totalQuantity || 0;

                if (total - currentUsed <= 0) throw new Error("No days remaining!");

                transaction.update(entRef, {
                    usedQuantity: currentUsed + 1,
                    updatedAt: serverTimestamp()
                });
            });
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
}


function renderVouchers(docs) {
    const container = document.getElementById("vouchers-list");
    if (!container) return;

    const now = new Date();

    const activeVouchers = docs.map(docSnap => {
        const d = docSnap.data();
        const expiryDate = d.expiryDate ? d.expiryDate.toDate() : null;
        
    
        if (expiryDate && now > expiryDate) {
            const vRef = doc(db, "vouchers", docSnap.id);
            
            runTransaction(db, async (transaction) => {
                transaction.update(vRef, { status: "EXPIRED" });
            }).catch(err => console.error("Auto-expire sync failed:", err));
            
            return null; 
        }
        
        const expiryString = expiryDate 
            ? expiryDate.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' }) 
            : "No Expiry";

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
                <button onclick="handleUseVoucher('${docSnap.id}', '${d.voucherCode}')" 
                        class="bg-[#177a64] hover:bg-[#115e4c] text-white text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1">
                    <i data-lucide="external-link" class="w-3 h-3"></i> Use Now
                </button>
                <span class="text-[10px] bg-red-900/30 text-red-400 px-2 py-1.5 rounded border border-red-800/50 font-bold whitespace-nowrap">
                    Expires: ${expiryString}
                </span>
            </div>
        </div>`;
    }).filter(html => html !== null);

    container.innerHTML = activeVouchers.length > 0 ? activeVouchers.join("") : `<p class="text-sm text-gray-500 italic p-4">No active vouchers.</p>`;
    lucide.createIcons();
}

function renderEntitlements(docs) {
    const container = document.getElementById("entitlements-list");
    if (!container) return;

    const activeEntitlements = docs.map(docSnap => {
        const d = docSnap.data();
        const remaining = d.totalQuantity - d.usedQuantity;
        if (remaining <= 0) return null;

        return `
        <div class="bg-gray-800 border border-gray-700 p-4 rounded-xl flex justify-between items-center">
            <div>
                <h3 class="font-bold text-white">${d.reward_name || 'Benefit'}</h3>
                <p class="text-xs text-[#5f9f87] font-semibold">${remaining} Days Available</p>
                <p class="text-[10px] text-gray-500 italic mt-1 font-medium">Total earned: ${d.totalQuantity}</p>
            </div>
            <button onclick="handleUseEntitlement('${docSnap.id}', '${d.reward_name}')" 
                    class="text-xs bg-emerald-700 hover:bg-emerald-600 px-4 py-2 rounded-lg transition-colors text-white font-bold">
                Use Day
            </button>
        </div>`;
    }).filter(html => html !== null);

    container.innerHTML = activeEntitlements.length > 0 ? activeEntitlements.join("") : `<p class="text-sm text-gray-500 italic p-4">No entitlements available.</p>`;
    lucide.createIcons();
}


window.handleUseVoucher = useVoucher;
window.handleUseEntitlement = useEntitlement;

document.addEventListener("DOMContentLoaded", initRedemptionsPage);