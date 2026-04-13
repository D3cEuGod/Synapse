import { 
    doc, collection, query, where, orderBy, limit, onSnapshot, 
    runTransaction, serverTimestamp, Timestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from "../firebase-config.js";

const currentAccountId = "bAPwy5Lx4Wdet0xhaJwC859pKs23";

function initRewardsPage() {
    if (!currentAccountId) return;

    const accountRef = doc(db, "pointsAccount", currentAccountId);

    onSnapshot(accountRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const balanceEl = document.getElementById("current-balance-display");
            if (balanceEl) balanceEl.innerText = `${data.currentBalance} Points`;
            
            const loadingEl = document.getElementById('view-loading');
            const appEl = document.getElementById('view-app');
            if (loadingEl) loadingEl.classList.add('hidden');
            if (appEl) appEl.classList.remove('hidden');
        } else {
            console.error("Account document not found!");
        }
    });

    const txQuery = query(
        collection(db, "pointsTransactions"),
        where("accountId", "==", currentAccountId),
        orderBy("timestamp", "desc"),
        limit(10)
    );

    onSnapshot(txQuery, (snapshot) => {
        renderHistorySidebar(snapshot.docs);
    });
}


function renderHistorySidebar(docs) {
    const container = document.getElementById("history-timeline-container");
    if (!container) return;

    container.innerHTML = "";

    docs.forEach((docSnap) => {
        const data = docSnap.data();
        const date = data.timestamp 
            ? data.timestamp.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) 
            : "Pending";

        const itemHTML = `
            <div class="relative pl-6 pb-6 border-l border-gray-700 last:border-0">
                <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#5f9f87]"></div>
                <p class="text-xs font-bold text-gray-200">
                    ${date}: <span class="text-red-400">${data.pointsChange} pts</span>
                </p>
                <p class="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">
                    ${data.source.replace(/_/g, " ")}
                </p>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", itemHTML);
    });
}


async function claimReward(rewardData) {
   const accountRef = doc(db, "pointsAccount", currentAccountId);

    // --- 1. NEW: DONATION PROMPT LOGIC ---
    let donationTarget = null;
    if (rewardData.reward_type === "DONATION") {
        donationTarget = prompt("Which charity or cause would you like to support?", "Local Food Bank");
        
        // If they hit 'Cancel', stop the function
        if (donationTarget === null) return; 
        
        const confirmText = `Confirm donating ${rewardData.pointsCost} pts to: ${donationTarget || 'a worthy cause'}?`;
        if (!confirm(confirmText)) return;
    }

    try {
        await runTransaction(db, async (transaction) => {
            
            const entitlementDocId = `${currentAccountId}_${rewardData.entitlement_type}`;
            const entRef = doc(db, "Entitlements", entitlementDocId);


            const accountSnap = await transaction.get(accountRef);
            let entSnap = null;
            if (rewardData.reward_type === "ENTITLEMENT") {
                entSnap = await transaction.get(entRef);
            }

            if (!accountSnap.exists()) throw new Error("Account not found");

            const currentBalance = accountSnap.data().currentBalance;
            const newBalance = currentBalance - rewardData.pointsCost;

            if (newBalance < 0) throw new Error("Insufficient points!");

            transaction.update(accountRef, { currentBalance: newBalance });

            const redemptionRef = doc(collection(db, "redemptions"));
            transaction.set(redemptionRef, {
                accountId: currentAccountId,
                rewardId: rewardData.rewardId,
                pointsSpent: rewardData.pointsCost,
                redemptionDate: serverTimestamp(),
                reward_name: rewardData.reward_name,
                reward_type: rewardData.reward_type,
                charity_name: rewardData.reward_type === "DONATION" ? (donationTarget || "General Fund") : null
            });

            const txRef = doc(collection(db, "pointsTransactions"));
            transaction.set(txRef, {
                accountId: currentAccountId,
                pointsChange: -rewardData.pointsCost,
                source: "REWARD_REDEMPTION",
                timestamp: serverTimestamp()
            });

            if (rewardData.reward_type === "VOUCHER") {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 30);
                const voucherRef = doc(collection(db, "vouchers"));

                transaction.set(voucherRef, {
                    accountId: currentAccountId,
                    rewardId: rewardData.rewardId,
                    reward_name: rewardData.reward_name,
                    voucherCode: "SYN-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    status: "ACTIVE",
                    issuedAt: serverTimestamp(),
                    usedAt: null,
                    expiryDate: Timestamp.fromDate(expiry)
                });

            } 
            else if (rewardData.reward_type === "ENTITLEMENT") {
                if (entSnap && entSnap.exists()) {
                    transaction.update(entRef, { 
                        totalQuantity: (entSnap.data().totalQuantity || 0) + 1,
                        updatedAt: serverTimestamp() 
                    });
                } else {
                    transaction.set(entRef, {
                        accountId: currentAccountId,
                        reward_name: rewardData.reward_name,
                        entitlement_type: rewardData.entitlement_type,
                        totalQuantity: 1,
                        usedQuantity: 0,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }
        });

        
        if (rewardData.reward_type === "DONATION") {
            alert(`Amazing! You've successfully donated ${rewardData.pointsCost} points to ${donationTarget || 'charity'}.`);
        } else {
            alert(`Successfully claimed ${rewardData.reward_name}!`);
        }

    } catch (e) {
        console.error("Redemption failed:", e);
        alert(e.message);
    }
}


document.addEventListener("click", (e) => {
    const btn = e.target.closest(".claim-btn");
    if (!btn) return;

    const rewardData = {
        rewardId: btn.dataset.id,
        reward_name: btn.dataset.name,
        reward_type: btn.dataset.type,
        pointsCost: Number(btn.dataset.cost),
        entitlement_type: btn.dataset.entitlement || null
    };

    claimReward(rewardData);
});

document.addEventListener("DOMContentLoaded", () => {
    initRewardsPage();
    if (window.lucide) lucide.createIcons();
});