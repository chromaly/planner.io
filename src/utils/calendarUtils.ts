export function getWeekDays(date: Date): Date[] {
        const start = new Date(date)
        start.setDate(start.getDate() - start.getDay())
        return Array.from({ length: 7}, (_, i) => {
          const d = new Date(start)
          d.setDate(start.getDate() + i)
          return d
        })
      }
