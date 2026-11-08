import { useEffect, useState } from "react";
import { useEvents } from "../hooks/useEvents";
import { useDeadlines } from "../hooks/useDeadlines";
import {
  eventOccursOnDay,
  getEventOccurrence,
} from "../utils/eventUtils";

import { useGroups } from "../hooks/useGroups";
import type { Group } from "../data_types/event";

import {
  MobileEventDetails as EventDetailsModal,
  MobileDeadlineDetails as DeadlineDetailsModal,
} from "./MobileDetails";


function midnight(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function sameDay(a: Date, b: Date) {
  return midnight(a).getTime() === midnight(b).getTime();
}

type Card = {
  key: string;
  name: string;
  time: Date;
  color: string;
  kind: "Event" | "Deadline";
  allDay: boolean;
  recurrence: string;
  group?: Group;
  id: string;
};

export function MobileEvents({ userId }: { userId: string | null }) {
  const { events } = useEvents(userId);
  const { deadlines } = useDeadlines(userId);
  const { groups } = useGroups();
  const [day, setDay] = useState(() => midnight(new Date()));
  const [now, setNow] = useState(() => new Date());

  const [selected, setSelected] = useState<Card | null>(null);


  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function changeDay(amount: number) {
    setDay((previous) => {
      const next = new Date(previous);
      next.setDate(next.getDate() + amount);
      return next;
    });
  }

  if (!userId) {
    return (
      <section className="mobile-page">
        <h2>Your schedule</h2>
        <p>Sign in below to see your events and deadlines.</p>
      </section>
    );
  }

  const cards: Card[] = [];

  for (const event of events) {
    if (!eventOccursOnDay(event, day)) continue;

    // Preserve the actual start for events spanning multiple days.
    const start =
      event.recurrence.type === "never"
        ? event.startTime
        : getEventOccurrence(event, day)!.startTime;

    let recurrence = "";

    switch (event.recurrence.type) {
      case "daily":
        recurrence = "Daily";
        break;
      case "weekly":
        recurrence = `Weekly · ${event.recurrence.days
          .map((value) => value[0].toUpperCase() + value.slice(1))
          .join(", ")}`;
        break;
      case "monthly":
        recurrence = `Monthly · Day ${event.recurrence.dayOfMonth}`;
        break;
    }

    cards.push({
      key: `event-${event.id}`,
      name: event.name,
      time: start,
      color: event.color,
      kind: "Event",
      allDay: event.allDay,
      recurrence,
      group: groups.find((group) => group.id === event.groupId),
      id: event.id,
    });
  }

  for (const deadline of deadlines) {
    if (!sameDay(deadline.dueTime, day)) continue;

    cards.push({
      key: `deadline-${deadline.id}`,
      name: deadline.name,
      time: deadline.dueTime,
      color: deadline.color,
      kind: "Deadline",
      allDay: false,
      recurrence: "",   
      group: groups.find((group) => group.id === deadline.groupId),
      id: deadline.id,
    });
  }

  cards.sort((a, b) => a.time.getTime() - b.time.getTime());

  const today = midnight(now).getTime();

  function isPast(card: Card) {
    if (day.getTime() < today) return true;
    if (day.getTime() > today) return false;
    return !card.allDay && card.time.getTime() < now.getTime();
  }

  const upcoming = cards.filter((card) => !isPast(card));
  const past = cards.filter(isPast);

  function renderSection(title: string, items: Card[], faded = false) {
  if (!items.length) return null;

  return (
    <section className={`mobile-event-section ${faded ? "is-past" : ""}`}>
      <h3>{title}</h3>

      {items.map((card) => (
       <button
        type="button"
        className="mobile-event-card"
        key={card.key}
        onClick={() => setSelected(card)}
        >
          <div className="mobile-event-content">
           <span className="mobile-event-tag">{card.kind}</span>

            <time dateTime={card.time.toISOString()}>
                {card.allDay
                    ? "All day"
                    : card.time.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                    })}
            </time>
            <h4 style={{ color: card.color || "var(--color-text)" }}>
            {card.name}
            </h4>

            {card.group && (
              <div
                className="mobile-event-group"
                style={{ color: card.group.color }}
              >
                <span aria-hidden="true" />
                {card.group.name}
              </div>
            )}

            {card.recurrence && <p>{card.recurrence}</p>}
          </div>

          <svg
            className="mobile-event-link-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </button>
      ))}
    </section>
  );
}
const selectedEvent =
  selected?.kind === "Event"
    ? events.find((event) => event.id === selected.id)
    : undefined;

const selectedDeadline =
  selected?.kind === "Deadline"
    ? deadlines.find((deadline) => deadline.id === selected.id)
    : undefined;

  return (
    <>
    <section className="mobile-page">
      <div className="mobile-day-selector">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => changeDay(-1)}
        >
          ‹
        </button>

        <div>
          <h2>
            {day.toLocaleDateString(undefined, { weekday: "long" })}
          </h2>
          <p>
            {day.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <button
          type="button"
          aria-label="Next day"
          onClick={() => changeDay(1)}
        >
          ›
        </button>
      </div>

      {renderSection("Upcoming", upcoming)}
      {renderSection("Past", past, true)}

      {!cards.length && (
        <div className="mobile-empty-day">
          <h4>You got nothing today! Bum.</h4>
          <p>Enjoy the free time.</p>
        </div>
      )}
    </section>
        {selected && selectedEvent && (
        <EventDetailsModal
            event={{
            ...selectedEvent,
            startTime: selected.time,
            }}
            onClose={() => setSelected(null)}
        />
        )}

        {selectedDeadline && (
        <DeadlineDetailsModal
            deadline={selectedDeadline}
            onClose={() => setSelected(null)}
        />
        )}
    </>
  );
}