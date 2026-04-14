import { 
    doc, collection, query, where, orderBy, limit, onSnapshot, 
    runTransaction, serverTimestamp, Timestamp, getDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from "../firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


let currentUserId = null;

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        initRewardsPage();
    } else {
        window.location.href = "login.html";
    }
});

// Checks if user has HR or Admin role, shows Manage Rewards button if yes
async function checkHRStatus(userId) {
    if (!userId) return;
    
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) return;

    const roles = userDoc.data().roles || [];

    if (roles.includes("HR_Member") || roles.includes("Administrator")) {
        document.getElementById("hr-manage-btn")?.classList.remove("hidden");
    }
}

// Sets up all real-time listeners for the rewards page
function initRewardsPage() {
    if (!currentUserId) return;

    checkHRStatus(currentUserId);
    const accountRef = doc(db, "pointsAccount", currentUserId);

    onSnapshot(accountRef, (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();

        // 1. Update Current Balance
        const balanceEl = document.getElementById("current-balance-display");
        if (balanceEl) balanceEl.innerText = `${data.currentBalance || 0} Points`;

        // 2. [GAMIFICATION] Update Lifetime Points
        // We find the paragraph that contains the text "Lifetime Points"
        const lifetimeContainer = document.querySelector('p.text-sm.text-gray-500.mt-4');
        if (lifetimeContainer) {
            lifetimeContainer.innerHTML = `
                Lifetime Points: ${data.lifetimePoints || 0} 
                <i data-lucide="star" class="w-3 h-3 text-[#5f9f87]"></i>
            `;
            // Re-render the star icon
            if (window.lucide) lucide.createIcons();
        }

        document.getElementById('view-loading')?.classList.add('hidden');
        document.getElementById('view-app')?.classList.remove('hidden');
    });


    
    const txQuery = query(
        collection(db, "pointsTransactions"),
        where("accountId", "==", currentUserId),
        orderBy("timestamp", "desc"),
        limit(10)
    );

    onSnapshot(txQuery, (snapshot) => {
        renderHistorySidebar(snapshot.docs);
    });


    onSnapshot(collection(db, "rewards"), (snapshot) => {
        const grid = document.getElementById("rewards-grid");
        if (!grid) return;

        grid.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const reward = docSnap.data();
            const id = docSnap.id; 

            const cardHTML = `
                <div class="bg-gray-800 border border-gray-700 p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-[#5f9f87]">
                    <div class="bg-gray-900 p-3 rounded-lg text-[#5f9f87]">
                        <i data-lucide="${reward.icon || 'gift'}"></i>
                    </div>

                    <div class="flex-grow">
                        <h3 class="font-bold text-sm text-white leading-tight">${reward.reward_name}</h3>
                        <p class="text-xs text-gray-400 mt-1">${reward.description || 'Redeemable reward'}</p>

                        <div class="flex justify-between items-center mt-3">
                            <span class="text-xs font-bold text-gray-300">${reward.pointsCost} Pts</span>

                            <button
                                class="claim-btn bg-[#177a64] hover:bg-[#115e4c] text-white text-[10px] px-3 py-1 rounded-md font-bold uppercase"
                                data-id="${id}"
                                data-name="${reward.reward_name}"
                                data-type="${reward.reward_type}"
                                data-cost="${reward.pointsCost}"
                                data-entitlement="${reward.entitlement_type || ''}"
                            >
                                Claim
                            </button>
                        </div>
                    </div>
                </div>
            `;

            grid.insertAdjacentHTML("beforeend", cardHTML);
        });

        requestAnimationFrame(() => {
            if (window.lucide) lucide.createIcons();
        });
    });
}

