import { useEffect, useState, type ReactNode } from "react";
import { Routes, useLocation } from "react-router-dom";

export function FadeRoutes({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayed, setDisplayed] = useState(location);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (location.key === displayed.key) {
      setLeaving(false);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(location);
      setLeaving(false);
      return;
    }

    setLeaving(true);

    const timer = window.setTimeout(() => {
      setDisplayed(location);
      setLeaving(false);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [location, displayed]);

  return (
    <div className={`mobile-view-transition ${leaving ? "is-leaving" : ""}`}>
      <div key={displayed.key} className="mobile-view-enter">
        <Routes location={displayed}>{children}</Routes>
      </div>
    </div>
  );
}