import { useState } from "react";
import { CalendarPage } from "../pages/CalendarPage";
import { useEvents } from "../hooks/useEvents";

export function MobileCalendarPage({
  userId,
}: {
  userId: string;
}) {
  const {
    events,
    addEvent,
    editEvent,
    removeEvent,
  } = useEvents(userId);

  const [error, setError] = useState("");

  return (
    <section className="mobile-page mobile-calendar-workspace">
      {error && <p role="alert">{error}</p>}

      <CalendarPage
        events={events}
        addEvent={addEvent}
        editEvent={editEvent}
        removeEvent={removeEvent}
        onConflict={(_event, _isEditing, allowOverlap) => {
          const approved = window.confirm(
            "This event overlaps another event. Save it anyway?",
          );

          if (!approved) return;

          setError("");

          void allowOverlap().catch(() => {
            setError("Couldn't save the event. Please try again.");
          });
        }}
      />
    </section>
  );
}