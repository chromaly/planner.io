import { useState, useEffect, useRef } from "react"

import { model } from "../firebase"

import type {
  Event,
  Recurrence,
  Importance,
} from "../data_types/event"

import type { Deadline } from "../data_types/deadline"

type AiMessage = {
  role: "user" | "ai"
  content: string
}

type AiEvent = {
  title: string | null
  date: string | null
  startTime: string | null
  durationMinutes: number | null
  allDay: boolean
  recurrence: Recurrence
  importance: Importance | null
  location: string | null
  notes: string | null
  confirmation?: boolean
  conflictAccepted?: boolean
}

type AiDeadline = {
  title: string | null
  date: string | null
  dueTime: string | null
  importance: Importance | null
  notes: string | null
  confirmation: boolean
  conflictAccepted: boolean
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
    allDay: boolean | null
    recurrence: Recurrence | null
    importance: Importance | null
    location: string | null
    notes: string | null
  }
  confirmation?: boolean
  conflictAccepted?: boolean
}

type AiDeadlineEdit = {
  deadlineId: string
  changes: {
    title: string | null
    date: string | null
    dueTime: string | null
    importance: Importance | null
    notes: string | null
  }
  confirmation?: boolean
}

type AiResponse = {
  intent: string
  response: string
  search?: AiSearch
  event?: AiEvent
  deadline?: AiDeadline
  edit?: AiEdit
  deadlineEdit?: AiDeadlineEdit
}

