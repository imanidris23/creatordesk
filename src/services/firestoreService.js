import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../firebase.js";

// Get a user's collection
function getUserCollection(uid, collectionName) {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return collection(db, "users", uid, collectionName);
}

// Read all records
export async function getUserRecords(uid, collectionName) {
  const snapshot = await getDocs(getUserCollection(uid, collectionName));

  return snapshot.docs.map((document) => ({
    ...document.data(),
    id: document.id,
  }));
}

// Add or update a record
export async function saveUserRecord(uid, collectionName, record) {
  const { id, ...data } = record;

  if (!id) {
    throw new Error("Record ID is required.");
  }

  const recordRef = doc(db, "users", uid, collectionName, id);

  await setDoc(recordRef, data, { merge: true });
}

// Delete a record
export async function deleteUserRecord(uid, collectionName, recordId) {
  const recordRef = doc(db, "users", uid, collectionName, recordId);

  await deleteDoc(recordRef);
}
