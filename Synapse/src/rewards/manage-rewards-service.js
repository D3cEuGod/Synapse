
import { 
    collection, doc, updateDoc, onSnapshot, getDoc, setDoc  
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from "../firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


const auth = getAuth();
let currentUserId = null;  

// Waits for user to log in, then initializes the HR management page
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;  
        initManageRewards(currentUserId);  
    } else {
        window.location.href = "login.html";
    }
});


let rewardsData = [];
let redemptionsData = [];

// Checks if the logged-in user has HR or Admin permissions
async function checkHRStatus(userId) {
    if (!userId) return false;
    
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

// Checks HR status, loads rates, sets up listeners
export async function initManageRewards(userId) {  
    const isHR = await checkHRStatus(userId);  
    if (!isHR) return;  

    await loadEarningRates();  

    onSnapshot(collection(db, "rewards"), (snapshot) => {
        rewardsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateUI();
    });

    onSnapshot(collection(db, "redemptions"), (snapshot) => {
        redemptionsData = snapshot.docs.map(d => d.data());
        updateUI();
    });
}

// Renders table and analytics, hides loading spinner
function updateUI() {
    renderAdminTable(rewardsData);
    calculateCatalogueStats(rewardsData, redemptionsData);

    document.getElementById('view-loading')?.classList.add('hidden');
    document.getElementById('view-app')?.classList.remove('hidden');

    if (window.lucide) lucide.createIcons();
}

// Renders the rewards table with editable point cost inputs and save buttons
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

// Calculates and displays catalogue stats: total rewards, avg cost, most claimed
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

// Saves updated point cost for a reward to Firestore after validation
async function processUpdate(id) {
    const inputEl = document.getElementById(`input-${id}`);
    if (!inputEl) return;

    const newVal = Number(inputEl.value);

    if (isNaN(newVal) || newVal <= 0) {
        alert("Invalid amount — cost must be greater than zero.");
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

// EARNING RATES FUNCTIONS

// Loads global earning rates from Firestore and populates the input fields
async function loadEarningRates() {
    const configRef = doc(db, "systemConfig", "pointsSettings");
    try {
        const snap = await getDoc(configRef);
        if (snap.exists()) {
            const data = snap.data();
            
            if (document.getElementById('hr-step-rate')) 
                document.getElementById('hr-step-rate').value = data.STEP_LOG_BASE || 100;
            if (document.getElementById('hr-activity-bonus')) 
                document.getElementById('hr-activity-bonus').value = data.ACTIVITY_BONUS || 10;
            if (document.getElementById('hr-meal-bonus')) 
                document.getElementById('hr-meal-bonus').value = data.MEAL_BONUS || 20;
            if (document.getElementById('hr-mood-bonus')) 
                document.getElementById('hr-mood-bonus').value = data.MOOD_BONUS || 15;
        }
    } catch (e) {
        console.error("Error loading rates:", e);
    }
}

// Listens for click on Save Global Rates button, validates inputs, saves to Firestore
document.addEventListener("click", async (e) => {
    if (e.target.closest("#update-rates-btn")) {
        
        
        const stepRate = Number(document.getElementById('hr-step-rate')?.value || 100);
        const activityBonus = Number(document.getElementById('hr-activity-bonus')?.value || 10);
        const mealBonus = Number(document.getElementById('hr-meal-bonus')?.value || 20);
        const moodBonus = Number(document.getElementById('hr-mood-bonus')?.value || 15);
        
        if (stepRate < 1) {
            alert("Steps per point must be at least 1");
            return;
        }
        if (activityBonus < 0) {
            alert("Workout bonus cannot be negative");
            return;
        }
        if (mealBonus < 0) {
            alert("Meal bonus cannot be negative");
            return;
        }
        if (moodBonus < 0) {
            alert("Mood check bonus cannot be negative");
            return;
        }
        
        
        if (isNaN(stepRate) || isNaN(activityBonus) || isNaN(mealBonus) || isNaN(moodBonus)) {
            alert("Please enter valid numbers in all fields");
            return;
        }
        
        const configRef = doc(db, "systemConfig", "pointsSettings");
        
        const newRates = {
            STEP_LOG_BASE: stepRate,
            ACTIVITY_BONUS: activityBonus,
            MEAL_BONUS: mealBonus,
            MOOD_BONUS: moodBonus
        };

        try {
            await setDoc(configRef, newRates, { merge: true });
            alert("Success: Global earning rates updated!");
        } catch (e) {
            console.error("Error saving rates:", e);
            alert("Failed to save rates.");
        }
    }
});