import { useState } from "react"
import { getWeekDays } from "../utils/calendarUtils.ts"

export function useCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState("week")

  const weekDays = getWeekDays(selectedDate)

  function previousWeek() {
    setSelectedDate((currentDate) => {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      return newDate
    })
  }

  function nextWeek() {
    setSelectedDate((currentDate) => {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      return newDate
    })
  }

  function previousMonth() {
    setSelectedMonth((currentMonth) => {
      const newMonth = new Date(currentMonth)
      newMonth.setMonth(newMonth.getMonth() - 1)
      return newMonth
    })
  }

  function nextMonth() {
    setSelectedMonth((currentMonth) => {
      const newMonth = new Date(currentMonth)
      newMonth.setMonth(newMonth.getMonth() + 1)
      return newMonth
    })
  }

  return {
    selectedDate,
    selectedMonth,
    viewMode,
    weekDays,
    setSelectedDate,
    setSelectedMonth,
    setViewMode,
    previousWeek,
    nextWeek,
    previousMonth,
    nextMonth,
  }
}