import { useState, useEffect, useRef } from "react"

import { model } from "../firebase"

export function AiAssistant( {events, handleAIEvent, handleAIEdit, findAvailableTimes, isOpen, setIsOpen, pendingEvent, clearPendingEvent } ) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [chat, setChat] = useState(null)
  const messagesEndRef = useRef(null)

  async function sendInternalMessage(text) {
    if (!chat) return

    const today = new Date().toISOString().split("T")[0]

    try {
        const result = await chat.sendMessage(
            `Today's date is ${today}. Current calendar events: ${JSON.stringify(events)}. ${text}`
        )
        return JSON.parse(result.response.text())
    } catch (error) {
        console.error("INTERNAL AI ERROR:", error)
        return null
    } 
  }
  async function sendMessage(text = message) {
    if (!text.trim() || !chat) return;

    const userMessage = text;
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);
    const today = new Date().toISOString().split("T")[0]

    setMessage("");
    console.log("starting to try chatbot response...")
    try {
        const result = await chat.sendMessage(`Today's date is ${today}. Current calendar events: ${JSON.stringify(events)}. User message: ${userMessage}`)
        const aiResponse = result.response.text()
        const data = JSON.parse(aiResponse)
        if (data.intent === "FIND_FREE_TIME") {
            const search = data.search
            console.log("DATE", search.date)
            const searchComplete = 
                search.date !== null &&
                search.durationMinutes !== null
            
            if (searchComplete){
                const [year, month, day] = search.date.split("-").map(Number)

                const date = new Date(year, month - 1, day)
                const availableTimes = findAvailableTimes(date, search.durationMinutes)

                console.log("AVAILABLE:", availableTimes)

                if (availableTimes.length === 0){
                    data.response = "You don't have enough free time for that on this day."
                }else{
                    const formattedTimes = availableTimes.map(slot => {
                        const start = slot.start.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit"
                        })

                        const end = slot.end.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit"
                        })

                        return `${start}–${end}`
                    })
                    data.response = `You're free during these times: ${formattedTimes.join(", ")}.`
                }
            }
        } else if (data.intent === "CREATE_EVENT") {
            const event = data.event

            const eventComplete =
                event.title !== null &&
                event.date !== null &&
                event.startTime !== null &&
                event.durationMinutes !== null &&
                event.repeatable !== null &&
                event.location !== null &&
                event.importance !== null

            if (eventComplete && event.confirmation) {
                const eventResult = await handleAIEvent(event)
                console.log("RESULT:", eventResult)
                if (!eventResult.success) {
                    data.response = eventResult.message
                }
            }

        } else if (data.intent === "EDIT_EVENT") {
            if (data.edit.confirmation){
                try {
                const eventResult = await handleAIEdit(data.edit)

                if (!eventResult.success) {
                    data.response = eventResult.message
                }
                } catch (error) {
                    console.error("AI EDIT ERROR:", error)
                    data.response = "I couldn't update that event."
                }
            }
        }
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
                content: "Sorry, something went wrong. Try again.",
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
        pendingEvent
    })

    if (isOpen && chat && pendingEvent) {
        console.log("ALL CONDITIONS PASSED")

        const date =
            `${pendingEvent.startTime.getFullYear()}-` +
            `${String(pendingEvent.startTime.getMonth() + 1).padStart(2, "0")}-` +
            `${String(pendingEvent.startTime.getDate()).padStart(2, "0")}`

        const time = pendingEvent.startTime.toTimeString().slice(0, 5)

        const prompt = `
            I just tried to create this event, but it conflicts with my calendar.

            Event:
            Title: ${pendingEvent.name}
            Date: ${date}
            Start time: ${time}
            Duration: ${pendingEvent.duration} minutes
            Repeat: ${pendingEvent.repeatable}
            Location: ${pendingEvent.location}
            Importance: ${pendingEvent.importance}

            Please help me find another available time for this event.
            First check my calendar for available times.
            Do not create the event yet. Ask me to confirm a new time first.
            `

        async function run() {
            clearPendingEvent()
            const data = await sendInternalMessage(prompt)

            if (data) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "ai",
                        content: data.response,
                    },
                ])
            }
        }

        run()
        }
    }, [isOpen, chat, pendingEvent])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        })
    }, [messages])

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-2 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? "scale-0 opacity-0 pointer-events-none" : ""}`}>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-3xl mb-3">✦</div>

                <h3 className="text-text font-medium">
                  How can I help?
                </h3>

                <p className="text-text/40 text-sm mt-2 max-w-[260px]">
                  Ask me to find time, organize your schedule,
                  or manage your calendar.
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

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 bg-bg/5 border border-divider/10 rounded-xl px-3 py-2 focus-within:border-accent-2/60 transition-colors">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask about your schedule..."
              className="flex-1 bg-transparent border-0 focus:border-0 outline-none focus:outline-none focus:ring-0 text-text text-base placeholder:text-text/30"
            />

            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="text-accent-2 disabled:text-text/20 transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
}