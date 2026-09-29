import { useState, useRef, useEffect } from 'react'

export function CustomDropDown({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    
    <div ref={dropdownRef} className="relative animate-[dropdownBounce_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">
      <label className="block text-sm font-medium mb-1 focus:outline-none focus:ring-0 focus:border-accent-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-bg/30 border border-divider/10 rounded-lg px-3 py-2 w-full text-left text-text focus:outline-none focus:ring-0 focus:border-accent-2"
      >
        {options.find(o => o.value === value)?.label || "Select..."}
      </button>
      {isOpen && (
        <ul className="absolute w-full bg-surface border border-accent-2/40 rounded-lg shadow-lg z-10 overflow-hidden">
          {options.map(opt => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className="px-3 py-2 hover:bg-accent-1/20 cursor-pointer"
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

