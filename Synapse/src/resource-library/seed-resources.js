import { db } from "../firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { resourceSeedData } from "./resource-seed-data.js";

export async function seedResources() {
  for (const resource of resourceSeedData) {
    await addDoc(collection(db, "resources"), resource);
  }

  console.log("Resources seeded successfully.");
}