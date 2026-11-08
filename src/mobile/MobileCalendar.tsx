import { useEffect, useState } from "react";
import { MonthGrid } from "../components/MonthGrid";
import type { Event } from "../data_types/event";
import type { Deadline } from "../data_types/deadline";

type Props = {
  day: Date;
  events: Event[];
  deadlines: Deadline[];
  onDayClick: (day: Date) => void;
  onDeadlineClick: (deadline: Deadline) => void;
  onEventClick: (event: Event, day: Date) => void;
};

export function MobileCalendar({
  day,
  events,
  deadlines,
  onDayClick,
  onDeadlineClick,
  onEventClick,
}: Props) {
  const [month, setMonth] = useState(
    () => new Date(day.getFullYear(), day.getMonth(), 1),
  );

  useEffect(() => {
    setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  }, [day]);

  function changeMonth(amount: number) {
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  }

  return (
    <section className="mobile-calendar-panel">
      <div className="mobile-calendar-heading">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => changeMonth(-1)}
        >
          ‹
        </button>

        <h3>
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => changeMonth(1)}
        >
          ›
        </button>
      </div>

      <MonthGrid
        selectedMonth={month}
        events={events}
        deadlines={deadlines}
        onDayClick={onDayClick}
        onDeadlineClick={onDeadlineClick}
        onEventClick={onEventClick}
      />
    </section>
  );
}