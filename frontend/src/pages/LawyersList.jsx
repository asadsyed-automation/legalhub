import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import directoryApi from '../api/directory.api';
import AdvocateAvatar from '../components/AdvocateAvatar';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  SearchIcon,
  FilterIcon,
  LocationIcon,
  CourtIcon,
  BriefcaseIcon,
  ScalesIcon,
  ArrowRightIcon,
  ShieldIcon,
  VideoIcon,
  PhoneIcon,
  ChatIcon,
} from '../components/Icons';
import {
  CITIES,
  PRACTICE_AREAS,
  COURT_LEVELS,
  SERVICE_MODES,
  SERVICE_MODE_LABELS,
} from '../constants';
import './LawyersList.css';

export const LawyersList = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const currentCity = searchParams.get('city') || '';
  const currentPracticeArea = searchParams.get('practiceArea') || '';
  const currentCourtLevel = searchParams.get('courtLevel') || '';
  const currentMode = searchParams.get('mode') || '';
  const currentType = searchParams.get('practitionerType') || 'all';
  const currentSort = searchParams.get('sort') || 'experience';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentSearch = searchParams.get('q') || '';

  // Local state
  const [searchKeyword, setSearchKeyword] = useState(currentSearch);
  const [lawyers, setLawyers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync search keyword with URL
  useEffect(() => {
    setSearchKeyword(currentSearch);
  }, [currentSearch]);

  // Fetch Directory
  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 9,
        sort: currentSort,
      };
      if (currentCity) params.city = currentCity;
      if (currentPracticeArea) params.practiceArea = currentPracticeArea;
      if (currentCourtLevel) params.courtLevel = currentCourtLevel;
      if (currentMode) params.mode = currentMode;
      if (currentType && currentType !== 'all') params.practitionerType = currentType;

      const res = await directoryApi.getLawyers(params);
      let items = res?.items || res?.lawyers || res?.data?.items || res?.data?.lawyers || [];
      const total = res?.total ?? res?.pagination?.total ?? items.length;
      const page = res?.page ?? res?.pagination?.page ?? currentPage;
      const limit = res?.limit ?? res?.pagination?.limit ?? 9;
      const totalPages = res?.totalPages ?? res?.pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));

      // Client-side text filter for keyword search if entered
      if (currentSearch.trim()) {
        const q = currentSearch.trim().toLowerCase();
        items = items.filter(
          (l) =>
            l.name?.toLowerCase().includes(q) ||
            l.headline?.toLowerCase().includes(q) ||
            l.city?.toLowerCase().includes(q) ||
            l.practiceAreas?.some((pa) => pa.toLowerCase().includes(q))
        );
      }

      setLawyers(items);
      setPagination({ total, page, limit, totalPages });
    } catch (err) {
      showToast(err.message || 'Failed to load advocate directory', 'error');
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  }, [currentCity, currentPracticeArea, currentCourtLevel, currentMode, currentType, currentSort, currentPage, currentSearch, showToast]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Filter Update Helper
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Keyword Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter('q', searchKeyword.trim());
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchKeyword('');
    setSearchParams({ page: '1' });
    setMobileFilterOpen(false);
  };

  const activeFiltersCount = [
    currentCity,
    currentPracticeArea,
    currentCourtLevel,
    currentMode,
    currentType && currentType !== 'all' ? currentType : '',
    currentSearch,
  ].filter(Boolean).length;

  return (
    <div className="ll-page">
      {/* Top Banner Header */}
      <section className="ll-hero">
        <div className="ll-hero__container">
          <div className="ll-hero__badge">
            <ScalesIcon size={16} color="#f59e0b" />
            <span>Verified Pakistan Bar Directory</span>
          </div>
          <h1 className="ll-hero__title">
            Find & Consult <span className="ll-hero__accent">Admin-Reviewed Advocates</span>
          </h1>
          <p className="ll-hero__subtitle">
            Search verified advocates across Supreme Court, High Courts, and District Benches.
            Objective legal profiles, certified credentials, transparent consultation fees, and direct chamber scheduling.
          </p>

          <div className="ll-hero__rule135">
            <ShieldIcon size={15} color="#10b981" />
            <span>
              <strong>Rule 135 Anti-Solicitation Compliance:</strong> Standardized directory ordered strictly by objective criteria without paid promotional rankings or sponsored endorsements.
            </span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="ll-container">
        {/* Mobile Filter Toggle Button */}
        <div className="ll-mobile-toggle-bar">
          <button
            type="button"
            className="ll-mobile-filter-btn"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          >
            <FilterIcon size={16} />
            <span>{mobileFilterOpen ? 'Hide Filters' : 'Filter Advocates'}</span>
            {activeFiltersCount > 0 && (
              <span className="ll-active-badge">{activeFiltersCount}</span>
            )}
          </button>

          <div className="ll-mobile-sort">
            <select
              value={currentSort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="ll-sort-select"
              aria-label="Sort Advocates"
            >
              <option value="experience">Experience (Years at Bar)</option>
              <option value="fee_asc">Fee: Lowest to Highest</option>
              <option value="fee_desc">Fee: Highest to Lowest</option>
              <option value="newest">Recently Enrolled</option>
            </select>
          </div>
        </div>

        <div className="ll-layout">
          {/* LEFT SIDEBAR: Professional Faceted Search */}
          <aside className={`ll-sidebar ${mobileFilterOpen ? 'll-sidebar--open' : ''}`}>
            <div className="ll-sidebar__header">
              <div className="ll-sidebar__title">
                <FilterIcon size={18} color="#d97706" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ll-active-badge">{activeFiltersCount}</span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="ll-sidebar__reset-btn"
                  onClick={handleClearFilters}
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Keyword Search Field */}
            <div className="ll-facet-group">
              <label className="ll-facet-label" htmlFor="sidebarSearch">
                Keyword or Name
              </label>
              <form onSubmit={handleSearchSubmit} className="ll-facet-search-form">
                <div className="ll-facet-search-box">
                  <SearchIcon size={16} className="ll-facet-search-icon" />
                  <input
                    id="sidebarSearch"
                    type="search"
                    placeholder="Advocate name, law, city..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="ll-facet-search-input"
                  />
                </div>
              </form>
            </div>

            {/* Facet: Practitioner Type (Fiverr Agency Pattern) */}
            <div className="ll-facet-group">
              <div className="ll-facet-label">
                <BriefcaseIcon size={15} color="#64748b" />
                <span>Practitioner Type</span>
              </div>
              <div className="ll-facet-options">
                <label className="ll-facet-radio">
                  <input
                    type="radio"
                    name="practitionerType"
                    checked={!currentType || currentType === 'all'}
                    onChange={() => updateFilter('practitionerType', 'all')}
                  />
                  <span>All Legal Counsel</span>
                </label>
                <label className="ll-facet-radio">
                  <input
                    type="radio"
                    name="practitionerType"
                    checked={currentType === 'lawyer'}
                    onChange={() => updateFilter('practitionerType', 'lawyer')}
                  />
                  <span>Individual Advocates</span>
                </label>
                <label className="ll-facet-radio">
                  <input
                    type="radio"
                    name="practitionerType"
                    checked={currentType === 'law_firm'}
                    onChange={() => updateFilter('practitionerType', 'law_firm')}
                  />
                  <span>Law Firms &amp; Chambers</span>
                </label>
              </div>
            </div>

            {/* Facet: Court Standing */}
            <div className="ll-facet-group">
              <div className="ll-facet-label">
                <CourtIcon size={15} color="#64748b" />
                <span>Court Standing</span>
              </div>
              <div className="ll-facet-options">
                <label className="ll-facet-radio">
                  <input
                    type="radio"
                    name="courtLevel"
                    checked={!currentCourtLevel}
                    onChange={() => updateFilter('courtLevel', '')}
                  />
                  <span>All Courts</span>
                </label>
                {COURT_LEVELS.map((cl) => (
                  <label key={cl} className="ll-facet-radio">
                    <input
                      type="radio"
                      name="courtLevel"
                      checked={currentCourtLevel === cl}
                      onChange={() => updateFilter('courtLevel', cl)}
                    />
                    <span>{cl}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Facet: Station / City */}
            <div className="ll-facet-group">
              <div className="ll-facet-label">
                <LocationIcon size={15} color="#64748b" />
                <span>Station / City</span>
              </div>
              <select
                className="ll-facet-select"
                value={currentCity}
                onChange={(e) => updateFilter('city', e.target.value)}
                aria-label="Filter by City"
              >
                <option value="">All Pakistan Cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Facet: Practice Areas */}
            <div className="ll-facet-group">
              <div className="ll-facet-label">
                <BriefcaseIcon size={15} color="#64748b" />
                <span>Practice Area</span>
              </div>
              <div className="ll-facet-options ll-facet-options--scroll">
                <label className="ll-facet-radio">
                  <input
                    type="radio"
                    name="practiceArea"
                    checked={!currentPracticeArea}
                    onChange={() => updateFilter('practiceArea', '')}
                  />
                  <span>All Practice Areas</span>
                </label>
                {PRACTICE_AREAS.map((p) => (
                  <label key={p} className="ll-facet-radio">
                    <input
                      type="radio"
                      name="practiceArea"
                      checked={currentPracticeArea === p}
                      onChange={() => updateFilter('practiceArea', p)}
                    />
                    <span>{p} Law</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Facet: Consultation Mode */}
            <div className="ll-facet-group">
              <div className="ll-facet-label">
                <VideoIcon size={15} color="#64748b" />
                <span>Consultation Mode</span>
              </div>
              <div className="ll-facet-options">
                <label className="ll-facet-radio">
                  <input
                    type="radio"
                    name="serviceMode"
                    checked={!currentMode}
                    onChange={() => updateFilter('mode', '')}
                  />
                  <span>Any Mode</span>
                </label>
                {Object.values(SERVICE_MODES).map((mode) => (
                  <label key={mode} className="ll-facet-radio">
                    <input
                      type="radio"
                      name="serviceMode"
                      checked={currentMode === mode}
                      onChange={() => updateFilter('mode', mode)}
                    />
                    <span>{SERVICE_MODE_LABELS[mode] || mode}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Regulatory Footer inside sidebar */}
            <div className="ll-sidebar__seal">
              <ScalesIcon size={24} color="#d97706" />
              <p>
                Admin-Reviewed advocates enrolled with respective Provincial Bar Councils in Pakistan.
              </p>
            </div>
          </aside>

          {/* RIGHT COLUMN: Results Header & Grid */}
          <main className="ll-main">
            {/* Results Toolbar */}
            <div className="ll-results-bar">
              <div className="ll-results-left">
                <h2 className="ll-results-title">
                  {loading ? 'Searching Directory...' : `${pagination.total} Advocates Available`}
                </h2>

                {/* Active Filter Dismissal Chips */}
                {activeFiltersCount > 0 && (
                  <div className="ll-active-chips">
                    {currentCity && (
                      <button
                        type="button"
                        className="ll-active-chip"
                        onClick={() => updateFilter('city', '')}
                        title="Remove city filter"
                      >
                        <span>Station: {currentCity}</span>
                        <span>✕</span>
                      </button>
                    )}
                    {currentPracticeArea && (
                      <button
                        type="button"
                        className="ll-active-chip"
                        onClick={() => updateFilter('practiceArea', '')}
                        title="Remove practice area filter"
                      >
                        <span>{currentPracticeArea} Law</span>
                        <span>✕</span>
                      </button>
                    )}
                    {currentCourtLevel && (
                      <button
                        type="button"
                        className="ll-active-chip"
                        onClick={() => updateFilter('courtLevel', '')}
                        title="Remove court filter"
                      >
                        <span>{currentCourtLevel}</span>
                        <span>✕</span>
                      </button>
                    )}
                    {currentMode && (
                      <button
                        type="button"
                        className="ll-active-chip"
                        onClick={() => updateFilter('mode', '')}
                        title="Remove mode filter"
                      >
                        <span>Mode: {SERVICE_MODE_LABELS[currentMode] || currentMode}</span>
                        <span>✕</span>
                      </button>
                    )}
                    {currentType && currentType !== 'all' && (
                      <button
                        type="button"
                        className="ll-active-chip"
                        onClick={() => updateFilter('practitionerType', 'all')}
                        title="Remove practitioner type filter"
                      >
                        <span>Type: {currentType === 'law_firm' ? 'Law Firms & Chambers' : 'Individual Advocates'}</span>
                        <span>✕</span>
                      </button>
                    )}
                    {currentSearch && (
                      <button
                        type="button"
                        className="ll-active-chip"
                        onClick={() => {
                          setSearchKeyword('');
                          updateFilter('q', '');
                        }}
                        title="Clear search keyword"
                      >
                        <span>Keyword: "{currentSearch}"</span>
                        <span>✕</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="ll-clear-all-link"
                      onClick={handleClearFilters}
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop Sort Dropdown */}
              <div className="ll-desktop-sort">
                <label htmlFor="desktopSortSelect" className="ll-sort-label">
                  Sort:
                </label>
                <select
                  id="desktopSortSelect"
                  value={currentSort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="ll-sort-select"
                >
                  <option value="experience">Experience (Years at Bar)</option>
                  <option value="fee_asc">Fee: Lowest to Highest</option>
                  <option value="fee_desc">Fee: Highest to Lowest</option>
                  <option value="newest">Recently Enrolled</option>
                </select>
              </div>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="ll-loading-state">
                <div className="admin-users__spinner" style={{ margin: '0 auto 1rem' }} />
                <p>Verifying credentials from the advocate directory...</p>
              </div>
            ) : lawyers.length === 0 ? (
              <EmptyState
                icon={<ScalesIcon size={44} color="#94a3b8" />}
                title="No Advocates Found"
                description="No advocates matched your current combination of city, court standing, or practice area. Try adjusting or clearing your filters."
                actionLabel="Clear All Filters"
                onAction={handleClearFilters}
              />
            ) : (
              <div className="ll-advocate-grid">
                {lawyers.map((advocate) => (
                  <article key={advocate.id} className="ll-card">
                    {/* Header Row: Circular Portrait Photo + Name & Standing */}
                    <div className="ll-card__header">
                      <AdvocateAvatar
                        name={advocate.name}
                        courtLevel={advocate.courtLevel}
                        size={64}
                        className="ll-card__avatar"
                      />

                      <div className="ll-card__info">
                        <div className="ll-card__name-row">
                          <Link to={`/lawyers/${advocate.id}`} className="ll-card__name">
                            {advocate.name}
                          </Link>
                          {advocate.role === 'law_firm' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe'
                              }}
                              title="Registered Law Firm / Legal Chamber"
                            >
                              🏛 Law Firm
                            </span>
                          ) : (
                            <span className="ll-card__verified-badge" title="Credentials Admin-Reviewed">
                              <ShieldIcon size={12} color="#059669" />
                              <span>Admin-Reviewed</span>
                            </span>
                          )}
                        </div>

                        <div className="ll-card__standing-pill">
                          <CourtIcon size={13} color="#d97706" />
                          <span>{advocate.courtLevel}</span>
                        </div>

                        <p className="ll-card__headline">
                          {advocate.headline || `${advocate.courtLevel} practicing in ${advocate.city}`}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="ll-card__meta">
                      <span className="ll-card__meta-item" title="Chamber Station">
                        <LocationIcon size={13} color="#64748b" />
                        <span>{advocate.city}</span>
                      </span>
                      <span className="ll-card__meta-item" title="Years of Practice">
                        <BriefcaseIcon size={13} color="#64748b" />
                        <span>{advocate.experienceYears} Yrs Practice</span>
                      </span>
                      <span className="ll-card__meta-item" title="Provincial Bar Council">
                        <ScalesIcon size={13} color="#64748b" />
                        <span>{advocate.barCouncil}</span>
                      </span>
                    </div>

                    {/* Practice Area Chips */}
                    {advocate.practiceAreas?.length > 0 && (
                      <div className="ll-card__practice-areas">
                        {advocate.practiceAreas.slice(0, 3).map((pa, idx) => (
                          <span key={idx} className="ll-card__practice-chip">
                            {pa}
                          </span>
                        ))}
                        {advocate.practiceAreas.length > 3 && (
                          <span className="ll-card__practice-more">
                            +{advocate.practiceAreas.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Consultation Modes */}
                    {advocate.modes?.length > 0 && (
                      <div className="ll-card__modes">
                        <span className="ll-card__modes-label">Modes:</span>
                        {advocate.modes.map((mode) => (
                          <span
                            key={mode}
                            className="ll-card__mode-tag"
                            title={SERVICE_MODE_LABELS[mode] || mode}
                          >
                            {mode === SERVICE_MODES.VIDEO && <VideoIcon size={12} />}
                            {mode === SERVICE_MODES.PHONE && <PhoneIcon size={12} />}
                            {mode === SERVICE_MODES.CHAT && <ChatIcon size={12} />}
                            {mode === SERVICE_MODES.IN_CHAMBER && <BriefcaseIcon size={12} />}
                            <span>{SERVICE_MODE_LABELS[mode] || mode}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Footer: Consultation Rate & Direct Booking CTAs */}
                    <div className="ll-card__footer">
                      <div className="ll-card__fee-block">
                        <span className="ll-card__fee-label">Consultation Rate</span>
                        <span className="ll-card__fee-amount">
                          {advocate.feeFrom
                            ? `From PKR ${advocate.feeFrom.toLocaleString()}`
                            : 'Fee on Enquiry'}
                        </span>
                      </div>

                      <div className="ll-card__actions">
                        <Link
                          to={`/book/${advocate.id}`}
                          className="ll-btn ll-btn--primary"
                        >
                          <span>Consult</span>
                        </Link>
                        <Link
                          to={`/lawyers/${advocate.id}`}
                          className="ll-btn ll-btn--outline"
                          title="View Profile and Bar Credentials"
                        >
                          <span>Profile</span>
                          <ArrowRightIcon size={12} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <nav className="ll-pagination" aria-label="Advocates Pagination">
                <button
                  type="button"
                  className="ll-pagination__btn"
                  disabled={currentPage <= 1}
                  onClick={() => updateFilter('page', (currentPage - 1).toString())}
                >
                  ← Previous
                </button>
                <span className="ll-pagination__info">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="ll-pagination__btn"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => updateFilter('page', (currentPage + 1).toString())}
                >
                  Next →
                </button>
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default LawyersList;
