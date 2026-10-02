import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  Schema,
} from "firebase/ai"

import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check"

const firebaseConfig = {
  apiKey: "AIzaSyBLN3fK1oadrrtPy7HLrTFGRGLdyZPVpOw",
  authDomain: "planner-io-f4953.firebaseapp.com",
  projectId: "planner-io-f4953",
  storageBucket: "planner-io-f4953.firebasestorage.app",
  messagingSenderId: "494647055361",
  appId: "1:494647055361:web:367fd5a6a3bb144c1f1c00",
  measurementId: "G-2CWWQCD4Y2",
}

const app = initializeApp(firebaseConfig)

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    "6Ld2SqQtAAAAAD6P6downQcLGOdTiKtpg3v-ddpD"
  ),
  isTokenAutoRefreshEnabled: true,
})

if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}

const ai = getAI(app, {
  backend: new GoogleAIBackend(),
})

const recurrenceSchema = Schema.object({
  properties: {
    type: Schema.enumString({
      enum: [
        "never",
        "daily",
        "weekly",
        "monthly",
      ],
    }),

    days: Schema.array({
      items: Schema.enumString({
        enum: [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ],
      }),
      nullable: true,
    }),

    dayOfMonth: Schema.number({
      nullable: true,
    }),
  },
})

const importanceSchema = Schema.enumString({
  enum: ["very", "somewhat", "not too"],
  nullable: true,
})

const responseSchema = Schema.object({
  properties: {
    intent: Schema.enumString({
      enum: [
        "CHAT",
        "CREATE_EVENT",
        "EDIT_EVENT",
        "CREATE_DEADLINE",
        "EDIT_DEADLINE",
        "FIND_FREE_TIME",
      ],
    }),

    response: Schema.string(),

    event: Schema.object({
      properties: {
        title: Schema.string({ nullable: true }),
        date: Schema.string({ nullable: true }),
        startTime: Schema.string({ nullable: true }),
        durationMinutes: Schema.number({ nullable: true }),
        allDay: Schema.boolean(),

        recurrence: recurrenceSchema,

        location: Schema.string({ nullable: true }),
        importance: importanceSchema,
        notes: Schema.string({ nullable: true }),

        confirmation: Schema.boolean(),
        conflictAccepted: Schema.boolean(),
      },
    }),

    deadline: Schema.object({
      properties: {
        title: Schema.string({ nullable: true }),
        date: Schema.string({ nullable: true }),
        dueTime: Schema.string({ nullable: true }),
        importance: importanceSchema,
        notes: Schema.string({ nullable: true }),
        confirmation: Schema.boolean(),
        conflictAccepted: Schema.boolean(),
      },
    }),

    search: Schema.object({
      properties: {
        date: Schema.string(),
        durationMinutes: Schema.number(),
      },
    }),

    edit: Schema.object({
      properties: {
        eventId: Schema.string({ nullable: true }),

        changes: Schema.object({
          properties: {
            title: Schema.string({ nullable: true }),
            date: Schema.string({ nullable: true }),
            startTime: Schema.string({ nullable: true }),
            durationMinutes: Schema.number({ nullable: true }),
            allDay: Schema.boolean(),

            recurrence: recurrenceSchema,

            location: Schema.string({ nullable: true }),
            importance: importanceSchema,
            notes: Schema.string({ nullable: true }),
          },
        }),

        confirmation: Schema.boolean(),
        conflictAccepted: Schema.boolean(),
      },
    }),

    deadlineEdit: Schema.object({
      properties: {
        deadlineId: Schema.string({ nullable: true }),

        changes: Schema.object({
          properties: {
            title: Schema.string({ nullable: true }),
            date: Schema.string({ nullable: true }),
            dueTime: Schema.string({ nullable: true }),
            importance: importanceSchema,
            notes: Schema.string({ nullable: true }),
          },
        }),

        confirmation: Schema.boolean(),
      },
    }),
  },

  optionalProperties: [
    "event",
    "deadline",
    "search",
    "edit",
    "deadlineEdit",
  ],
})

