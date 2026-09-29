type EventColorIndicatorProps = {
  eventColor: string
  groupColor: string | null
  variant: "calendar" | "reminder"
}

export function EventColorIndicator({
  eventColor,
  groupColor,
  variant,
}: EventColorIndicatorProps) {
  const size = variant === "reminder" ? "w-3 h-3" : "w-full h-full"
  const shape = variant === "reminder" ? "rounded-full" : ""

  return (
    <div
      className={`relative ${size} ${shape} overflow-hidden flex-shrink-0`}
      style={{ backgroundColor: eventColor }}
    >
      {groupColor && (
        <div
          className={`absolute inset-0 ${shape}`}
          style={{
            backgroundColor: groupColor,
           clipPath:
            variant === "reminder"
                ? "polygon(100% 0, 100% 100%, 0 0)"
                : "polygon(55% 0, 100% 0, 100% 45%)",
          }}
        />
      )}
    </div>
  )
}