type AiAssistantProps = {
  events: Event[]
  deadlines: Deadline[]

  handleAIEvent: (
    event: AiEvent
  ) => Promise<{
    success: boolean
    message?: string
  }>

  handleAIEdit: (
    edit: AiEdit
  ) => Promise<{
    success: boolean
    message?: string
  }>

  handleAIDeadline: (
    deadline: AiDeadline
  ) => Promise<{
    success: boolean
    message?: string
  }>

  handleAIDeadlineEdit: (
    edit: AiDeadlineEdit
  ) => Promise<{
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

  pendingEvent: {
    event: Event
    isEditing: boolean
  } | null

  clearPendingEvent: () => void
}

export function AiAssistant({
  events,
  deadlines,
  handleAIEvent,
  handleAIEdit,
  handleAIDeadline,
  handleAIDeadlineEdit,
  findAvailableTimes,
  isOpen,
  setIsOpen,
  pendingEvent,
  clearPendingEvent,
}: AiAssistantProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [chat, setChat] = useState<any>(null)

  // Deadline waiting for conflict confirmation.
  const [pendingDeadline, setPendingDeadline] =
    useState<AiDeadline | null>(null)

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null)

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
      notes: event.notes,
    }))
  }

  function formatDeadlinesForAI(
    deadlines: Deadline[]
  ) {
    return deadlines.map((deadline) => ({
      id: deadline.id,
      name: deadline.name,
      dueTime: deadline.dueTime.toISOString(),
      importance: deadline.importance,
      notes: deadline.notes,
      completed: deadline.completed,
    }))
  }

  function getCalendarContext() {
    return `
      Current calendar events:
      ${JSON.stringify(formatEventsForAI(events))}

      Current deadlines:
      ${JSON.stringify(formatDeadlinesForAI(deadlines))}
    `
  }

  function isConfirmation(text: string) {
    const normalized = text
      .trim()
      .toLowerCase()
      .replace(/[.!?]+$/, "")

    return [
      "yes",
      "yeah",
      "yep",
      "yup",
      "sure",
      "okay",
      "ok",
      "do it",
      "go ahead",
      "create it",
      "create it anyway",
      "that's fine",
      "thats fine",
      "yes please",
      "yeah thats fine",
      "yeah that's fine",
    ].includes(normalized)
  }

  function isRejection(text: string) {
    const normalized = text
      .trim()
      .toLowerCase()
      .replace(/[.!?]+$/, "")

    return [
      "no",
      "nope",
      "nah",
      "cancel",
      "cancel it",
      "don't",
      "dont",
      "don't create it",
      "dont create it",
      "never mind",
      "nevermind",
    ].includes(normalized)
  }

  async function sendInternalMessage(text: string) {
    if (!chat) return null

    const today =
      new Date().toISOString().split("T")[0]

    try {
      const result = await chat.sendMessage(
        `Today's date is ${today}.
        ${getCalendarContext()}
        ${text}`
      )

      const data =
        JSON.parse(
          result.response.text()
        ) as AiResponse

      return await processAIResponse(data)
    } catch (error) {
      console.error(
        "INTERNAL AI ERROR:",
        error
      )

      return null
    }
  }

  async function processAIResponse(
    data: AiResponse
  ) {
    if (data.intent === "FIND_FREE_TIME") {
      const search = data.search

      if (
        search &&
        search.date !== null &&
        search.durationMinutes !== null
      ) {
        const [year, month, day] =
          search.date.split("-").map(Number)

        const date = new Date(
          year,
          month - 1,
          day
        )

        const availableTimes =
          findAvailableTimes(
            events,
            date,
            search.durationMinutes
          )

        if (availableTimes.length === 0) {
          data.response =
            "You don't have enough free time for that on this day."
        } else {
          const formattedTimes =
            availableTimes.map((slot) => {
              const start =
                slot.start.toLocaleTimeString(
                  [],
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )

              const end =
                slot.end.toLocaleTimeString(
                  [],
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )

              return `${start}–${end}`
            })

          data.response =
            `You're free during these times: ${formattedTimes.join(
              ", "
            )}.`
        }
      }
    }

    else if (
      data.intent === "CREATE_EVENT"
    ) {
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
        event.importance !== null &&
        event.notes !== null

      if (
        eventComplete &&
        event.confirmation
      ) {
        const result =
          await handleAIEvent(event)

        if (!result.success) {
          data.response =
            result.message ?? ""
        }
      }
    }

    else if (
      data.intent === "EDIT_EVENT"
    ) {
      if (
        data.edit?.confirmation
      ) {
        try {
          const result =
            await handleAIEdit(
              data.edit
            )

          if (!result.success) {
            data.response =
              result.message ?? ""
          }
        } catch (error) {
          console.error(
            "AI EDIT ERROR:",
            error
          )

          data.response =
            "I couldn't update that event."
        }
      }
    }

    else if (
      data.intent === "CREATE_DEADLINE"
    ) {
      const deadline =
        data.deadline

      if (!deadline) {
        throw new Error(
          "CREATE_DEADLINE response did not contain a deadline."
        )
      }

      const deadlineComplete =
        deadline.title !== null &&
        deadline.date !== null &&
        deadline.dueTime !== null

      if (
        deadlineComplete &&
        deadline.confirmation
      ) {
        const result =
          await handleAIDeadline(
            deadline
          )

        if (!result.success) {
          // The application detected a conflict.
          // Save the exact deadline so the user's
          // next "yes" can approve THIS deadline.
          if (
            result.message?.startsWith(
              "This conflicts with"
            )
          ) {
            setPendingDeadline({
              ...deadline,
              conflictAccepted: false,
            })
          }

          data.response =
            result.message ?? ""
        } else {
          setPendingDeadline(null)
        }
      }
    }

    else if (
      data.intent === "EDIT_DEADLINE"
    ) {
      if (
        data.deadlineEdit?.confirmation
      ) {
        try {
          const result =
            await handleAIDeadlineEdit(
              data.deadlineEdit
            )

          if (!result.success) {
            data.response =
              result.message ?? ""
          }
        } catch (error) {
          console.error(
            "AI DEADLINE EDIT ERROR:",
            error
          )

          data.response =
            "I couldn't update that deadline."
        }
      }
    }

    return data
  }

  async function sendMessage(
    text: string = message
  ) {
    if (!text.trim() || !chat) return

    const userMessage = text

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ])

    setMessage("")

    /*
     * Handle deadline conflict confirmation
     * directly in the application.
     *
     * We intentionally do this BEFORE sending
     * "yes" to Gemini. Gemini does not need to
     * figure out what "yes" refers to.
     */
    if (pendingDeadline) {
      if (isConfirmation(userMessage)) {
        const confirmedDeadline: AiDeadline = {
          ...pendingDeadline,
          confirmation: true,
          conflictAccepted: true,
        }

        setPendingDeadline(null)

        try {
          const result =
            await handleAIDeadline(
              confirmedDeadline
            )

          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              content:
                result.message ??
                `Created deadline "${confirmedDeadline.title}".`,
            },
          ])
        } catch (error) {
          console.error(
            "AI DEADLINE CONFIRMATION ERROR:",
            error
          )

          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              content:
                "I couldn't create that deadline.",
            },
          ])
        }

        return
      }

      if (isRejection(userMessage)) {
        setPendingDeadline(null)

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              "Okay, I won't create that deadline.",
          },
        ])

        return
      }
    }

    const today =
      new Date().toISOString().split("T")[0]

    try {
      const result =
        await chat.sendMessage(
          `Today's date is ${today}.
          ${getCalendarContext()}
          User message: ${userMessage}`
        )

      const data =
        JSON.parse(
          result.response.text()
        ) as AiResponse

      await processAIResponse(data)

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.response,
        },
      ])
    } catch (error) {
      console.error(
        "AI ERROR:",
        error
      )

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
      const newChat =
        model.startChat()

      setChat(newChat)
    }
  }, [isOpen, chat])

  useEffect(() => {
    if (
      !isOpen ||
      !chat ||
      !pendingEvent
    ) {
      return
    }

    const date =
      `${pendingEvent.event.startTime.getFullYear()}-` +
      `${String(
        pendingEvent.event.startTime.getMonth() + 1
      ).padStart(2, "0")}-` +
      `${String(
        pendingEvent.event.startTime.getDate()
      ).padStart(2, "0")}`

    const time =
      pendingEvent.event.startTime
        .toTimeString()
        .slice(0, 5)

    const prompt = `
      The application detected a conflict with
      the user's requested event.

      ${
        pendingEvent.isEditing
          ? `
            This is an EDIT to an existing event.
            Do NOT create a new event.
            Existing event ID:
            ${pendingEvent.event.id}
          `
          : `
            This is a new event.
            Do not create it yet.
          `
      }

      Requested event:
      Title: ${pendingEvent.event.name}
      Date: ${date}
      Start time: ${time}
      Duration: ${pendingEvent.event.duration} minutes
      Recurrence: ${JSON.stringify(
        pendingEvent.event.recurrence
      )}
      Location: ${pendingEvent.event.location}
      Importance: ${pendingEvent.event.importance}
      Notes: ${pendingEvent.event.notes}

      The application will provide the conflicting
      calendar items in the calendar context.

      Tell the user which existing event or events
      conflict with this requested event.

      Ask whether they want to ${
        pendingEvent.isEditing
          ? "keep the edit"
          : "create the event anyway"
      }.

      Do NOT suggest another time.
      Do NOT create or modify anything yet.
      Wait for the user's confirmation.
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
  }, [
    isOpen,
    chat,
    pendingEvent,
  ])

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
          ${
            isOpen
              ? "translate-x-0"
              : "translate-x-full"
          }
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
            onClick={() =>
              setIsOpen(false)
            }
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
            messages.map(
              (msg, index) => (
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
              )
            )
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
              onClick={() =>
                sendMessage()
              }
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