import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { directoryApi } from '../api/directory.api';
import { CITIES, PRACTICE_AREAS } from '../constants';

export const LawyersList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params with defaults
  const currentCity = searchParams.get('city') || '';
  const currentPracticeArea = searchParams.get('practiceArea') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [lawyers, setLawyers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch lawyers from public directory API
  const fetchLawyers = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = {
        page: currentPage,
        limit: 9,
      };
      if (currentCity) params.city = currentCity;
      if (currentPracticeArea) params.practiceArea = currentPracticeArea;

      const response = await directoryApi.getLawyers(params);
      if (response) {
        const items = response.items || response.lawyers || response.data?.items || response.data?.lawyers || [];
        const total = response.total ?? response.pagination?.total ?? items.length;
        const page = response.page ?? response.pagination?.page ?? currentPage;
        const limit = response.limit ?? response.pagination?.limit ?? 9;
        const totalPages = response.totalPages ?? response.pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));

        setLawyers(items);
        setPagination({ total, page, limit, totalPages });
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load public lawyer directory');
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  }, [currentCity, currentPracticeArea, currentPage]);

  useEffect(() => {
    fetchLawyers();
  }, [fetchLawyers]);

  // Handle filter dropdown changes (resets to page 1)
  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle pagination navigation
  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: 'var(--spacing-2)' }}>
          Verified Public Legal Directory
        </h1>
        <p style={{ maxWidth: '650px', margin: '0 auto' }}>
          Connect with Bar Council-verified advocates across Pakistan. Every practitioner listed below has been
          scrutinized and cleared by the Court Administrator.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--spacing-8)',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--spacing-4)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--spacing-4)',
            alignItems: 'center',
          }}
        >
          <div>
            <label
              htmlFor="cityFilter"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-1)',
                color: 'var(--color-text-muted)',
              }}
            >
              Filter by City:
            </label>
            <select
              id="cityFilter"
              value={currentCity}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-2) var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            >
              <option value="">All Cities (Pakistan)</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="practiceAreaFilter"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-1)',
                color: 'var(--color-text-muted)',
              }}
            >
              Filter by Practice Area:
            </label>
            <select
              id="practiceAreaFilter"
              value={currentPracticeArea}
              onChange={(e) => handleFilterChange('practiceArea', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-2) var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            >
              <option value="">All Practice Areas</option>
              {PRACTICE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a} Law
                </option>
              ))}
            </select>
          </div>

          {(currentCity || currentPracticeArea) && (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
              <button
                onClick={() => setSearchParams({ page: '1' })}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          <strong>Notice:</strong> {errorMessage}
        </div>
      )}

      {/* Directory Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-primary" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p>Searching verified advocates across Pakistan...</p>
        </div>
      ) : lawyers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-2)' }}>🔍</div>
          <h3>No Verified Advocates Found</h3>
          <p style={{ marginTop: 'var(--spacing-2)', maxWidth: '440px', margin: '0 auto' }}>
            No verified lawyers matched your active filters
            {currentCity ? ` in ${currentCity}` : ''}
            {currentPracticeArea ? ` for ${currentPracticeArea} Law` : ''}.
          </p>
          {(currentCity || currentPracticeArea) && (
            <button
              onClick={() => setSearchParams({ page: '1' })}
              className="btn btn-primary btn-sm"
              style={{ marginTop: 'var(--spacing-4)' }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--spacing-6)',
              marginBottom: 'var(--spacing-8)',
            }}
          >
            {lawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '4px solid var(--color-primary)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>
                      {lawyer.name}
                    </h3>
                    <span
                      style={{
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                      }}
                    >
                      {lawyer.city}
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', marginBottom: 'var(--spacing-3)' }}>
                    <span>{lawyer.courtLevel}</span> • <span>{lawyer.experienceYears} Years Experience</span>
                    <div style={{ marginTop: '0.15rem' }}>{lawyer.barCouncil}</div>
                  </div>

                  {/* Practice Areas Badges */}
                  <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap', marginBottom: 'var(--spacing-3)' }}>
                    {lawyer.practiceAreas?.map((area) => (
                      <span
                        key={area}
                        style={{
                          backgroundColor: 'var(--color-surface-hover)',
                          border: '1px solid var(--color-border)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {area}
                      </span>
                    ))}
                  </div>

                  {/* Bio Snippet */}
                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: 'var(--spacing-4)',
                    }}
                  >
                    {lawyer.bio}
                  </p>
                </div>

                <Link
                  to={`/lawyers/${lawyer.id}`}
                  className="btn btn-outline btn-block btn-sm"
                  style={{ marginTop: 'auto' }}
                >
                  View Verified Profile →
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--spacing-4)',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--spacing-4)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
              Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} verified advocates)
            </span>

            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-secondary btn-sm"
              >
                ← Previous
              </button>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LawyersList;
