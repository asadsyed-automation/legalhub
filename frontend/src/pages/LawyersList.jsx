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
  const currentSort = searchParams.get('sort') || 'experience';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentSearch = searchParams.get('q') || '';

  // Local search input
  const [searchKeyword, setSearchKeyword] = useState(currentSearch);

  // Directory Data
  const [lawyers, setLawyers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState(false);

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
  }, [currentCity, currentPracticeArea, currentCourtLevel, currentSort, currentPage, currentSearch, showToast]);

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
  };

  const hasActiveFilters = Boolean(
    currentCity || currentPracticeArea || currentCourtLevel || currentSearch || currentSort !== 'experience'
  );

  return (
    <div className="ll-container">
      {/* Directory Page Header */}
      <div className="ll-header">
        <div className="ll-header__text">
          <h1 className="ll-header__title">Practicing Advocates Directory</h1>
          <p className="ll-header__subtitle">
            Browse and connect directly with enrolled advocates across High Court benches and District Courts in Pakistan. Transparent chamber fees and direct scheduling.
          </p>
        </div>

        {/* Rule 135 Regulatory Compliance Notice */}
        <div className="ll-rule135-badge" role="note">
          <ScalesIcon size={18} color="var(--color-primary)" />
          <span>
            <strong>Rule 135 Compliance:</strong> Neutral directory ordered by objective legal criteria without paid advertisements or sponsored rankings.
          </span>
        </div>
      </div>

      {/* Multi-Facet Filter Bar */}
      <div className="ll-filters-card">
        {/* Search Bar Row */}
        <form onSubmit={handleSearchSubmit} className="ll-search-row">
          <div className="ll-search-input-wrapper">
            <SearchIcon size={18} className="ll-search-icon" color="var(--color-text-subtle)" />
            <input
              type="text"
              placeholder="Search by advocate name, city, or legal issue (e.g. bail, property, khula)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="ll-search-input"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm ll-search-btn">
            Search
          </button>
        </form>

        {/* Facet Dropdowns */}
        <div className="ll-filters-row">
          <div className="ll-filter-group">
            <label htmlFor="filterCity" className="ll-filter-label">
              <LocationIcon size={14} /> Station / City
            </label>
            <select
              id="filterCity"
              value={currentCity}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="ll-filter-select"
            >
              <option value="">All Pakistan Cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="ll-filter-group">
            <label htmlFor="filterPractice" className="ll-filter-label">
              <BriefcaseIcon size={14} /> Practice Area
            </label>
            <select
              id="filterPractice"
              value={currentPracticeArea}
              onChange={(e) => updateFilter('practiceArea', e.target.value)}
              className="ll-filter-select"
            >
              <option value="">All Legal Specialities</option>
              {PRACTICE_AREAS.map((p) => (
                <option key={p} value={p}>
                  {p} Law
                </option>
              ))}
            </select>
          </div>

          <div className="ll-filter-group">
            <label htmlFor="filterCourt" className="ll-filter-label">
              <CourtIcon size={14} /> Court Standing
            </label>
            <select
              id="filterCourt"
              value={currentCourtLevel}
              onChange={(e) => updateFilter('courtLevel', e.target.value)}
              className="ll-filter-select"
            >
              <option value="">All Court Jurisdictions</option>
              {COURT_LEVELS.map((cl) => (
                <option key={cl} value={cl}>
                  {cl}
                </option>
              ))}
            </select>
          </div>

          <div className="ll-filter-group">
            <label htmlFor="filterSort" className="ll-filter-label">
              <FilterIcon size={14} /> Sort Order
            </label>
            <select
              id="filterSort"
              value={currentSort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="ll-filter-select"
            >
              <option value="experience">Experience (Years at Bar)</option>
              <option value="fee_asc">Fee: Lowest to Highest</option>
              <option value="fee_desc">Fee: Highest to Lowest</option>
              <option value="newest">Recently Enrolled</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div className="ll-filter-group ll-filter-group--reset">
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-secondary btn-sm ll-reset-btn"
                title="Reset all filters"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="ll-results-meta">
        <span className="ll-results-count">
          Showing <strong>{lawyers.length}</strong> advocate{lawyers.length === 1 ? '' : 's'}
          {currentCity && ` in ${currentCity}`}
          {currentPracticeArea && ` specializing in ${currentPracticeArea} Law`}
        </span>
        <span className="ll-results-sort-hint">
          Standardized Bar Registry Listing
        </span>
      </div>

      {/* Advocate Cards Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <div className="ll-loader-spinner" />
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-3)', marginBottom: 0 }}>
            Loading advocates from the official registry...
          </p>
        </div>
      ) : lawyers.length === 0 ? (
        <EmptyState
          icon={<ScalesIcon size={44} color="var(--color-text-subtle)" />}
          title="No Advocates Found"
          description="No advocates match the selected combination of city, practice area, or search keywords. Try clearing your filters."
          action={
            hasActiveFilters && (
              <button type="button" className="btn btn-primary" onClick={handleClearFilters}>
                Reset All Filters
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="ll-advocate-grid">
            {lawyers.map((advocate) => (
              <article key={advocate.id} className="ll-advocate-card">
                {/* Header with Advocate Portrait Avatar */}
                <div className="ll-card-header">
                  <AdvocateAvatar
                    name={advocate.name}
                    courtLevel={advocate.courtLevel}
                    size={58}
                  />

                  <div className="ll-card-header__info">
                    <h2 className="ll-card-name">
                      <Link to={`/lawyers/${advocate.id}`} className="ll-card-name-link">
                        {advocate.name}
                      </Link>
                    </h2>
                    <div className="ll-standing-pill">
                      <CourtIcon size={13} color="var(--color-primary)" />
                      <span>{advocate.courtLevel}</span>
                    </div>
                    <p className="ll-card-headline">
                      {advocate.headline || `${advocate.courtLevel} practicing in ${advocate.city}`}
                    </p>
                  </div>
                </div>

                {/* Key Facts Badges */}
                <div className="ll-card-meta">
                  <span className="ll-meta-badge" title="Chamber Station">
                    <LocationIcon size={13} color="var(--color-text-muted)" />
                    <span>{advocate.city}</span>
                  </span>
                  <span className="ll-meta-badge" title="Years at Bar">
                    <BriefcaseIcon size={13} color="var(--color-text-muted)" />
                    <span>{advocate.experienceYears} Years Practice</span>
                  </span>
                  <span className="ll-meta-badge" title="Provincial Bar Council">
                    <ScalesIcon size={13} color="var(--color-text-muted)" />
                    <span>{advocate.barCouncil}</span>
                  </span>
                </div>

                {/* Practice Areas Chips */}
                {advocate.practiceAreas?.length > 0 && (
                  <div className="ll-card-practice-areas">
                    {advocate.practiceAreas.map((pa, idx) => (
                      <span key={idx} className="ll-practice-chip">
                        {pa}
                      </span>
                    ))}
                  </div>
                )}

                {/* Consultation Modes */}
                {advocate.modes?.length > 0 && (
                  <div className="ll-card-modes">
                    <span className="ll-modes-label">Modes:</span>
                    {advocate.modes.map((mode) => (
                      <span key={mode} className="ll-mode-tag" title={SERVICE_MODE_LABELS[mode] || mode}>
                        {mode === SERVICE_MODES.VIDEO && <VideoIcon size={12} />}
                        {mode === SERVICE_MODES.PHONE && <PhoneIcon size={12} />}
                        {mode === SERVICE_MODES.CHAT && <ChatIcon size={12} />}
                        {mode === SERVICE_MODES.IN_CHAMBER && <BriefcaseIcon size={12} />}
                        <span>{SERVICE_MODE_LABELS[mode] || mode}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Footer: Fee & Chamber Profile CTA */}
                <div className="ll-advocate-card__footer">
                  <div className="ll-fee-block">
                    <span className="ll-fee-label">Consultation Rate</span>
                    <span className="ll-fee-amount">
                      {advocate.feeFrom ? `From PKR ${advocate.feeFrom.toLocaleString()}` : 'Fee on Enquiry'}
                    </span>
                  </div>

                  <Link to={`/lawyers/${advocate.id}`} className="btn btn-primary btn-sm ll-profile-cta">
                    <span>View Chamber Profile</span>
                    <ArrowRightIcon size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="ll-pagination">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={currentPage <= 1}
                onClick={() => updateFilter('page', (currentPage - 1).toString())}
              >
                Previous
              </button>
              <span className="ll-pagination-info">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => updateFilter('page', (currentPage + 1).toString())}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LawyersList;
