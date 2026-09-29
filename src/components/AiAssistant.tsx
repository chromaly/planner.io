import { useState, useEffect, useRef } from "react"

import { model } from "../firebase"

import type { Event, Recurrence, Importance } from "../data_types/event"

type AiMessage = {
  role: "user" | "ai"
  content: string
}

type AiEvent = {
  title: string
  date: string
  startTime: string
  durationMinutes: number
  recurrence: Recurrence
  importance: Importance
  location: string
  confirmation?: boolean
}

type AiSearch = {
  date: string | null
  durationMinutes: number | null
}

type AiEdit = {
  eventId: string
  changes: {
    title: string | null
    date: string | null
    startTime: string | null
    durationMinutes: number | null
    recurrence: Recurrence | null
    importance: Importance | null
    location: string | null
  }
  confirmation?: boolean
}

type AiResponse = {
  intent: string
  response: string
  search?: AiSearch
  event?: AiEvent
  edit?: AiEdit
}

type AiAssistantProps = {
  events: Event[]
  handleAIEvent: (event: AiEvent) => Promise<{
    success: boolean
    message?: string
  }>
  handleAIEdit: (edit: AiEdit) => Promise<{
    success: boolean
    message?: string
  }>
  findAvailableTimes: (
    events: Event[],
    date: Date,
    durationMinutes: number
  ) => { start: Date; end: Date }[]
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  pendingEvent: { event: Event, isEditing: boolean } | null
  clearPendingEvent: () => void
}

