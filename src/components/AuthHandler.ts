import { useState, useEffect } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged, type User} from "firebase/auth"
import { auth, googleProvider } from "../firebase.js"

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