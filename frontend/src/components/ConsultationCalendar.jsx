import { useState, useMemo, useEffect } from 'react';
import { ClockIcon } from './Icons';
import './ConsultationCalendar.css';

/**
 * Interactive Monthly Consultation Calendar Component.
 * Faithfully matches the clean Pakistan Standard Time (PKT) calendar design:
 * - Shows current month with navigation (< and >)
 * - Highlights today with an outline ring
 * - Disables past dates and dates without available slots
 * - Shows selected date with solid primary pill
 * - Renders time slots for the selected date
 */
const ConsultationCalendar = ({
  slots = [],
  selectedSlot = null,
  onSelectSlot,
  currentMonth = new Date(),
  onMonthChange,
  isLoading = false,
}) => {
  // Today in Pakistan Standard Time (Asia/Karachi)
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()); // 'YYYY-MM-DD'
  }, []);

  // Selected date key (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    if (selectedSlot) {
      const iso = selectedSlot.startsAt || selectedSlot.startUtc || selectedSlot.startTime;
      if (iso) {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(iso));
      }
    }
    return '';
  });

  // Group slots by Karachi date string (YYYY-MM-DD)
  const slotsByDate = useMemo(() => {
    const map = {};
    slots.forEach((s) => {
      const iso = s.startsAt || s.startUtc || s.startTime;
      if (!iso) return;
      const dStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(iso));

      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(s);
    });
    return map;
  }, [slots]);

  // If no date is currently selected, pick the first date that has slots
  useEffect(() => {
    if (!selectedDate && slots.length > 0) {
      const datesWithSlots = Object.keys(slotsByDate).sort();
      if (datesWithSlots.length > 0) {
        setSelectedDate(datesWithSlots[0]);
      }
    }
  }, [slots, selectedDate, slotsByDate]);

  // Year and month being displayed
  const displayYear = currentMonth.getFullYear();
  const displayMonth = currentMonth.getMonth(); // 0-indexed

  // Month header string e.g. "October 2026"
  const monthName = useMemo(() => {
    return currentMonth.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentMonth]);

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = new Date(displayYear, displayMonth, 1).getDay();

  // Number of days in the current month
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  // Navigation handlers
  const canGoPrev = useMemo(() => {
    const today = new Date();
    const currentViewStart = new Date(displayYear, displayMonth, 1);
    const todayMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentViewStart > todayMonthStart;
  }, [displayYear, displayMonth]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    const nextDate = new Date(displayYear, displayMonth - 1, 1);
    onMonthChange(nextDate);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(displayYear, displayMonth + 1, 1);
    onMonthChange(nextDate);
  };

  // Helper to format slot time e.g. "10:00 AM"
  const formatSlotTimeOnly = (slot) => {
    if (!slot) return '';
    if (slot.localTime || slot.startLocal) return slot.localTime || slot.startLocal;
    const iso = slot.startsAt || slot.startUtc || slot.startTime;
    try {
      return new Date(iso).toLocaleTimeString('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Helper to check slot equality
  const isSlotSelected = (slot) => {
    if (!selectedSlot || !slot) return false;
    const s1 = selectedSlot.startsAt || selectedSlot.startUtc || selectedSlot.startTime;
    const s2 = slot.startsAt || slot.startUtc || slot.startTime;
    return s1 === s2;
  };

  // Friendly date label for the selected day
  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-PK', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="cal-card">
      {/* Calendar Header */}
      <div className="cal-header">
        <h3 className="cal-title">Select a Date</h3>

        <div className="cal-nav-group">
          <button
            type="button"
            className="cal-nav-btn"
            onClick={handlePrevMonth}
            disabled={!canGoPrev || isLoading}
            aria-label="Previous month"
          >
            &lt;
          </button>
          <span className="cal-month-label">{monthName}</span>
          <button
            type="button"
            className="cal-nav-btn"
            onClick={handleNextMonth}
            disabled={isLoading}
            aria-label="Next month"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Weekday Labels (Su, Mo, Tu, We, Th, Fr, Sa) */}
      <div className="cal-grid-header">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="cal-weekday">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="cal-grid-days">
        {/* Leading empty cells for days before the 1st */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`blank-${idx}`} className="cal-day-cell" />
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dayKey = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isPast = dayKey < todayStr;
          const isToday = dayKey === todayStr;
          const hasSlots = Boolean(slotsByDate[dayKey] && slotsByDate[dayKey].length > 0);
          const isSelected = selectedDate === dayKey;
          const isUnavailable = isPast || !hasSlots;

          let btnClass = 'cal-day-btn';
          if (isSelected) {
            btnClass += ' cal-day-btn--selected';
          } else if (isToday) {
            btnClass += ' cal-day-btn--today';
          } else if (isUnavailable) {
            btnClass += ' cal-day-btn--unavailable';
          } else {
            btnClass += ' cal-day-btn--available';
          }

          return (
            <div key={dayKey} className="cal-day-cell">
              <button
                type="button"
                className={btnClass}
                disabled={isUnavailable}
                onClick={() => {
                  setSelectedDate(dayKey);
                  if (hasSlots) {
                    onSelectSlot(slotsByDate[dayKey][0]);
                  }
                }}
              >
                {dayNum}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend Matching Screenshot */}
      <div className="cal-legend">
        <div className="cal-legend-item">
          <span className="cal-legend-indicator cal-legend-indicator--selected" />
          <span>Selected</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-indicator cal-legend-indicator--today" />
          <span>Today</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-indicator cal-legend-indicator--unavailable" />
          <span>Unavailable</span>
        </div>
      </div>

      {/* Available Time Slots for Selected Date */}
      {selectedDate && (
        <div className="cal-time-slots">
          <div className="cal-time-slots__title">
            Available Times for {selectedDateLabel} (PKT):
          </div>

          {slotsByDate[selectedDate] && slotsByDate[selectedDate].length > 0 ? (
            <div className="cal-time-slots__grid">
              {slotsByDate[selectedDate].map((slot, sIdx) => {
                const active = isSlotSelected(slot);
                return (
                  <button
                    key={sIdx}
                    type="button"
                    className={`cal-time-slot-btn ${active ? 'cal-time-slot-btn--active' : ''}`}
                    onClick={() => onSelectSlot(slot)}
                  >
                    <ClockIcon size={12} />
                    <span>{formatSlotTimeOnly(slot)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="cal-no-slots-notice">
              No open consultation slots on this date. Please select another highlighted day.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsultationCalendar;