export function AiAssistant({
  events,
  handleAIEvent,
  handleAIEdit,
  findAvailableTimes,
  isOpen,
  setIsOpen,
  pendingEvent,
  clearPendingEvent,
}: AiAssistantProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [chat, setChat] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  function formatEventsForAI(events: Event[]) {
    return events.map((event) => ({
      id: event.id,
      name: event.name,
      date:
        `${event.startTime.getFullYear()}-` +
        `${String(
          event.startTime.getMonth() + 1
        ).padStart(2, "0")}-` +
        `${String(
          event.startTime.getDate()
        ).padStart(2, "0")}`,
      startTime:
        `${String(
          event.startTime.getHours()
        ).padStart(2, "0")}:` +
        `${String(
          event.startTime.getMinutes()
        ).padStart(2, "0")}`,
      duration: event.duration,
      recurrence: event.recurrence,
      importance: event.importance,
      location: event.location,
    }))
  }
  async function sendInternalMessage(text: string) {
    if (!chat) return null

    const today = new Date().toISOString().split("T")[0]

    try {
      const result = await chat.sendMessage(
        `Today's date is ${today}. Current calendar events: ${JSON.stringify(
          formatEventsForAI(events)
        )}. ${text}`
      )

      const data =
        JSON.parse(result.response.text()) as AiResponse

      return await processAIResponse(data)
    } catch (error) {
      console.error("INTERNAL AI ERROR:", error)
      return null
    }
  }

  async function processAIResponse(data: AiResponse) {
    if (data.intent === "FIND_FREE_TIME") {
      const search = data.search

      console.log("DATE", search?.date)

      if (
        search &&
        search.date !== null &&
        search.durationMinutes !== null
      ) {
        const [year, month, day] =
          search.date.split("-").map(Number)

        const date = new Date(year, month - 1, day)

        const availableTimes = findAvailableTimes(
          events,
          date,
          search.durationMinutes
        )

        console.log("AVAILABLE:", availableTimes)

        if (availableTimes.length === 0) {
          data.response =
            "You don't have enough free time for that on this day."
        } else {
          const formattedTimes = availableTimes.map(
            (slot) => {
              const start =
                slot.start.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })

              const end =
                slot.end.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })

              return `${start}–${end}`
            }
          )

          data.response =
            `You're free during these times: ${formattedTimes.join(
              ", "
            )}.`
        }
      }
    } else if (data.intent === "CREATE_EVENT") {
      const event = data.event

      if (!event) {
        throw new Error(
          "CREATE_EVENT response did not contain an event."
        )
      }

      const eventComplete =
        event.title !== null &&
        event.date !== null &&
        event.startTime !== null &&
        event.durationMinutes !== null &&
        event.recurrence !== null &&
        event.location !== null &&
        event.importance !== null

      if (eventComplete && event.confirmation) {
        const eventResult = await handleAIEvent(event)

        console.log("RESULT:", eventResult)

        if (!eventResult.success) {
          data.response = eventResult.message ?? ""
        }
      }
    } else if (data.intent === "EDIT_EVENT") {
      if (data.edit?.confirmation) {
        try {
          const eventResult =
            await handleAIEdit(data.edit)

          if (!eventResult.success) {
            data.response =
              eventResult.message ?? ""
          }
        } catch (error) {
          console.error("AI EDIT ERROR:", error)

          data.response =
            "I couldn't update that event."
        }
      }
    }

    return data
  }

  async function sendMessage(text: string = message) {
    if (!text.trim() || !chat) return

    const userMessage = text

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ])

    const today =
      new Date().toISOString().split("T")[0]

    setMessage("")

    console.log(
      "starting to try chatbot response..."
    )

    try {
      const result = await chat.sendMessage(
        `Today's date is ${today}. Current calendar events: ${JSON.stringify(
          formatEventsForAI(events)
        )}. User message: ${userMessage}`
      )

      const aiResponse = result.response.text()

      const data =
        JSON.parse(aiResponse) as AiResponse

      await processAIResponse(data)

      const aiMessage = data.response

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: aiMessage,
        },
      ])
    } catch (error) {
      console.log("ERROR:", error)

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Sorry, something went wrong. Try again.",
        },
      ])
    }
  }

  useEffect(() => {
    if (isOpen && !chat) {
      const newChat = model.startChat()
      setChat(newChat)
    }
  }, [isOpen, chat])

  useEffect(() => {
    console.log("AI EFFECT:", {
      isOpen,
      chat,
      pendingEvent,
    })

    if (isOpen && chat && pendingEvent) {
      console.log("ALL CONDITIONS PASSED")

      const date =
        `${pendingEvent.event.startTime.getFullYear()}-` +
        `${String(
          pendingEvent.event.startTime.getMonth() + 1
        ).padStart(2, "0")}-` +
        `${String(
          pendingEvent.event.startTime.getDate()
        ).padStart(2, "0")}`

      const time = pendingEvent.event.startTime
        .toTimeString()
        .slice(0, 5)

      const prompt = `
        I just tried to ${pendingEvent.isEditing ? "edit an existing" : "create a new "}, but it conflicts with my calendar.

          ${pendingEvent.isEditing
            ? `IMPORTANT: This is an EDIT to an existing event.
              Do NOT create a new event.
              If the user chooses a different time, return EDIT_EVENT
              using the existing event ID: ${pendingEvent.event.id}`
            : `This is a new event. Do not create it yet.`}

        Event:
        Title: ${pendingEvent.event.name}
        Date: ${date}
        Start time: ${time}
        Duration: ${pendingEvent.event.duration} minutes
        Recurrence: ${JSON.stringify(pendingEvent.event.recurrence)}
        Location: ${pendingEvent.event.location}
        Importance: ${pendingEvent.event.importance}

        Please help me find another available time for this event.
        First check my calendar for available times.
        Do not create the event yet. Ask me to confirm a new time first.
      `

      async function run() {
        const data =
          await sendInternalMessage(prompt)

        if (data) {
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              content: data.response,
            },
          ])
        }

        clearPendingEvent()
      }

      run()
    }
  }, [isOpen, chat, pendingEvent])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-2 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? "scale-0 opacity-0 pointer-events-none"
            : ""
        }`}
      >
        <span className="text-xl">✦</span>
      </button>

      <div
        className={`
          fixed top-0 right-0 z-50
          h-screen w-full md:w-[350px]
          bg-surface
          border-l border-white/10
          shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-out
          overflow-y-auto
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          pt-[env(safe-area-inset-top)]
        `}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider/10">
          <div>
            <h2 className="text-text font-semibold">
              AI Assistant
            </h2>

            <p className="text-text/40 text-xs mt-1">
              Your Personal Calendar Helper.
            </p>

            <p className="text-text/40 text-xs mt-1">
              So cute.
            </p>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="text-text/40 hover:text-text transition-colors text-xl"
            aria-label="Close AI assistant"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-3xl mb-3">
                  ✦
                </div>

                <h3 className="text-text font-medium">
                  How can I help?
                </h3>

                <p className="text-text/40 text-sm mt-2 max-w-[260px]">
                  Ask me to find time, organize your
                  schedule, or manage your calendar.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`
                    max-w-[80%]
                    px-4 py-3
                    rounded-2xl
                    text-sm
                    ${
                      msg.role === "user"
                        ? "bg-accent-2 text-white/90 rounded-br-md"
                        : "bg-accent-1 text-white/90 rounded-bl-md"
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 bg-bg/5 border border-divider/10 rounded-xl px-3 py-2 focus-within:border-accent-2/60 transition-colors">
            <input
              type="text"
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage()
                }
              }}
              placeholder="Ask about your schedule..."
              className="flex-1 bg-transparent border-0 focus:border-0 outline-none focus:outline-none focus:ring-0 text-text text-base placeholder:text-text/30"
            />

            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!message.trim()}
              className="text-accent-2 disabled:text-text/20 transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  )
}