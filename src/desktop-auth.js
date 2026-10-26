import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth } from "./firebase.js";

export function enableDesktopAuth() {
  window.uniDesktopSignIn = async (googleIdToken) => {
    if (
      typeof googleIdToken !== "string" ||
      !googleIdToken
    ) {
      throw new Error("A Google ID token is required.");
    }

    const credential = GoogleAuthProvider.credential(
      googleIdToken
    );

    const result = await signInWithCredential(
      auth,
      credential
    );

    return { uid: result.user.uid };
  };
}