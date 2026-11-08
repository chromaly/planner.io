/// <reference types="vite/client" />

import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";

import "../index.css";
import { auth, googleProvider } from "../firebase.js";

import { PlannerShell } from "../components/PlannerShell";
import { useAuth } from "../components/AuthHandler";
import { useSettings } from "../hooks/useSettings";

import { FadeRoutes } from "./FadeRoutes";
import { MobileEvents } from "./MobileEvents";
import { MobileNotes } from "./MobileNotes";
import { MobileReminders } from "./MobileReminders";
import { MobileSettings } from "./MobileSettings";
import { MobileCalendarPage } from "./MobileCalendarPage";

function MobileSignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    if (signingIn) return;

    setSigningIn(true);
    setError("");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError("Couldn't sign in. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="mobile-sign-in">
      <div>
        <h1>planner.io</h1>
        <p>The only university planner you'll ever need.</p>
      </div>

      <button
        type="button"
        disabled={signingIn}
        onClick={() => void signIn()}
      >
        {signingIn ? "Signing in…" : "Sign in with Google"}
      </button>

      {error && <p role="alert">{error}</p>}
    </main>
  );
}

function MobileApp() {
  const { user, handleSignIn, handleSignOut } = useAuth();
  const settings = useSettings(user);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    void auth.authStateReady().then(() => {
      if (active) setAuthReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!authReady) {
    return (
      <div className="mobile-companion dark palette-tvgirl">
        <main className="mobile-sign-in">
          <p role="status">Loading planner…</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-companion dark palette-tvgirl">
        <MobileSignIn />
      </div>
    );
  }

  return (
    <div
      className={`mobile-companion ${settings.mode} palette-${settings.palette}`}
      style={{ colorScheme: settings.mode }}
    >
      <HashRouter key={user.uid}>
        <PlannerShell
          desktopHeader={null}
          signedIn
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        >
          <FadeRoutes>
            <Route
              path="/"
              element={
                <MobileEvents
                  key={user.uid}
                  userId={user.uid}
                />
              }
            />

            <Route
              path="/notes"
              element={
                <MobileNotes
                  key={user.uid}
                  userId={user.uid}
                />
              }
            />

            <Route
              path="/reminders"
              element={
                <MobileReminders
                  key={user.uid}
                  userId={user.uid}
                />
              }
            />
            <Route
              path="/calendar"
              element={
                <MobileCalendarPage
                  key={user.uid}
                  userId={user.uid}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <MobileSettings
                  key={user.uid}
                  settings={settings}
                />
              }
            />
          </FadeRoutes>
        </PlannerShell>
      </HashRouter>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MobileApp />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  void navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}mobile/sw.js`, {
      scope: `${import.meta.env.BASE_URL}mobile/`,
    })
    .catch((error) => {
      console.error("Planner notification worker failed:", error);
    });
}