// Renders the transaction history sidebar from Firestore data
function renderHistorySidebar(docs) {
    const container = document.getElementById("history-timeline-container");
    if (!container) return;

    container.innerHTML = "";

    docs.forEach((docSnap) => {
        const data = docSnap.data();

        const date = data.timestamp?.toDate?.()
            ? data.timestamp.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short" })
            : "Pending";

        
        let displayText = "";
        
        if (data.reward_name) {
            displayText = data.reward_name;
        } else if (data.source === "REWARD_REDEMPTION") {
            displayText = "Reward Redemption";
        } else {
            displayText = (data.source || '').replace(/_/g, " ");
        }

        const itemHTML = `
            <div class="relative pl-6 pb-6 border-l border-gray-700 last:border-0">
                <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#5f9f87]"></div>

                <p class="text-xs font-bold text-gray-200">
                    ${date}: <span class="text-red-400">${data.pointsChange} pts</span>
                </p>

                <p class="text-[10px] text-gray-500 uppercase mt-1">
                    ${displayText}
                </p>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", itemHTML);
    });
}

// Processes the reward claim - deducts points, creates voucher/entitlement/redemption records
async function claimReward(rewardData) {
    if (!currentUserId) {
        alert("You must be logged in!");
        return;
    }
    
    const accountRef = doc(db, "pointsAccount", currentUserId);

    let donationTarget = null;

    if (rewardData.reward_type === "DONATION") {
        donationTarget = prompt("Which charity or cause?", "Local Food Bank");

        if (!donationTarget?.trim()) return;

        const confirmText =
            `Confirm donating ${rewardData.pointsCost} pts to ${donationTarget}?`;

        if (!confirm(confirmText)) return;
    }

    try {
        await runTransaction(db, async (transaction) => {

            const entitlementDocId =
                `${currentUserId}_${rewardData.entitlement_type}`;

            const entRef = doc(db, "Entitlements", entitlementDocId);

            const accountSnap = await transaction.get(accountRef);

            if (!accountSnap.exists()) throw new Error("Account not found");

            let entSnap = null;

            if (rewardData.reward_type === "ENTITLEMENT") {
                entSnap = await transaction.get(entRef);
            }

            const currentBalance = accountSnap.data().currentBalance || 0;
            const newBalance = currentBalance - rewardData.pointsCost;

            if (newBalance < 0) throw new Error("Insufficient points!");

            transaction.update(accountRef, { currentBalance: newBalance });

            const redemptionRef = doc(collection(db, "redemptions"));

            transaction.set(redemptionRef, {
                accountId: currentUserId,
                rewardId: rewardData.rewardId, 
                pointsSpent: rewardData.pointsCost,
                redemptionDate: serverTimestamp(),
                reward_name: rewardData.reward_name,
                reward_type: rewardData.reward_type,
                charity_name:
                    rewardData.reward_type === "DONATION"
                        ? donationTarget
                        : null
            });

            const txRef = doc(collection(db, "pointsTransactions"));

            
            transaction.set(txRef, {
                accountId: currentUserId,
                pointsChange: -rewardData.pointsCost,
                source: "REWARD_REDEMPTION",
                reward_name: rewardData.reward_name, 
                timestamp: serverTimestamp()
            });

            if (rewardData.reward_type === "VOUCHER") {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 30);

                const voucherRef = doc(collection(db, "vouchers"));

                transaction.set(voucherRef, {
                    accountId: currentUserId,
                    rewardId: rewardData.rewardId,
                    reward_name: rewardData.reward_name,
                    voucherCode:
                        "SYN-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    status: "ACTIVE",
                    issuedAt: serverTimestamp(),
                    usedAt: null,
                    expiryDate: Timestamp.fromDate(expiry)
                });
            }

            else if (rewardData.reward_type === "ENTITLEMENT") {
                if (entSnap?.exists()) {
                    transaction.update(entRef, {
                        totalQuantity: (entSnap.data().totalQuantity || 0) + 1,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    transaction.set(entRef, {
                        accountId: currentUserId,
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

        alert(
            rewardData.reward_type === "DONATION"
                ? `Donated ${rewardData.pointsCost} points to ${donationTarget}`
                : `Successfully claimed ${rewardData.reward_name}`
        );

    } catch (e) {
        console.error("Redemption failed:", e);
        alert(e.message);
    }
}


// Listens for clicks on claim buttons and triggers the claim process
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".claim-btn");
    if (!btn) return;

    if (!currentUserId) {
        alert("Please log in first!");
        return;
    }

    claimReward({
        rewardId: btn.dataset.id, 
        reward_name: btn.dataset.name,
        reward_type: btn.dataset.type,
        pointsCost: Number(btn.dataset.cost),
        entitlement_type: btn.dataset.entitlement || null
    });
});

