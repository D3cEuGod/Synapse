import { 
    doc, collection, runTransaction, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "../firebase-config.js";

// Strategy class for calculating points from steps
class ActivityPointsStrategy {
    calculate(steps, stepRate) {
        return Math.floor(steps / stepRate);  
    }
}

// Strategy class for calculating points from meal logging
class MealPointsStrategy {
    calculate(calories, mealBonus) {
        return calories > 0 ? mealBonus : 0;  
    }
}

// Handles all point awarding for activities
export class PointsManager {
    constructor() {
        this.activityStrategy = new ActivityPointsStrategy();
        this.mealStrategy = new MealPointsStrategy();
        this.rates = null;  
    }

    // Loads earning rates from Firestore (steps rate, activity bonus, meal bonus, mood bonus)
    async loadRates() {
        if (this.rates) return this.rates;
        
        const configRef = doc(db, "systemConfig", "pointsSettings");
        const snap = await getDoc(configRef);
        
        if (snap.exists()) {
            this.rates = snap.data();
        } else {
            this.rates = {
                STEP_LOG_BASE: 100,
                ACTIVITY_BONUS: 60,
                MEAL_BONUS: 20,
                MOOD_BONUS: 15
            };
        }
        return this.rates;
    }

    // Awards points to a user based on activity type and value
    async awardPoints(userId, value, source) {
        
        const rates = await this.loadRates();
        
        let pointsEarned = 0;

        if (source === "STEPS_LOG") {
            pointsEarned = this.activityStrategy.calculate(value, rates.STEP_LOG_BASE || 100);
        } else if (source === "ACTIVITY") {
            pointsEarned = rates.ACTIVITY_BONUS || 60;
        } else if (source === "MEAL") {
            pointsEarned = this.mealStrategy.calculate(value, rates.MEAL_BONUS || 20);
        } else if (source === "MOOD_CHECK") {
            pointsEarned = rates.MOOD_BONUS || 15;
        }


        if (pointsEarned <= 0) return;

        const accountRef = doc(db, "pointsAccount", userId);
        const txRef = doc(collection(db, "pointsTransactions"));

        try {
            await runTransaction(db, async (transaction) => {
                const accountSnap = await transaction.get(accountRef);
                if (!accountSnap.exists()) throw new Error("Account doesn't exist!");

                const currentBalance = accountSnap.data().currentBalance || 0;
                
                transaction.update(accountRef, { 
                    currentBalance: currentBalance + pointsEarned,
                    lifetimePoints: (accountSnap.data().lifetimePoints || 0) + pointsEarned 
                });

                transaction.set(txRef, {
                    accountId: userId,
                    pointsChange: pointsEarned,
                    source: source,
                    timestamp: serverTimestamp()
                });
            });
            console.log(`Success: Awarded ${pointsEarned} for ${source}`);
        } catch (e) {
            console.error("Points award failed: ", e);
        }
    }
}