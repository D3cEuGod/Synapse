import { 
    collection, doc, updateDoc, onSnapshot, getDoc  
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from "../firebase-config.js";


const currentAccountId = "bAPwy5Lx4Wdet0xhaJwC859pKs23";

let rewardsData = [];
let redemptionsData = [];

async function checkHRStatus(userId) {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
        alert("User not found.");
        return false;
    }

    const roles = userDoc.data().roles || [];

    const hasPermission = roles.includes("HR_Member") || roles.includes("Administrator");
    
    if (!hasPermission) {
        document.getElementById("view-app")?.classList.add("hidden");
        document.getElementById("view-loading")?.classList.add("hidden");
        alert("You do not have permission to access this page.");
        return false;
    }
    
    return true;  
}


export async function initManageRewards() {
    const isHR = await checkHRStatus(currentAccountId);
    if (!isHR) return;  

    onSnapshot(collection(db, "rewards"), (snapshot) => {
        rewardsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateUI();
    });

    onSnapshot(collection(db, "redemptions"), (snapshot) => {
        redemptionsData = snapshot.docs.map(d => d.data());
        updateUI();
    });
}


function updateUI() {
    renderAdminTable(rewardsData);
    calculateCatalogueStats(rewardsData, redemptionsData);

    document.getElementById('view-loading')?.classList.add('hidden');
    document.getElementById('view-app')?.classList.remove('hidden');

    if (window.lucide) lucide.createIcons();
}

function renderAdminTable(rewards) {
    const container = document.getElementById("admin-rewards-list");
    if (!container) return;

    container.innerHTML = rewards.map(reward => `
        <tr class="hover:bg-gray-700/30 transition-colors border-b border-gray-700/50">
            <td class="p-4">
                <span class="font-medium text-white text-sm">${reward.reward_name}</span>
            </td>

            <td class="p-4 text-center">
                <span class="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-900 px-2 py-1 rounded border border-gray-700/50">
                    ${reward.reward_type}
                </span>
            </td>

            <td class="p-4 text-center">
                <input type="number" 
                    id="input-${reward.id}" 
                    value="${reward.pointsCost}" 
                    class="bg-gray-900 border border-gray-700 rounded px-1 py-1 w-14 text-center text-[#5f9f87] font-bold focus:border-[#5f9f87] outline-none text-sm">
            </td>

            <td class="p-4 text-right pr-6">
                <button data-id="${reward.id}" class="save-reward-btn text-amber-500 hover:text-amber-400 text-[10px] font-bold uppercase tracking-widest transition-colors">
                    Save
                </button>
            </td>
        </tr>
    `).join('');

    container.querySelectorAll(".save-reward-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            processUpdate(btn.dataset.id);
        });
    });
}

function calculateCatalogueStats(rewards, redemptions) {
    const totalEl = document.getElementById("stat-total-rewards");
    const avgEl = document.getElementById("stat-avg-cost");
    const mostEl = document.getElementById("stat-most-claimed");

    if (totalEl) {
        totalEl.innerText = rewards.length;
    }

    if (avgEl) {
        if (rewards.length > 0) {
            const avg = rewards.reduce((sum, r) => sum + (Number(r.pointsCost) || 0), 0) / rewards.length;
            avgEl.innerText = `${Math.round(avg)} Pts`;
        } else {
            avgEl.innerText = "0 Pts";
        }
    }

    if (mostEl) {
        if (redemptions.length === 0) {
            mostEl.innerText = "No redemptions yet";
        } else {
            const counts = {};

            redemptions.forEach(r => {
                const key = r.reward_name || "Unknown";
                counts[key] = (counts[key] || 0) + 1;
            });

            const keys = Object.keys(counts);

            const winner = keys.length
                ? keys.reduce((a, b) => counts[a] > counts[b] ? a : b)
                : "No data";

            mostEl.innerText = winner;
        }
    }
}

async function processUpdate(id) {
    const inputEl = document.getElementById(`input-${id}`);
    if (!inputEl) return;

    const newVal = Number(inputEl.value);

    if (isNaN(newVal) || newVal < 0) {
        alert("Invalid amount");
        return;
    }

    try {
        await updateDoc(doc(db, "rewards", id), {
            pointsCost: newVal
        });

        console.log("Updated successfully");

    } catch (e) {
        alert("Error: " + e.message);
    }
}

document.addEventListener("DOMContentLoaded", initManageRewards);