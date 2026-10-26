import { useState, useEffect } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged, type User} from "firebase/auth"
import { auth, googleProvider } from "../firebase.js"

declare global {
  interface Window {
    uniDesktopBridge?: {
      startSignIn: () => void
    }
  }
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
    }, [])

    async function handleSignIn() {
        try {
            const embedded = new URLSearchParams(
                window.location.search
            ).get("embed") === "uni"

            if (embedded) {
                if (!window.uniDesktopBridge) {
                    throw new Error("Desktop bridge is not ready.")
                }

                window.uniDesktopBridge.startSignIn()
                return
            }

            await signInWithPopup(auth, googleProvider)
        } catch (error) {
            console.error(error)
        }
    }

    function handleSignOut() {
        signOut(auth)
    } 

    return { user, handleSignIn, handleSignOut }
}