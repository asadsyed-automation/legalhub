import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { UserIcon, BriefcaseIcon, ClockIcon, CalendarIcon, ShieldIcon } from '../components/Icons';
import lawyerApi from '../api/lawyer.api';
import {
  LANGUAGES,
  SERVICE_MODES,
  SERVICE_MODE_LABELS,
  SLOT_DURATIONS,
  WEEKDAYS,
  APPLICATION_STATUS,
} from '../constants';
import './LawyerProfileEditor.css';

export const LawyerProfileEditor = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'services' | 'availability' | 'blocked'
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);

  // Profile State
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    headline: '',
    about: '',
    languages: ['Urdu', 'English'],
    slotMinutes: 30,
    isPublic: true,
  });

  // Services State
  const [servicesSaving, setServicesSaving] = useState(false);
  const [services, setServices] = useState([
    { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2000, isActive: true },
  ]);

  // Availability State
  const [availSaving, setAvailSaving] = useState(false);
  const [rules, setRules] = useState([]);

  // Blocked Dates State
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedSaving, setBlockedSaving] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState({
    date: '',
    reason: '',
  });
  const [dateToDelete, setDateToDelete] = useState(null);

  // Load Advocate Application & Details
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch application status
      const appRes = await lawyerApi.getApplication().catch((err) => {
        if (err.status === 404 || err.response?.status === 404) return null;
        throw err;
      });
      const app = appRes?.application || appRes?.data?.application || appRes || null;
      setApplication(app);

      // Only load profile, services, and availability if advocate is approved
      if (app && app.status === APPLICATION_STATUS.APPROVED) {
        const [profRes, servRes, availRes, blockRes] = await Promise.allSettled([
          lawyerApi.getProfile(),
          lawyerApi.getServices(),
          lawyerApi.getAvailability(),
          lawyerApi.getBlockedDates(),
        ]);

        if (profRes.status === 'fulfilled' && profRes.value) {
          const p = profRes.value?.profile || profRes.value;
          setProfileData({
            headline: p.headline || '',
            about: p.about || '',
            languages: Array.isArray(p.languages) && p.languages.length > 0 ? p.languages : ['Urdu', 'English'],
            slotMinutes: p.slotMinutes || 30,
            isPublic: p.isPublic !== undefined ? p.isPublic : true,
          });
        }

        if (servRes.status === 'fulfilled' && servRes.value) {
          const s = servRes.value?.services || servRes.value;
          if (Array.isArray(s) && s.length > 0) {
            setServices(s);
          }
        }

        if (availRes.status === 'fulfilled' && availRes.value) {
          const r = Array.isArray(availRes.value) ? availRes.value : availRes.value?.rules || [];
          setRules(r);
        }

        if (blockRes.status === 'fulfilled' && blockRes.value) {
          const b = Array.isArray(blockRes.value) ? blockRes.value : blockRes.value?.blockedDates || [];
          setBlockedDates(b);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load advocate details', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // Profile Handlers
  // ==========================================
  const handleLanguageToggle = (lang) => {
    setProfileData((prev) => {
      const exists = prev.languages.includes(lang);
      if (exists) {
        if (prev.languages.length <= 1) {
          showToast('At least one spoken language must be selected', 'warning');
          return prev;
        }
        return { ...prev, languages: prev.languages.filter((l) => l !== lang) };
      }
      return { ...prev, languages: [...prev.languages, lang] };
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await lawyerApi.updateProfile(profileData);
      showToast('Advocate chamber profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save profile changes', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ==========================================
  // Services Handlers
  // ==========================================
  const handleAddService = () => {
    if (services.length >= 4) {
      showToast('Maximum of 4 consultation services allowed', 'warning');
      return;
    }
    // Pick first unused mode
    const existingModes = services.map((s) => s.mode);
    const availableMode = Object.values(SERVICE_MODES).find((m) => !existingModes.includes(m));
    if (!availableMode) {
      showToast('All consultation modes have already been configured', 'warning');
      return;
    }

    setServices((prev) => [
      ...prev,
      { mode: availableMode, durationMinutes: 30, feePkr: 1500, isActive: true },
    ]);
  };

  const handleRemoveService = (index) => {
    if (services.length <= 1) {
      showToast('You must maintain at least one consultation service', 'warning');
      return;
    }
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, value) => {
    setServices((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === 'feePkr' ? Math.max(0, parseInt(value, 10) || 0) : field === 'durationMinutes' ? Number(value) : value,
      };
      return copy;
    });
  };

  const handleServicesSubmit = async (e) => {
    e.preventDefault();
    setServicesSaving(true);
    try {
      const payload = services.map((s) => ({
        mode: s.mode,
        durationMinutes: Number(s.durationMinutes),
        feePkr: Number(s.feePkr),
        isActive: Boolean(s.isActive),
      }));
      await lawyerApi.updateServices(payload);
      showToast('Consultation services and fees saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save consultation services', 'error');
    } finally {
      setServicesSaving(false);
    }
  };

  // ==========================================
  // Availability Handlers
  // ==========================================
  const handleAddWindow = (weekday) => {
    const dayWindows = rules.filter((r) => r.weekday === weekday);
    if (dayWindows.length >= 3) {
      showToast('Maximum of 3 availability windows allowed per day', 'warning');
      return;
    }

    const defaultStart = dayWindows.length === 0 ? '09:00' : '15:00';
    const defaultEnd = dayWindows.length === 0 ? '13:00' : '18:00';

    setRules((prev) => [...prev, { weekday, startTime: defaultStart, endTime: defaultEnd }]);
  };

  const handleRemoveWindow = (index) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWindowChange = (index, field, value) => {
    setRules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    // Validate that startTime < endTime for each rule
    for (const r of rules) {
      if (r.startTime >= r.endTime) {
        showToast(`Window end time (${r.endTime}) must be after start time (${r.startTime})`, 'error');
        return;
      }
    }

    setAvailSaving(true);
    try {
      await lawyerApi.updateAvailability(rules);
      showToast('Weekly chamber availability hours updated!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update chamber hours', 'error');
    } finally {
      setAvailSaving(false);
    }
  };

  // ==========================================
  // Blocked Dates Handlers
  // ==========================================
  const handleAddBlockedDate = async (e) => {
    e.preventDefault();
    if (!newBlockedDate.date) {
      showToast('Please select a calendar date to block', 'warning');
      return;
    }

    setBlockedSaving(true);
    try {
      const added = await lawyerApi.addBlockedDate({
        date: newBlockedDate.date,
        reason: newBlockedDate.reason?.trim() || null,
      });
      setBlockedDates((prev) => [...prev, added]);
      setNewBlockedDate({ date: '', reason: '' });
      showToast(`Date ${newBlockedDate.date} has been blocked successfully`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add blocked date', 'error');
    } finally {
      setBlockedSaving(false);
    }
  };

  const handleDeleteBlockedDate = async () => {
    if (!dateToDelete) return;
    try {
      await lawyerApi.deleteBlockedDate(dateToDelete.id);
      setBlockedDates((prev) => prev.filter((b) => b.id !== dateToDelete.id));
      showToast(`Blocked date unblocked successfully`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to remove blocked date', 'error');
    } finally {
      setDateToDelete(null);
    }
  };

  // Today string in YYYY-MM-DD for min date picker
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-3)' }}>
          <ClockIcon size={32} color="var(--color-primary)" />
        </div>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Loading your verified advocate credentials and chamber configuration...
        </p>
      </div>
    );
  }

  // Not approved banner / guard
  if (!application || application.status !== APPLICATION_STATUS.APPROVED) {
    return (
      <div className="lpe-container">
        <PageHeader
          title="Chamber Profile & Services"
          subtitle="Configure your legal consultation offerings, rates, and weekly court calendar."
          badge={<StatusChip status={application?.status || 'unregistered'} />}
        />

        <EmptyState
          icon={<ShieldIcon size={44} color="var(--color-primary)" />}
          title="Bar Council Verification Required"
          description="In compliance with Rule 135 and Bar Council scrutiny standards, only advocates with verified licensing credentials can configure public consultation profiles and accept client bookings."
          action={
            <Link to="/lawyer/application" className="btn btn-primary">
              {application ? 'View Bar Council Application' : 'Submit Licensing Application'}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="lpe-container">
      <PageHeader
        title="Chamber Profile & Services"
        subtitle="Manage your public directory profile, consultation fees, and weekly court calendar."
        badge={<StatusChip status="approved" />}
        actions={
          <Link to={`/lawyers/${application?.userId}`} className="btn btn-secondary btn-sm">
            View Public Profile
          </Link>
        }
      />

      {/* Tabs */}
      <nav className="lpe-tabs" aria-label="Advocate chamber settings tabs">
        <button
          type="button"
          className={`lpe-tab ${activeTab === 'profile' ? 'lpe-tab--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <UserIcon size={16} />
          <span>Chamber Profile &amp; Bio</span>
        </button>
        <button
          type="button"
          className={`lpe-tab ${activeTab === 'services' ? 'lpe-tab--active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <BriefcaseIcon size={16} />
          <span>Consultation Services ({services.length})</span>
        </button>
        <button
          type="button"
          className={`lpe-tab ${activeTab === 'availability' ? 'lpe-tab--active' : ''}`}
          onClick={() => setActiveTab('availability')}
        >
          <ClockIcon size={16} />
          <span>Chamber Hours &amp; Schedule</span>
        </button>
        <button
          type="button"
          className={`lpe-tab ${activeTab === 'blocked' ? 'lpe-tab--active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          <CalendarIcon size={16} />
          <span>Blocked Dates &amp; Vacation ({blockedDates.length})</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: CHAMBER PROFILE & BIO
          ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="lpe-card">
          <div className="lpe-card__header">
            <h3 className="lpe-card__title">
              <span>👤</span>
              <span>Advocate Professional Biography</span>
            </h3>
            <p className="lpe-card__subtitle">
              Provide factual information about your legal focus, jurisdictions, and spoken languages. (Rule 135 Compliant)
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="lpe-form">
            <div className="lpe-field">
              <label htmlFor="headline">Professional Headline</label>
              <input
                id="headline"
                type="text"
                maxLength={120}
                placeholder="e.g. Advocate High Court | Civil, Family & Constitutional Law Specialist"
                value={profileData.headline}
                onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
              />
              <span className="lpe-field__hint">
                {profileData.headline.length} / 120 characters. Concise factual title shown in search results.
              </span>
            </div>

            <div className="lpe-form-row">
              <div className="lpe-field">
                <label>Spoken Languages</label>
                <div className="lpe-pills">
                  {LANGUAGES.map((lang) => {
                    const isSelected = profileData.languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        className={`lpe-pill ${isSelected ? 'lpe-pill--selected' : ''}`}
                        onClick={() => handleLanguageToggle(lang)}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {lang}
                      </button>
                    );
                  })}
                </div>
                <span className="lpe-field__hint">
                  Select all languages you comfortably conduct legal consultations in.
                </span>
              </div>

              <div className="lpe-field">
                <label htmlFor="slotMinutes">Default Consultation Slot Duration</label>
                <select
                  id="slotMinutes"
                  value={profileData.slotMinutes}
                  onChange={(e) => setProfileData({ ...profileData, slotMinutes: Number(e.target.value) })}
                >
                  {SLOT_DURATIONS.map((dur) => (
                    <option key={dur} value={dur}>
                      {dur} Minutes
                    </option>
                  ))}
                </select>
                <span className="lpe-field__hint">
                  Standard time window allotted per initial consultation appointment.
                </span>
              </div>
            </div>

            <div className="lpe-field">
              <label htmlFor="about">Professional Biography &amp; Chamber Focus</label>
              <textarea
                id="about"
                rows={5}
                maxLength={2000}
                placeholder="Detail your legal education, chamber experience, notable practice domains, and litigation philosophy..."
                value={profileData.about}
                onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
              />
              <span className="lpe-field__hint">
                {profileData.about.length} / 2000 characters. Factual information only; no promotional solicitation.
              </span>
            </div>

            <div className="lpe-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <input
                id="isPublic"
                type="checkbox"
                checked={profileData.isPublic}
                onChange={(e) => setProfileData({ ...profileData, isPublic: e.target.checked })}
              />
              <label htmlFor="isPublic" style={{ cursor: 'pointer', margin: 0 }}>
                Publish profile to the public legal directory
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
              <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CONSULTATION SERVICES & FEES
          ========================================================================= */}
      {activeTab === 'services' && (
        <div className="lpe-card">
          <div className="lpe-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
            <div>
              <h3 className="lpe-card__title">
                <BriefcaseIcon size={20} color="var(--color-primary)" />
                <span>Consultation Services &amp; Fees (PKR)</span>
              </h3>
              <p className="lpe-card__subtitle">
                Set transparent consultation fees for each service mode (Chat, Audio, Video, In-Chamber).
              </p>
            </div>
            {services.length < 4 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddService}
              >
                + Add Service Mode
              </button>
            )}
          </div>

          <form onSubmit={handleServicesSubmit} className="lpe-form">
            <div className="lpe-services-grid">
              {services.map((service, index) => (
                <div key={index} className="lpe-service-card">
                  <div className="lpe-service-card__top">
                    <span className="lpe-service-card__mode">
                      Service #{index + 1}
                    </span>
                    {services.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.1rem 0.4rem', fontSize: 'var(--font-size-xs)' }}
                        onClick={() => handleRemoveService(index)}
                        title="Remove service"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <div className="lpe-field">
                    <label>Consultation Mode</label>
                    <select
                      value={service.mode}
                      onChange={(e) => handleServiceChange(index, 'mode', e.target.value)}
                    >
                      {Object.values(SERVICE_MODES).map((mode) => (
                        <option key={mode} value={mode}>
                          {SERVICE_MODE_LABELS[mode] || mode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lpe-form-row">
                    <div className="lpe-field">
                      <label>Duration</label>
                      <select
                        value={service.durationMinutes}
                        onChange={(e) => handleServiceChange(index, 'durationMinutes', e.target.value)}
                      >
                        {SLOT_DURATIONS.map((dur) => (
                          <option key={dur} value={dur}>
                            {dur} Mins
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="lpe-field">
                      <label>Fee (PKR)</label>
                      <input
                        type="number"
                        min={0}
                        max={200000}
                        step={100}
                        value={service.feePkr}
                        onChange={(e) => handleServiceChange(index, 'feePkr', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="lpe-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                    <input
                      id={`active-${index}`}
                      type="checkbox"
                      checked={service.isActive}
                      onChange={(e) => handleServiceChange(index, 'isActive', e.target.checked)}
                    />
                    <label htmlFor={`active-${index}`} style={{ cursor: 'pointer', margin: 0, fontSize: 'var(--font-size-xs)' }}>
                      Active for client booking
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
              <button type="submit" className="btn btn-primary" disabled={servicesSaving}>
                {servicesSaving ? 'Saving Services...' : 'Save Consultation Services'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CHAMBER HOURS & SCHEDULE
          ========================================================================= */}
      {activeTab === 'availability' && (
        <div className="lpe-card">
          <div className="lpe-card__header">
            <h3 className="lpe-card__title">
              <span>🕒</span>
              <span>Weekly Chamber Availability Schedule</span>
            </h3>
            <p className="lpe-card__subtitle">
              Define your regular hours per weekday (Asia/Karachi timezone). Up to 3 time windows per day.
            </p>
          </div>

          <form onSubmit={handleAvailabilitySubmit} className="lpe-form">
            {WEEKDAYS.map((day) => {
              const dayWindows = rules
                .map((r, originalIdx) => ({ ...r, originalIdx }))
                .filter((r) => r.weekday === day.id);

              return (
                <div key={day.id} className="lpe-weekday-card">
                  <div className="lpe-weekday-card__header">
                    <span className="lpe-weekday-card__title">
                      {day.label} ({dayWindows.length} {dayWindows.length === 1 ? 'window' : 'windows'})
                    </span>
                    {dayWindows.length < 3 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleAddWindow(day.id)}
                      >
                        + Add Window
                      </button>
                    )}
                  </div>

                  {dayWindows.length === 0 ? (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                      No chamber consultation hours configured for {day.label} (Chamber Closed).
                    </div>
                  ) : (
                    <div className="lpe-time-windows">
                      {dayWindows.map((w) => (
                        <div key={w.originalIdx} className="lpe-window-row">
                          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>From:</label>
                          <input
                            type="time"
                            value={w.startTime}
                            onChange={(e) => handleWindowChange(w.originalIdx, 'startTime', e.target.value)}
                            required
                          />
                          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>To:</label>
                          <input
                            type="time"
                            value={w.endTime}
                            onChange={(e) => handleWindowChange(w.originalIdx, 'endTime', e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.15rem 0.4rem', fontSize: 'var(--font-size-xs)' }}
                            onClick={() => handleRemoveWindow(w.originalIdx)}
                            title="Delete time window"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
              <button type="submit" className="btn btn-primary" disabled={availSaving}>
                {availSaving ? 'Saving Hours...' : 'Save Chamber Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BLOCKED DATES & VACATION
          ========================================================================= */}
      {activeTab === 'blocked' && (
        <div className="lpe-card">
          <div className="lpe-card__header">
            <h3 className="lpe-card__title">
              <span>📅</span>
              <span>Court Vacations &amp; Blocked Dates</span>
            </h3>
            <p className="lpe-card__subtitle">
              Block specific calendar dates (High Court holidays, personal leave) to prevent client bookings.
            </p>
          </div>

          <form onSubmit={handleAddBlockedDate} className="lpe-form" style={{ marginBottom: 'var(--spacing-6)' }}>
            <div className="lpe-form-row">
              <div className="lpe-field">
                <label htmlFor="blockedDate">Date to Block</label>
                <input
                  id="blockedDate"
                  type="date"
                  min={todayStr}
                  value={newBlockedDate.date}
                  onChange={(e) => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
                  required
                />
              </div>

              <div className="lpe-field">
                <label htmlFor="blockedReason">Reason (Optional)</label>
                <input
                  id="blockedReason"
                  type="text"
                  maxLength={255}
                  placeholder="e.g. High Court Summer Vacation, Chamber Renovation"
                  value={newBlockedDate.reason}
                  onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={blockedSaving}>
                {blockedSaving ? 'Adding...' : '+ Block Selected Date'}
              </button>
            </div>
          </form>

          {/* List of blocked dates */}
          <div className="lpe-blocked-section">
            <h4 style={{ margin: '0 0 var(--spacing-3) 0', fontSize: 'var(--font-size-md)' }}>
              Currently Blocked Dates ({blockedDates.length})
            </h4>

            {blockedDates.length === 0 ? (
              <p style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                No dates are currently blocked. Your regular weekly chamber hours apply.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="lpe-blocked-table">
                  <thead>
                    <tr>
                      <th>Calendar Date</th>
                      <th>Reason / Note</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedDates.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.date}</strong>
                        </td>
                        <td style={{ color: b.reason ? 'var(--color-text)' : 'var(--color-text-subtle)' }}>
                          {b.reason || 'No reason specified'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => setDateToDelete(b)}
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Blocked Date Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(dateToDelete)}
        title="Unblock Calendar Date"
        message={`Are you sure you want to unblock ${dateToDelete?.date}? Clients will be able to book consultations during your regular chamber hours on this day.`}
        confirmText="Unblock Date"
        cancelText="Cancel"
        onConfirm={handleDeleteBlockedDate}
        onCancel={() => setDateToDelete(null)}
      />
    </div>
  );
};

export default LawyerProfileEditor;