export const model = getGenerativeModel(ai, {
  model: "gemini-3.5-flash-lite",

  systemInstruction: `
    You are an AI assistant for a personal calendar application.

    Classify every user message into exactly one of these intents:

    - CHAT: general conversation or questions
    - CREATE_EVENT: create or schedule an event
    - EDIT_EVENT: modify an existing event
    - CREATE_DEADLINE: create a deadline
    - EDIT_DEADLINE: modify an existing deadline
    - FIND_FREE_TIME: find an available time in the user's schedule

    GENERAL RULES:

    - Never invent information.
    - Never claim that an event or deadline has been created or modified.
    - The application, not you, performs the actual database operation.
    - Always provide a response to the user in the response field.
    - Ask only for information that is actually required.
    - Ask for one missing piece of information at a time unless multiple pieces are necessary to understand the request.

    CONVERSATION STATE:

  The conversation may contain multiple turns about the same event or deadline.

  When the user answers a follow-up question, treat their answer as an
  answer to the most recent unanswered piece of information requested by
  the assistant.

  Preserve all information about the current event or deadline from
  previous turns.

  Never discard information that was already provided.

  For example:

  User: "Make a deadline for today at 12 pm."
  Assistant: "What is the title?"
  User: "Finish my homework."

  The deadline should now contain:
  - date: today
  - dueTime: 12:00
  - title: Finish my homework

  The assistant must not ask for the date or time again.

  If the user says "today", interpret it as today's date using the
  current date provided by the application.

  If the user provides information that answers a previously requested
  field, update that field and preserve every other field already known.

    EVENT CREATION:

    Extract:

    - title
    - date in YYYY-MM-DD format
    - startTime
    - durationMinutes
    - allDay
    - recurrence
    - location
    - importance
    - notes

    If a value was not provided and cannot be determined from context, use null.

    Do not guess missing information.

    EVENT RECURRENCE:

    Always represent recurrence using this structure:

    Non-recurring:
    {
      "type": "never",
      "days": null,
      "dayOfMonth": null
    }

    Daily:
    {
      "type": "daily",
      "days": null,
      "dayOfMonth": null
    }

    Specific weekdays:
    {
      "type": "weekly",
      "days": ["monday", "wednesday", "friday"],
      "dayOfMonth": null
    }

    Monthly on a specific day:
    {
      "type": "monthly",
      "days": null,
      "dayOfMonth": 15
    }

    If the user says "weekly" without specifying a weekday or weekdays,
    ask which weekday or weekdays.

    Do not infer a weekday from the date unless the user explicitly says
    the event repeats on that weekday.

    Importance must be exactly one of:

    - "very"
    - "somewhat"
    - "not too"

    EVENT CONFIRMATION:

    When required information is missing, ask for it.

    When all required information is present, summarize the event and ask
    the user for confirmation.

    Set confirmation to false until the user clearly confirms.

    If the user clearly confirms the event, set confirmation to true.

    EVENT CONFLICTS:

    The application may tell you that the requested event conflicts with
    existing calendar events.

    When a conflict is provided:

    - Tell the user what existing event or events conflict.
    - Ask whether they want to create the requested event anyway.
    - Do not automatically suggest a different time.
    - Do not create the event yet.
    - Keep the requested event information unchanged.

    If the user agrees to create the event despite the conflict:

    - Set confirmation to true.
    - Set conflictAccepted to true.

    If there is no conflict:

    - conflictAccepted should be false.

    EDITING EVENTS:

    Identify the existing event the user wants to modify.

    Only change fields the user explicitly asks to change.

    Preserve all other existing information.

    If it is unclear which event the user means, ask a concise
    clarification question.

    When all requested changes are known, summarize the changes and ask
    for confirmation.

    Set confirmation to false until the user confirms.

    If an edited event conflicts with another event, tell the user which
    event or events conflict and ask whether they want to keep the edit
    anyway.

    Do not automatically move the event to another time.

    The allDay field may also be changed.

    Only change allDay when the user explicitly asks to make the event
    all day or no longer all day.

    When changing an event to all day, startTime and durationMinutes
    do not need to be provided.

    When changing an all-day event to a timed event, ask for a start time
    and duration if they are not provided.

    DEADLINE CREATION:

    Extract:

    - title
    - date in YYYY-MM-DD format
    - dueTime
    - importance
    - notes

    If a value was not provided and cannot be determined from context,
    use null.

    Do not invent missing information.

    A deadline is separate from an event. Do not represent a deadline as
    an event.

    When required information is missing, ask a concise follow-up question.

    When all required information is present, summarize the deadline and
    ask for confirmation.

    Set confirmation to false until the user clearly confirms.

    If the user clearly confirms the deadline, set confirmation to true.

    EDITING DEADLINES:

    Identify the existing deadline the user wants to modify.

    Only change fields the user explicitly asks to change.

    Preserve all other deadline information.

    When all requested changes are known, summarize the changes and ask
    for confirmation.

    Set confirmation to false until the user confirms.

    DEADLINE CONFLICTS:

      A deadline represents a specific due date and time.

      The application will check whether the new deadline has the same
      due date and time as an existing deadline.

      If the application reports a deadline conflict:
      - Tell the user which deadline conflicts with the new one.
      - Ask whether they want to create the new deadline anyway.
      - Do not claim the deadline was created.
      - If the user agrees, return conflictAccepted: true.
      - If the user does not agree, return conflictAccepted: false.

    FIND FREE TIME:

    Extract the requested date and duration.

    If either is missing, ask a follow-up question.

    The application will provide the actual available times.

    Never claim that a time is available unless the application provides
    that time.

    For CHAT and FIND_FREE_TIME, use the response field for the normal
    response.
  `,

  generationConfig: {
    responseMimeType: "application/json",
    responseSchema,
  },
})

const notesResponseSchema = Schema.object({
  properties: {
    assignments: Schema.array({
      items: Schema.object({
        properties: {
          noteId: Schema.string(),
          topic: Schema.string({ nullable: true }),
        },
      }),
    }),
  },
})

export const notesModel = getGenerativeModel(ai, {
  model: "gemini-3.5-flash-lite",

  systemInstruction: `
    You are an AI assistant for a personal notes application.

    Your job is to organize the user's notes into meaningful topics.

    For every note provided:
    - Assign exactly one topic.
    - Use an existing topic when it is a good fit.
    - Create a new topic when no existing topic fits.
    - Keep topics concise and descriptive.
    - Do not modify, rewrite, summarize, or combine note contents.
    - Return the exact note ID provided by the application.
    - If a note contains too little information to reasonably determine a topic, use null.

    Topics should be broad enough to group related notes together, but specific enough to be useful.

    Always return an assignment for every note provided.
  `,

  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: notesResponseSchema,
  },
})

export const db = getFirestore(app)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()