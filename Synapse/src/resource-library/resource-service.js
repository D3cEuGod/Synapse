import { db } from "../shared/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export async function getAllResources() {
  const q = query(
    collection(db, "resources"),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function getAvailableTypes() {
  const resources = await getAllResources();
  return [...new Set(resources.map(resource => resource.type))];
}

export async function getAvailableCategories() {
  const resources = await getAllResources();
  return [...new Set(resources.map(resource => resource.category))];
}