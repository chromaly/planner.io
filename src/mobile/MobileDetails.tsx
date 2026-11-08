import { useNavigate } from "react-router-dom";
import { EventDetailsModal } from "../components/EventDetailsModal";
import { DeadlineDetailsModal } from "../components/DeadlinesDetailsModal";

import type { Event } from "../data_types/event";
import type { Deadline } from "../data_types/deadline";

export function MobileEventDetails({
  event,
  onClose,
}: {
  event: Event;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <EventDetailsModal
      event={event}
      onClose={onClose}
      onOpenCalendar={() => {
        onClose();

        navigate("/calendar", {
          state: { selectedEventId: event.id },
        });
      }}
    />
  );
}

export function MobileDeadlineDetails({
  deadline,
  onClose,
}: {
  deadline: Deadline;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <DeadlineDetailsModal
      deadline={deadline}
      onClose={onClose}
      onOpenCalendar={() => {
        onClose();

        navigate("/calendar", {
          state: { selectedDeadlineId: deadline.id },
        });
      }}
    />
  );
}