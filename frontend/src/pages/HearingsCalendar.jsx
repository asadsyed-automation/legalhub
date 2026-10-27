import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import caseApi from '../api/case.api';
import EmptyState from '../components/EmptyState';
import {
  CalendarIcon,
  ClockIcon,
  CourtIcon,
  ArrowRightIcon,
} from '../components/Icons';
import { COURTS, CASE_STAGE_LABELS } from '../constants';
import './HearingsCalendar.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HearingsCalendar = () => {
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'list'
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [courtFilter, setCourtFilter] = useState('');

  // Data State
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate Date Boundaries for Month View
  const { year, month, firstDayIndex, totalDays } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    return {
      year: y,
      month: m,
      firstDayIndex: dayOfWeek,
      totalDays: daysInMonth,
    };
  }, [currentDate]);

  // Fetch Cross-Case Hearings
  const fetchHearings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Lookahead window: 1st of month to end of month (+ 7 days padding)
      const fromDate = new Date(year, month, 1);
      const toDate = new Date(year, month + 1, 7);

      const params = {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        limit: 50,
      };
      if (courtFilter) params.court = courtFilter;

      const res = await caseApi.listHearingsAcrossCases(params);
      const list = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setHearings(list);
    } catch (err) {
      setError(err.message || 'Failed to retrieve court hearings.');
    } finally {
      setLoading(false);
    }
  }, [year, month, courtFilter]);

  useEffect(() => {
    fetchHearings();
  }, [fetchHearings]);

  // Map hearings by YYYY-MM-DD
  const hearingsByDate = useMemo(() => {
    const map = new Map();
    for (const h of hearings) {
      if (!h.scheduledAt) continue;
      const key = h.scheduledAt.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h);
    }
    return map;
  }, [hearings]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Month title formatter (e.g. October 2026)
  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('en-PK', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentDate]);

  const formatTimeOnly = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-PK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const selectedDayHearings = hearingsByDate.get(selectedDateStr) || [];
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="calendar-page">
      {/* Page Header */}
      <div className="calendar-header">
        <div className="calendar-header__info">
          <h1>Court Calendar & Cause List (*Fehrist-e-Peshian*)</h1>
          <p>
            Track daily court appearances, presiding judicial benches, and procedural stages across all cases.
          </p>
        </div>

        <div className="calendar-controls">
          {/* Court Filter Dropdown */}
          <select
            className="entries-tab__filter-select"
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            aria-label="Filter by court forum"
          >
            <option value="">All Judicial Forums</option>
            {COURTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="calendar-view-toggle">
            <button
              type="button"
              className={`calendar-view-btn ${viewMode === 'month' ? 'calendar-view-btn--active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month View
            </button>
            <button
              type="button"
              className={`calendar-view-btn ${viewMode === 'list' ? 'calendar-view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              Cause List
            </button>
          </div>
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-light, #fee2e2)',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            color: 'var(--color-danger-dark, #991b1b)',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchHearings}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--color-text-muted)' }}>
          Loading court hearing schedule...
        </div>
      )}

      {/* MONTH VIEW (Plain React 7-Day Grid) */}
      {!loading && !error && viewMode === 'month' && (
        <>
          {/* Navigation Bar */}
          <div className="calendar-month-nav">
            <h2 className="calendar-month-title">{monthTitle}</h2>
            <div className="calendar-month-nav__btns">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleToday}
              >
                Today
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePrevMonth}
                aria-label="Previous month"
              >
                ←
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                →
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div className="calendar-month-grid">
            {/* Header: Mon - Sun */}
            <div className="calendar-grid-header">
              {WEEKDAYS.map((day) => (
                <div key={day} className="calendar-grid-header__day">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Cells */}
            <div className="calendar-grid-days">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="calendar-day-cell calendar-day-cell--empty" />
              ))}

              {/* Day cells 1 to N */}
              {Array.from({ length: totalDays }).map((_, idx) => {
                const dayNum = idx + 1;
                const pad = (n) => String(n).padStart(2, '0');
                const cellDateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
                const isSelected = selectedDateStr === cellDateStr;
                const isToday = todayStr === cellDateStr;
                const dayHearings = hearingsByDate.get(cellDateStr) || [];

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`calendar-day-cell ${isSelected ? 'calendar-day-cell--selected' : ''} ${
                      isToday ? 'calendar-day-cell--today' : ''
                    }`}
                    onClick={() => setSelectedDateStr(cellDateStr)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedDateStr(cellDateStr);
                    }}
                  >
                    <span className="calendar-day-num">{dayNum}</span>

                    {dayHearings.length > 0 && (
                      <div className="calendar-day-dots">
                        {dayHearings.slice(0, 2).map((h) => (
                          <span key={h.id} className="calendar-hearing-pill">
                            {formatTimeOnly(h.scheduledAt)} {h.court ? h.court.split(',')[0] : ''}
                          </span>
                        ))}
                        {dayHearings.length > 2 && (
                          <span style={{ fontSize: '9px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                            +{dayHearings.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Cause List Inspection */}
          <div className="calendar-day-panel">
            <h3 className="calendar-day-panel__title">
              <CalendarIcon size={18} color="var(--color-primary)" />
              <span>Cause List for {formatFullDate(selectedDateStr)}</span>
            </h3>

            {selectedDayHearings.length === 0 ? (
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-subtle)' }}>
                No court hearings scheduled for this date.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {selectedDayHearings.map((h) => (
                  <Link
                    key={h.id}
                    to={h.caseId ? `/cases/${h.caseId}` : '#'}
                    className="calendar-cause-card"
                  >
                    <div className="calendar-cause-info">
                      <span className="calendar-cause-title">
                        {h.case?.title || `Matter Reference: ${h.caseId || 'Direct Hearing'}`}
                      </span>
                      <div className="calendar-cause-meta">
                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                          <ClockIcon size={12} style={{ display: 'inline', marginRight: '3px' }} />
                          {formatTimeOnly(h.scheduledAt)}
                        </span>
                        <span>
                          <CourtIcon size={12} style={{ display: 'inline', marginRight: '3px' }} />
                          {h.court} {h.bench ? `(${h.bench})` : ''}
                        </span>
                        {h.stage && (
                          <span className="case-banner__pill">
                            {CASE_STAGE_LABELS[h.stage] || h.stage}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--color-primary)', fontSize: 'var(--font-size-xs)' }}>
                      <span>Open Case File</span>
                      <ArrowRightIcon size={14} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* LIST VIEW (Chronological Cause List) */}
      {!loading && !error && viewMode === 'list' && (
        <div className="calendar-list-view">
          {hearings.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon size={40} />}
              title="No upcoming hearings in this period"
              message="No court hearings found matching your selected judicial forum and month window."
            />
          ) : (
            hearings.map((h) => (
              <Link
                key={h.id}
                to={h.caseId ? `/cases/${h.caseId}` : '#'}
                className="calendar-cause-card"
              >
                <div className="calendar-cause-info">
                  <span className="calendar-cause-title">
                    {h.case?.title || 'Litigation Brief'}
                  </span>
                  <div className="calendar-cause-meta">
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                      {formatFullDate(h.scheduledAt?.split('T')[0])} at {formatTimeOnly(h.scheduledAt)}
                    </span>
                    <span>
                      <CourtIcon size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      {h.court} {h.bench ? `(${h.bench})` : ''}
                    </span>
                    {h.stage && (
                      <span className="case-banner__pill">
                        Stage: {CASE_STAGE_LABELS[h.stage] || h.stage}
                      </span>
                    )}
                  </div>
                  {h.outcome && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: '#166534', marginTop: '2px' }}>
                      Outcome: {h.outcome}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--color-primary)', fontSize: 'var(--font-size-xs)' }}>
                  <span>View Case</span>
                  <ArrowRightIcon size={14} />
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default HearingsCalendar;
