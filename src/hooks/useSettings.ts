import { useState, useEffect } from "react"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { db } from "../firebase"
import type { User } from "firebase/auth"

type ThemeMode = "dark" | "light"
type Palette = "tvgirl" | "lalaland"

export function useSettings(user: User | null) {
  const [mode, setMode] = useState<ThemeMode>("dark")
  const [palette, setPalette] = useState<Palette>("tvgirl")

  useEffect(() => {
    if (!user) return

    const settingsRef = doc(
      db,
      "users",
      user.uid,
      "settings",
      "preferences"
    )

    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()

        setMode(data.mode ?? "dark")
        setPalette(data.palette ?? "tvgirl")
      }
    })

    return () => unsubscribe()
  }, [user])

  async function handleThemeChange(newMode: ThemeMode) {
    setMode(newMode)

    if (user) {
      await setDoc(
        doc(db, "users", user.uid, "settings", "preferences"),
        {
          mode: newMode,
          palette,
        },
        { merge: true }
      )
    }
  }

  async function handlePaletteChange(newPalette: Palette) {
    setPalette(newPalette)

    if (user) {
      await setDoc(
        doc(db, "users", user.uid, "settings", "preferences"),
        {
          mode,
          palette: newPalette,
        },
        { merge: true }
      )
    }
  }

  return {
    mode,
    palette,
    handleThemeChange,
    handlePaletteChange,
  }
}