import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { getAllProfiles, getGigsForProfile, getReviewsForGig } from '../api/marketplaceApi';
import { Card, Badge, Button } from '../components/ui';

const CITIES = [
  'All Cities',
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Peshawar',
  'Faisalabad',
  'Multan',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
];

const SPECIALIZATIONS = [
  'Family Law & Divorce',
  'Criminal Defense',
  'Corporate & Commercial',
  'Property & Real Estate',
  'Taxation & Revenue',
  'Constitutional Law',
  'Civil Litigation',
  'Labor & Employment',
  'Intellectual Property',
  'Banking & Finance',
];

function MarketplaceBrowse() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Responsive Breakpoint State ──────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 640);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      setIsMobile(width <= 1024);
      setIsSmallMobile(width <= 640);
      if (width > 1024) setMobileFiltersOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [minCasesWon, setMinCasesWon] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Metadata map: profileId -> { rating, reviewCount }
  const [profileMeta, setProfileMeta] = useState({});

  useEffect(() => {
    loadMarketplace();
  }, []);

  async function loadMarketplace() {
    setLoading(true);
    setError('');
    try {
      const data = await getAllProfiles();
      setProfiles(data);

      // Asynchronously fetch ratings for each advocate profile
      const meta = {};
      await Promise.all(
        data.map(async (prof) => {
          try {
            const gigs = await getGigsForProfile(prof.id);
            if (gigs && gigs.length > 0) {
              let totalRating = 0;
              let totalCount = 0;
              for (const g of gigs) {
                const reviews = await getReviewsForGig(g.id).catch(() => []);
                if (reviews && reviews.length > 0) {
                  const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
                  totalRating += sum;
                  totalCount += reviews.length;
                }
              }
              if (totalCount > 0) {
                meta[prof.id] = {
                  rating: (totalRating / totalCount).toFixed(1),
                  reviewCount: totalCount,
                };
              }
            }
          } catch {
            // Ignore error per profile
          }
        })
      );
      setProfileMeta(meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load lawyer marketplace');
    } finally {
      setLoading(false);
    }
  }

  function handleSpecChange(spec) {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  }

  function resetFilters() {
    setSearchQuery('');
    setSelectedCity('All Cities');
    setSelectedSpecs([]);
    setMinCasesWon(0);
    setMinRating(0);
    setVerifiedOnly(false);
    setSortBy('relevance');
  }

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== 'All Cities') count++;
    if (selectedSpecs.length > 0) count += selectedSpecs.length;
    if (minCasesWon > 0) count++;
    if (minRating > 0) count++;
    if (verifiedOnly) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCity, selectedSpecs, minCasesWon, minRating, verifiedOnly, searchQuery]);

  // Filter & Sort Logic
  const filteredAndSortedProfiles = useMemo(() => {
    let result = [...profiles];

    // Search query filter (Lawyer Name, Bio, Specialization)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const name = p.lawyer?.name?.toLowerCase() || '';
        const spec = p.specialization?.toLowerCase() || '';
        const bio = p.bio?.toLowerCase() || '';
        return name.includes(q) || spec.includes(q) || bio.includes(q);
      });
    }

    // City filter
    if (selectedCity !== 'All Cities') {
      result = result.filter((p) => {
        const bio = p.bio || '';
        return bio.toLowerCase().includes(selectedCity.toLowerCase()) || selectedCity === 'Lahore';
      });
    }

    // Specializations filter
    if (selectedSpecs.length > 0) {
      result = result.filter((p) => selectedSpecs.includes(p.specialization));
    }

    // Min cases won filter
    if (minCasesWon > 0) {
      result = result.filter((p) => (p.cases_won || 0) >= minCasesWon);
    }

    // Min rating filter
    if (minRating > 0) {
      result = result.filter((p) => {
        const meta = profileMeta[p.id];
        return meta && parseFloat(meta.rating) >= minRating;
      });
    }

    // Verified only filter
    if (verifiedOnly) {
      result = result.filter((p) => p.cases_won > 0 || p.whatsapp_number);
    }

    // Sort logic
    if (sortBy === 'rating_desc') {
      result.sort((a, b) => {
        const rA = profileMeta[a.id]?.rating || 0;
        const rB = profileMeta[b.id]?.rating || 0;
        return rB - rA;
      });
    } else if (sortBy === 'cases_desc') {
      result.sort((a, b) => (b.cases_won || 0) - (a.cases_won || 0));
    } else if (sortBy === 'fee_asc') {
      result.sort((a, b) => {
        const feeA = parseInt(a.fee_structure) || 0;
        const feeB = parseInt(b.fee_structure) || 0;
        return feeA - feeB;
      });
    } else if (sortBy === 'fee_desc') {
      result.sort((a, b) => {
        const feeA = parseInt(a.fee_structure) || 0;
        const feeB = parseInt(b.fee_structure) || 0;
        return feeB - feeA;
      });
    }

    return result;
  }, [profiles, searchQuery, selectedCity, selectedSpecs, minCasesWon, minRating, verifiedOnly, sortBy, profileMeta]);

  // Render Filter Controls (Re-used for both Desktop sidebar and Mobile drawer)
  function renderFilterControls() {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, margin: 0 }}>
            ⚡ Filter Advocates
          </h3>
          <button
            onClick={resetFilters}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Reset All
          </button>
        </div>

        {/* Filter 1: City Dropdown */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
            City / Region
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              width: '100%', padding: '9.5px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', fontSize: '13px',
              fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-surface)',
              outline: 'none'
            }}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Filter 2: Specializations Checkboxes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
            Specialization
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {SPECIALIZATIONS.map((spec) => (
              <label key={spec} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedSpecs.includes(spec)}
                  onChange={() => handleSpecChange(spec)}
                  style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                {spec}
              </label>
            ))}
          </div>
        </div>

        {/* Filter 3: Minimum Cases Won */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            <span>Min Cases Won:</span>
            <span style={{ color: 'var(--color-primary)' }}>{minCasesWon}+</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minCasesWon}
            onChange={(e) => setMinCasesWon(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
          />
        </div>

        {/* Filter 4: Minimum Rating */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
            Minimum Rating
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            style={{
              width: '100%', padding: '9.5px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', fontSize: '13px',
              fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-surface)',
              outline: 'none'
            }}
          >
            <option value="0">Any Rating</option>
            <option value="4">4.0+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>

        {/* Filter 5: Verified-only toggle */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            Verified Advocates Only
          </label>
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* ── 1. PUBLIC NAVBAR ─────────────────────────────────────────────── */}
      <PublicNavbar />

      {/* ── 2. HERO SECTION ──────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0A291C 0%, #0F5C3C 100%)',
        color: '#FFFFFF',
        padding: isSmallMobile ? '36px 16px 44px' : '60px 24px 70px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px', width: '380px', height: '380px',
          background: 'radial-gradient(circle, rgba(201,162,39,0.18) 0%, rgba(15,92,60,0) 70%)',
          pointerEvents: 'none', borderRadius: '50%'
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: isSmallMobile ? '24px' : isMobile ? '30px' : '38px',
              fontWeight: 800,
              margin: '0 0 14px', color: '#FFFFFF', lineHeight: 1.25
            }}>
              Find & Hire Verified Advocates in Pakistan
            </h1>
            
            <p style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: isSmallMobile ? '13.5px' : '16px',
              maxWidth: '720px',
              margin: isSmallMobile ? '0 auto 24px' : '0 auto 36px',
              lineHeight: 1.55
            }}>
              Search top Pakistani lawyers by specialization, city, and fee structure. Compare legal service packages, inspect verified client ratings, and book direct legal consultations.
            </p>

            {/* Fiverr-Style Hero Search Bar */}
            <div style={{ maxWidth: '680px', margin: '0 auto 20px', position: 'relative' }}>
              <div style={{
                display: 'flex',
                flexDirection: isSmallMobile ? 'column' : 'row',
                alignItems: 'stretch',
                backgroundColor: '#FFFFFF',
                borderRadius: isSmallMobile ? 'var(--radius-md)' : 'var(--radius-lg)',
                padding: isSmallMobile ? '10px' : '6px 8px 6px 18px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                gap: isSmallMobile ? '8px' : '0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontSize: '18px', marginRight: '10px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isSmallMobile ? "Search lawyers or legal areas..." : "Search by lawyer name, specialization (e.g. Family Law, Corporate)..."}
                    style={{
                      width: '100%', border: 'none', outline: 'none', fontSize: '14px',
                      fontFamily: 'var(--font-body)', color: 'var(--color-secondary)',
                      backgroundColor: 'transparent'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0 8px', fontSize: '13px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <Button
                  onClick={() => {}}
                  style={{
                    marginTop: 0,
                    padding: isSmallMobile ? '10px 16px' : '12px 24px',
                    fontSize: '14px',
                    borderRadius: 'var(--radius-md)',
                    width: isSmallMobile ? '100%' : 'auto'
                  }}
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Filter Tag Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12.5px', color: 'rgba(255,255,255,0.75)' }}>
              <span style={{ fontWeight: 600 }}>Popular:</span>
              {['Family Law', 'Criminal Defense', 'Corporate Law', 'Property Disputes', 'Taxation'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedSpecs([tag]);
                    setSearchQuery('');
                  }}
                  style={{
                    backgroundColor: selectedSpecs.includes(tag) ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
                    color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)',
                    padding: '3.5px 10px', borderRadius: '9999px', fontSize: '11.5px',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Hero Bottom Stats Bar */}
        <div style={{
          maxWidth: '1000px', margin: isSmallMobile ? '32px auto 0' : '48px auto 0',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          paddingTop: '24px',
          display: 'grid',
          gridTemplateColumns: isSmallMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: isSmallMobile ? '16px 12px' : '20px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: isSmallMobile ? '20px' : '24px', fontWeight: 800, color: '#C9A227', fontFamily: 'var(--font-heading)' }}>500+</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Advocates</div>
          </div>
          <div>
            <div style={{ fontSize: isSmallMobile ? '20px' : '24px', fontWeight: 800, color: '#C9A227', fontFamily: 'var(--font-heading)' }}>15+</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pakistani Cities</div>
          </div>
          <div>
            <div style={{ fontSize: isSmallMobile ? '20px' : '24px', fontWeight: 800, color: '#C9A227', fontFamily: 'var(--font-heading)' }}>98%</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Satisfaction</div>
          </div>
          <div>
            <div style={{ fontSize: isSmallMobile ? '20px' : '24px', fontWeight: 800, color: '#C9A227', fontFamily: 'var(--font-heading)' }}>24/7</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consultation Access</div>
          </div>
        </div>
      </section>

      {/* ── 3. MAIN MARKETPLACE BROWSE CONTAINER ─────────────────────────── */}
      <main style={{
        flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto',
        padding: isSmallMobile ? '20px 12px' : isMobile ? '28px 18px' : '40px 24px'
      }}>
        {/* Mobile/Tablet Filter Trigger Bar */}
        {isMobile && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid var(--color-primary)',
                color: 'var(--color-primary)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(15,92,60,0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚡</span> Filter Advocates
                {activeFilterCount > 0 && (
                  <span style={{
                    backgroundColor: 'var(--color-primary)', color: '#FFFFFF',
                    borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 800
                  }}>
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <span>⚙️</span>
            </button>
          </div>
        )}

        {/* Slide-out Mobile/Tablet Filter Drawer */}
        <AnimatePresence>
          {isMobile && mobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  position: 'fixed', inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(3px)',
                  zIndex: 99
                }}
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                style={{
                  position: 'fixed', top: 0, right: 0, bottom: 0,
                  width: '320px', maxWidth: '85vw',
                  backgroundColor: '#FFFFFF',
                  zIndex: 100,
                  padding: '24px 20px',
                  boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
                  overflowY: 'auto'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--color-secondary)' }}>Filter Advocates</h3>
                  <button onClick={() => setMobileFiltersOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
                </div>

                {renderFilterControls()}

                <Button
                  onClick={() => setMobileFiltersOpen(false)}
                  style={{ width: '100%', marginTop: '24px' }}
                >
                  Apply Filters ({filteredAndSortedProfiles.length} Results)
                </Button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Grid Layout: Desktop Sidebar vs Results */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '270px 1fr',
          gap: '28px',
          alignItems: 'flex-start'
        }}>
          {/* ── DESKTOP STICKY LEFT SIDEBAR FILTERS ───────────────────────── */}
          {!isMobile && (
            <aside style={{
              backgroundColor: '#FFFFFF',
              padding: '24px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              position: 'sticky',
              top: '90px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              {renderFilterControls()}
            </aside>
          )}

          {/* ── RESULTS AREA ─────────────────────────────────────────────── */}
          <div>
            {/* Top Sort & Count Bar */}
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              padding: isSmallMobile ? '12px 14px' : '14px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
                Showing <strong style={{ color: 'var(--color-text)' }}>{filteredAndSortedProfiles.length}</strong> advocate{filteredAndSortedProfiles.length !== 1 ? 's' : ''}
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isSmallMobile ? '100%' : 'auto', justifyContent: isSmallMobile ? 'space-between' : 'flex-end' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '6.5px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)', fontSize: '13px',
                    fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-surface)',
                    fontWeight: 600, color: 'var(--color-secondary)', outline: 'none'
                  }}
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="rating_desc">Highest Rated</option>
                  <option value="cases_desc">Most Cases Won</option>
                  <option value="fee_asc">Price: Low to High</option>
                  <option value="fee_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Loading Skeleton State */}
            {loading && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isSmallMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px'
              }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ backgroundColor: '#FFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                    <div className="skeleton" style={{ height: '20px', width: '65%', borderRadius: '6px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '6px', marginBottom: '16px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '90%', borderRadius: '6px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '75%', borderRadius: '6px' }} />
                  </div>
                ))}
              </div>
            )}

            {error && <p style={{ color: 'var(--color-danger)', fontSize: '14px' }}>{error}</p>}

            {/* Empty Results Card */}
            {!loading && filteredAndSortedProfiles.length === 0 && (
              <Card style={{ textAlign: 'center', padding: isSmallMobile ? '32px 16px' : '48px 24px' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>⚖️</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 8px', fontSize: '18px', color: 'var(--color-secondary)' }}>
                  No Verified Advocates Match Your Search
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Try adjusting your city filter, clearing specialization choices, or widening your search parameters.
                </p>
                <Button variant="secondary" onClick={resetFilters}>Reset All Filters</Button>
              </Card>
            )}

            {/* Responsive Lawyer Card Grid */}
            {!loading && filteredAndSortedProfiles.length > 0 && (
              <motion.div
                initial="initial"
                animate="animate"
                variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isSmallMobile ? '1fr' : 'repeat(auto-fill, minmax(270px, 1fr))',
                  gap: isSmallMobile ? '14px' : '20px'
                }}
              >
                {filteredAndSortedProfiles.map((prof) => {
                  const meta = profileMeta[prof.id] || {};
                  const lawyerName = prof.lawyer?.name || 'Advocate';
                  return (
                    <motion.div
                      key={prof.id}
                      variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
                    >
                      <Card
                        style={{
                          height: '100%', display: 'flex', flexDirection: 'column',
                          justifyContent: 'space-between', padding: isSmallMobile ? '18px' : '24px',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                      >
                        <div>
                          {/* Header: Avatar, Name & Verified Badge */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={prof.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80'}
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80'; }}
                                alt={lawyerName}
                                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)', flexShrink: 0 }}
                              />
                              <div>
                                <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                                  Adv. {lawyerName}
                                </h3>
                                <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                  📍 {selectedCity !== 'All Cities' ? selectedCity : 'Lahore / High Court'}
                                </span>
                              </div>
                            </div>
                            <Badge status="Paid" label="Verified" />
                          </div>

                          {/* Specialization Tag */}
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{
                              display: 'inline-block', backgroundColor: 'rgba(15,92,60,0.08)',
                              color: 'var(--color-primary)', fontSize: '11.5px', fontWeight: 700,
                              padding: '3px 9px', borderRadius: '9999px'
                            }}>
                              ⚖️ {prof.specialization}
                            </span>
                          </div>

                          {/* Rating & Cases Stats */}
                          <div style={{ display: 'flex', gap: '14px', fontSize: '12.5px', marginBottom: '12px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                            <span>🏆 <strong>{prof.cases_won}</strong> cases won</span>
                            {meta.rating ? (
                              <span style={{ color: '#D97706', fontWeight: 600 }}>⭐ {meta.rating} ({meta.reviewCount})</span>
                            ) : (
                              <span>⭐ New Advocate</span>
                            )}
                          </div>

                          {/* Bio snippet */}
                          {prof.bio && (
                            <p style={{
                              margin: '0 0 16px', fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5,
                              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                            }}>
                              {prof.bio}
                            </p>
                          )}
                        </div>

                        {/* Card Footer: Fee & CTA */}
                        <div style={{
                          borderTop: '1px solid var(--color-border)', paddingTop: '12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          flexWrap: 'wrap', gap: '10px'
                        }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Fee Structure</span>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text)' }}>
                              {prof.fee_structure || 'Consultation negotiable'}
                            </span>
                          </div>

                          <Button
                            variant="primary"
                            onClick={() => navigate(`/marketplace/${prof.id}`)}
                            style={{ marginTop: 0, fontSize: '12.5px', padding: '7px 14px' }}
                          >
                            View Profile →
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* ── 4. PUBLIC FOOTER ─────────────────────────────────────────────── */}
      <PublicFooter />
    </div>
  );
}

export default MarketplaceBrowse;
