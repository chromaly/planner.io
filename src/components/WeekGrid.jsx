import { eventOccursOnDay, getEventPosition, hexToRgba } from './EventHelpers'

export function WeekGrid({ events, weekDays, hours, onEventClick }) {
  return (
    <div className="border border-divider/10 rounded-lg shadow-lg shadow-black/15 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">

          {/* Header */}
          <div className="flex border-b border-divider/10 bg-surface">
            <div className="w-16 flex-shrink-0" />

            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div
                key={d}
                className="flex-1 text-center text-xs py-2 text-text/60"
              >
                {d}
              </div>
            ))}
          </div>


          {/* Vertical scrolling body */}
          <div
            className="overflow-y-auto"
            style={{ height: '600px' }}
          >

            <div
              className="flex"
              style={{ height: '960px' }}
            >

              {/* Time gutter */}
              <div className="w-16 flex-shrink-0">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="relative"
                    style={{ height: '60px' }}
                  >
                    <span className="text-xs text-text/40 absolute right-2">
                      {hour === 12
                        ? '12pm'
                        : hour < 12
                          ? `${hour}am`
                          : `${hour - 12}pm`}
                    </span>
                  </div>
                ))}
              </div>


              {/* Day columns */}
              {weekDays.map(day => {

                const dayEvents = events.filter(e => {
                  return eventOccursOnDay(e, day)
                })

                return (
                  <div
                    key={day.toDateString()}
                    className="flex-1 relative border-l border-divider/10"
                  >

                    {hours.map(hour => (
                      <div
                        key={hour}
                        className="border-t border-divider/10"
                        style={{ height: '60px' }}
                      />
                    ))}

                    {dayEvents.map(event => {

                      const pos = getEventPosition(event)

                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className="absolute left-1 right-1 rounded-lg px-1 py-0.5 text-xs overflow-hidden flex items-center transition-transform duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-rotate-2 active:scale-90 active:rotate-1"
                          style={{
                            top: pos.top,
                            height: pos.height,
                            backgroundColor: hexToRgba(event.color, 0.8)
                          }}
                        >
                          {event.name}
                        </div>
                      )
                    })}

                  </div>
                )
              })}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}