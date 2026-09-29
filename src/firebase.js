import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai"

import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check"

const firebaseConfig = {
  apiKey: "AIzaSyBLN3fK1oadrrtPy7HLrTFGRGLdyZPVpOw",
  authDomain: "planner-io-f4953.firebaseapp.com",
  projectId: "planner-io-f4953",
  storageBucket: "planner-io-f4953.firebasestorage.app",
  messagingSenderId: "494647055361",
  appId: "1:494647055361:web:367fd5a6a3bb144c1f1c00",
  measurementId: "G-2CWWQCD4Y2"
};

const app = initializeApp(firebaseConfig)

initializeAppCheck(app, {provider: 
  new ReCaptchaEnterpriseProvider("6Ld2SqQtAAAAAD6P6downQcLGOdTiKtpg3v-ddpD"),
  isTokenAutoRefreshEnabled: true
})

if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const ai = getAI(app, {
  backend: new GoogleAIBackend()
});

const responseSchema = Schema.object({
  properties: {
    intent: Schema.enumString({
      enum: [
        "CHAT",
        "CREATE_EVENT",
        "FIND_FREE_TIME",
        "EDIT_EVENT"
      ]
    }),

    response: Schema.string(),

    event: Schema.object({
      properties: {
        title: Schema.string({ nullable: true }),
        date: Schema.string({ nullable: true }),
        startTime: Schema.string({ nullable: true }),
        durationMinutes: Schema.number({ nullable: true }),

        recurrence: Schema.object({
          properties: {
            type: Schema.enumString({
              enum: [
                "never",
                "daily",
                "weekly",
                "monthly"
              ]
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
                  "saturday"
                ]
              }),
              nullable: true
            }),

            dayOfMonth: Schema.number({
              nullable: true
            })
          }
        }),

        location: Schema.string({ nullable: true }),
        importance: Schema.string({ nullable: true }),
        confirmation: Schema.boolean()
      },
    }),

    search: Schema.object({
      properties: {
        date: Schema.string(),
        durationMinutes: Schema.number()
      }
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

            recurrence: Schema.object({
              properties: {
                type: Schema.enumString({
                  enum: [
                    "never",
                    "daily",
                    "weekly",
                    "monthly"
                  ]
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
                      "saturday"
                    ]
                  }),
                  nullable: true
                }),

                dayOfMonth: Schema.number({
                  nullable: true
                })
              }
            }),

            location: Schema.string({ nullable: true }),
            importance: Schema.string({ nullable: true })
          }
        }),

        confirmation: Schema.boolean()
      }
    })
  },

  optionalProperties: ["event", "search", "edit"]
})

export const model = getGenerativeModel(ai, {
  model: "gemini-3.5-flash-lite",

  systemInstruction: `
    You are an AI assistant for a calendar application.

    Classify every user message into exactly one of these intents:

    - CHAT: general conversation or questions
    - CREATE_EVENT: the user wants to create, add, or schedule an event
    - FIND_FREE_TIME: the user wants to find an available time in their schedule
    - EDIT_EVENT: the user wants to modify an already existing event
    INSTRUCTIONS FOR CREATE_EVENT:
    Extract the following data:
    - title
    - date in YYYY-MM-DD format
    - the starting time
    - the duration in minutes
    - if the event is recurring
    - the location of the event
    - importance (VERY, SOMEWHAT, or NOT VERY)

    If the user has not provided one of these values, leave it as null. A value of null means that the user has 
    not provided enough information to determine that field. Null must not be replaced with a reasonable guess
    or default value.

    For recurrence:
    - If the user says the event does not repeat, use type "never".
    - If the user says it happens every day, use type "daily".
    - If the user specifies one or more weekdays, use type "weekly" and include every specified weekday.
    - If the user says it happens every month on a specific date, use type "monthly" and set dayOfMonth accordingly.
    - If the user says "weekly" without specifying a weekday, ask which weekday or weekdays.
    - Do not infer a weekday from the date unless the user explicitly indicates that the event should repeat on that weekday.

    Do not invent information that the user did not provide.

    After extracting the event information, if required information is missing,
    ask the user a concise follow-up question to obtain the missing information.

    Do not ask for information that has already been provided.
    Do not ask multiple questions at once unless necessary.

    When creating an event, if any required event information is missing, ask the user a follow-up question to obtain it. 
    When the user is answering a follow-up question, update the existing event
    with their answer and preserve all previously provided event information.
    Continue asking follow-up questions until every event field is filled.

    Ask for ONE missing piece of information at a time. Do not create the event until all required event information has been provided.

    Do not claim that an event has been created unless all event fields have
    been provided and the application has successfully created the event. You cannot create events yourself.

    Always provide a response to the user in the response field.
    
    For CREATE_EVENT, use the response field for follow-up questions when
    event information is missing.

    When all required event information has been provided, do NOT say the event has been created.
    Instead, use the response field to summarize the event and ask for confirmation. 

    Only consider the event confirmed when the user clearly agrees. Do not create or claim to have created the event before confirmation.

    INSTRUCTIONS FOR FIND_FREE_TIME:
    Extract the date and duration of the requested activity. If either is missing, ask a follow-up question.

    For CHAT and FIND_FREE_TIME, use the response field for your normal reply. 

    INSTRUCTIONS FOR EDIT_EVENT:
    Identify which existing event the user wants to modify. Only change the fields the user explicitly asks to change.

    Preserve ALL other existing event info. If it is unclear which event the user means, ask a concise follow-up question.

    If the requested change is unclear or missing necessary information, ask a concise follow-up question.

    When all requested changes have been provided, do NOT say the event has been modified.
    Instead, use the response field to summarize the event and ask for confirmation. 

    Only consider the event confirmed when the user clearly agrees. Do not create or claim to have created the event before confirmation.

    If the user is trying to create an event because their requested
    time conflicts with their calendar:

    When changing recurrence:

    - If the user asks to stop an event from repeating, use:
      {
        "type": "never",
        "days": null,
        "dayOfMonth": null
      }

    - If the user asks for a daily recurrence, use:
      {
        "type": "daily",
        "days": null,
        "dayOfMonth": null
      }

    - If the user asks for specific weekdays, use type "weekly" and include all specified weekdays.

    - If the user asks for a monthly recurrence on a specific date, use type "monthly" and set dayOfMonth accordingly.

    - Do not change recurrence unless the user explicitly asks to change it.

    1. Find an available time for the event.
    2. Suggest the available time to the user.
    3. Do not create the event yet.
    4. Wait for the user to confirm the new time.
    5. Once the user confirms, create the event automatically.

    Never assume a time is available. The application will provide
    the actual available times.

    By default for CREATE_EVENT and EDIT_EVENT, the confirmation variable should be set to false. Only set this confirmation variable to true
    if the user has confirmed that the event you are currently editing has the right information.
  `,

  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: responseSchema
  }
});


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
