import { useState, useRef, useEffect } from 'react'
import { CustomDropDown } from './CustomDropDown.jsx'

export function EventModal({isOpen, onClose, formData, updateField, onSubmit, editingEventID, presetColors}) {
    if (!isOpen) { return null }
    return (
         <div className="fixed inset-0 bg-bg/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]">
           <div className="bg-surface border border-accent-2/40 rounded-xl p-4 w-[calc(100%-2rem)] max-w-96 ...">
             <h2 className="text-xl font-bold mb-4 text-accent-2">New Event</h2>
           <div className="mb-2">
             <label className="block text-sm font-medium mb-1">Event Name</label>
             <input
               className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text placeholder-white/40"
               placeholder="Event name"
               value={formData.name}
               onChange={(e) => updateField("name", e.target.value)}
             />
           </div>

          <div className="flex gap-2 mb-2">
            <div className="flex-1">
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="date"
                    className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text"
                    value={formData.date}
                    onChange={(e) => updateField("date", e.target.value)}
                />
           </div>
            </div>

            <div className="flex-1">
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text"
                    value={formData.time}
                    onChange={(e) => updateField("time", e.target.value)}
                  />
                  </div>
            </div>
          </div>

           <div className="mb-2">
                <CustomDropDown
                  label="Duration"
                  value={formData.duration}
                  onChange={(val) => updateField("duration", val)}
                  options={[
                    { value: 15, label: "15 min" },
                    { value: 30, label: "30 min" },
                    { value: 45, label: "45 min" },
                    { value: 60, label: "1 hour" },
                    { value: 90, label: "1.5 hour" },
                    { value: 120, label: "2 hour" },
                    { value: 180, label: "3 hour" },
                    { value: 240, label: "4 hour" },
                  ]}
                />
           </div>

            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <CustomDropDown
                  label="Repeats"
                  value={formData.repeatable}
                  onChange={(val) => updateField("repeatable", val)}
                  options={[
                    { value: "never", label: "Never" },
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                  ]}
                />
              </div>

              <div className="flex-1">
                  <CustomDropDown
                    label="Importance"
                    value={formData.importance}
                    onChange={(val) => updateField("importance", val)}
                    options={[
                      { value: "very", label: "VERY." },
                      { value: "somewhat", label: "I shouldn't miss this!" },
                      { value: "not too", label: "um... there's this other thing..." },
                    ]}
                  />
                </div>
            </div>

           <div className="mb-2">
             <label className="block text-sm font-medium mb-1">Location</label>
             <input
               className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text placeholder-white/40"
               placeholder="Location"
               value={formData.location}
               onChange={(e) => updateField("location", e.target.value)}
             />
           </div>


           <div className="mb-4">
             <label className="block text-sm font-medium mb-1">Notes (optional!)</label>
             <textarea
               className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-text placeholder-white/40"
               placeholder="Notes"
               value={formData.notes}
               onChange={(e) => updateField("notes", e.target.value)}
             />
           </div>

          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {presetColors.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => updateField("color", preset.value)}
                  className={`w-8 h-8 rounded-full border-3 transition-transform hover:scale-110 ${
                    formData.color === preset.value ? "border-divider" : "border-transparent"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  />
              ))}
              <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => updateField("color", e.target.value)}
                  className="w-8 h-8 rounded-full border border-divider/20 cursor-pointer bg-transparent p-0">
                  </input>
              </div>
          </div>

             <button
               className="bg-accent-2 hover:bg-accent-2/80 text-text px-4 py-2 rounded-lg mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
               disabled={!formData.name || !formData.date || !formData.time || !formData.duration || !formData.location || !formData.color}
               onClick={onSubmit}
             >
               Add Event
             </button>


             <button
               className="bg-gray-300 px-4 py-2 rounded-lg"
              
               onClick={onClose}
             >
               Cancel
             </button>
           </div>
         </div>
    )
}
