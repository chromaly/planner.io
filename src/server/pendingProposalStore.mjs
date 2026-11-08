import { getFirestore } from "firebase-admin/firestore";

export function createProposalStore(
  db = getFirestore(),
  collection = "_serverPendingProposals"
) {
  function reference(uid) {
    if (typeof uid !== "string" || !uid) {
      throw new Error("A user ID is required.");
    }

    return db.collection(collection).doc(encodeURIComponent(uid));
  }

  return {
    async read(uid) {
      const snapshot = await reference(uid).get();
      return snapshot.exists ? snapshot.data() : null;
    },

    async change(uid, transform) {
      const ref = reference(uid);

      return db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists ? snapshot.data() : null;

        // Keep transform synchronous and free of external actions.
        // next: undefined = no write, null = delete, object = replace.
        const change = transform(current);

        if (
          !change ||
          typeof change !== "object" ||
          typeof change.then === "function"
        ) {
          throw new Error("Invalid proposal-store change.");
        }

        if (change.next === null) {
          transaction.delete(ref);
        } else if (change.next !== undefined) {
          transaction.set(ref, change.next);
        }

        return change.result;
      });
    },
  };
}