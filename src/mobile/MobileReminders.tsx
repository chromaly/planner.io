import { useEffect, useRef, useState } from "react";
import { useEvents } from "../hooks/useEvents";
import { useDeadlines } from "../hooks/useDeadlines";
import { useGroups } from "../hooks/useGroups";
import { getEventOccurrence } from "../utils/eventUtils";
import { EventColorIndicator } from "../components/EventColorIndicator";
import type { Importance } from "../data_types/event";

import {
  MobileEventDetails as EventDetailsModal,
  MobileDeadlineDetails as DeadlineDetailsModal,
} from "./MobileDetails";


type View = "today" | "importance" | "group";

type Item = {
  id: string;
  kind: "event" | "deadline";
  name: string;
  date: Date;
  importance: Importance;
  color: string;
  groupId: string | null;
  completed: boolean;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MobileReminders({ userId }: { userId: string | null }) {
  const { events } = useEvents(userId);
  const { deadlines } = useDeadlines(userId);
  const { groups } = useGroups();

  const [view, setView] = useState<View>("today");
  const [showEvents, setShowEvents] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const [selected, setSelected] = useState<Item | null>(null);

  const [fading, setFading] = useState(false);
    const transitionTimer = useRef<number | null>(null);

    useEffect(() => {
    return () => {
        if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
        }
    };
    }, []);

    function transitionTo(change: () => void) {
    if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
        transitionTimer.current = null;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        change();
        setFading(false);
        return;
    }

    setFading(true);

    transitionTimer.current = window.setTimeout(() => {
        change();
        setFading(false);
        transitionTimer.current = null;
    }, 120);
    }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!userId) {
    return (
      <section className="mobile-page">
        <h2>Reminders</h2>
        <p>Sign in below to see your reminders.</p>
      </section>
    );
  }

  const items: Item[] = [];

  if (showEvents) {
    for (const event of events) {
      const occurrence =
        view === "today" ? getEventOccurrence(event, now) : null;

      if (view === "today" && !occurrence) continue;

      items.push({
        id: event.id,
        kind: "event",
        name: event.name,
        date: occurrence?.startTime ?? event.startTime,
        importance: event.importance,
        color: event.color,
        groupId: event.groupId,
        completed: false,
      });
    }
  }

  if (showDeadlines) {
    for (const deadline of deadlines) {
      if (hideCompleted && deadline.completed) continue;
      if (view === "today" && !sameDay(deadline.dueTime, now)) continue;

      items.push({
        id: deadline.id,
        kind: "deadline",
        name: deadline.name,
        date: deadline.dueTime,
        importance: deadline.importance,
        color: deadline.color,
        groupId: deadline.groupId,
        completed: deadline.completed,
      });
    }
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime());

  function renderRows(rows: Item[]) {
    return rows.map((item) => {
      const group = groups.find((group) => group.id === item.groupId);

      return (
       <button
        type="button"
        key={`${item.kind}-${item.id}`}
        className={`mobile-reminder-row ${
            item.completed ? "is-completed" : ""
        }`}
        onClick={() => setSelected(item)}
        >
          <EventColorIndicator
            eventColor={item.color}
            groupColor={group?.color ?? null}
            variant="reminder"
          />

          <div className="mobile-reminder-content">
            <div className="mobile-reminder-title">
              <h4>{item.name}</h4>
              <span className="mobile-event-tag">{item.kind}</span>
            </div>

            <time dateTime={item.date.toISOString()}>
              {item.kind === "deadline" ? "Due " : ""}
              {item.date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
              {item.kind === "deadline" &&
                ` · ${item.date.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}`}
            </time>
          </div>

          <span className="mobile-reminder-arrow" aria-hidden="true">
            ↗
          </span>
        </button>
      );
    });
  }

  function renderSection(
    title: string,
    rows: Item[],
    color?: string,
  ) {
    return (
      <section className="mobile-reminder-section" key={title}>
        <h3>
          {color && (
            <span
              className="mobile-reminder-group-dot"
              style={{ background: color }}
            />
          )}
          {title}
        </h3>

        {rows.length ? renderRows(rows) : <p>None</p>}
      </section>
    );
  }

  const knownGroups = new Set(groups.map((group) => group.id));
  const ungrouped = items.filter(
    (item) => !item.groupId || !knownGroups.has(item.groupId),
  );
const selectedEvent =
  selected?.kind === "event"
    ? events.find((event) => event.id === selected.id)
    : undefined;

const selectedDeadline =
  selected?.kind === "deadline"
    ? deadlines.find((deadline) => deadline.id === selected.id)
    : undefined;

  return (
    <>
    <section className="mobile-page mobile-reminders">
      <div className="mobile-reminder-filters">
        <button
          type="button"
          aria-pressed={showEvents}
         onClick={() =>
            transitionTo(() => setShowEvents((current) => !current))
            }
        >
          Events
        </button>

        <button
          type="button"
          aria-pressed={showDeadlines}
          onClick={() =>
            transitionTo(() => setShowDeadlines((current) => !current))
          }
        >
          Deadlines
        </button>

        {showDeadlines && (
          <button
            type="button"
            aria-pressed={hideCompleted}
            onClick={() =>
              transitionTo(() => setHideCompleted((current) => !current))
            }
          >
            Hide completed
          </button>
        )}
      </div>

      <div className="mobile-reminder-views" aria-label="Reminders view">
        {([
          ["today", "Today"],
          ["importance", "By Importance"],
          ["group", "By Group"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => {
              if (view !== value) {
                transitionTo(() => setView(value));
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
            <div
        className={`mobile-reminder-results ${
          fading ? "is-leaving" : ""
        }`}
      >
        <div
          key={`${view}-${showEvents}-${showDeadlines}-${hideCompleted}`}
          className="mobile-reminder-results-enter"
        >
          {view === "today" &&
            (items.length ? (
              renderRows(items)
            ) : (
              <div className="mobile-empty-day">
                <h4>Nothing here!</h4>
                <p>You're all caught up.</p>
              </div>
            ))}

          {view === "importance" && (
            <>
              {renderSection(
                "Very Important",
                items.filter((item) => item.importance === "very"),
              )}
              {renderSection(
                "Somewhat Important",
                items.filter((item) => item.importance === "somewhat"),
              )}
              {renderSection(
                "Not Too Important",
                items.filter((item) => item.importance === "not too"),
              )}
            </>
          )}

          {view === "group" && (
            <>
              {groups.map((group) =>
                renderSection(
                  group.name,
                  items.filter((item) => item.groupId === group.id),
                  group.color,
                ),
              )}
              {ungrouped.length > 0 &&
                renderSection("Ungrouped", ungrouped)}
            </>
          )}
        </div>
      </div>
        </section>

    {selected && selectedEvent && (
      <EventDetailsModal
        event={{
          ...selectedEvent,
          startTime: selected.date,
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