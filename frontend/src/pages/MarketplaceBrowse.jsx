import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { getAllProfiles, getGigsForProfile, getReviewsForGig } from '../api/marketplaceApi';
import { createCase } from '../api/caseApi';
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
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  }

  // View Mode: 'advocates' | 'gigs'
  const [viewMode, setViewMode] = useState('advocates');

  // Responsive Breakpoint State
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
  const [sortBy, setSortBy] = useState('relevance');

  // Metadata maps
  const [profileMeta, setProfileMeta] = useState({});
  const [profileGigsMap, setProfileGigsMap] = useState({});
  const [allGigsList, setAllGigsList] = useState([]);

  // Hire Modal State
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedTargetLawyer, setSelectedTargetLawyer] = useState(null);
  const [selectedGigItem, setSelectedGigItem] = useState(null);
  const [hireCaseType, setHireCaseType] = useState('Civil');
  const [hireSummary, setHireSummary] = useState('');
  const [hiringSubmitting, setHiringSubmitting] = useState(false);

  useEffect(() => {
    loadMarketplace();
  }, []);

  async function loadMarketplace() {
    setLoading(true);
    setError('');
    try {
      const data = await getAllProfiles();
      setProfiles(data);

      const meta = {};
      const gigsMap = {};
      const gigsFlat = [];

      await Promise.all(
        data.map(async (prof) => {
          try {
            const gigs = await getGigsForProfile(prof.id);
            gigsMap[prof.id] = gigs || [];

            if (gigs && gigs.length > 0) {
              let totalRating = 0;
              let totalCount = 0;

              for (const g of gigs) {
                gigsFlat.push({ ...g, lawyerProfile: prof });
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
            // silent catch per profile
          }
        })
      );

      setProfileMeta(meta);
      setProfileGigsMap(gigsMap);
      setAllGigsList(gigsFlat);
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
    setSortBy('relevance');
  }

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== 'All Cities') count++;
    if (selectedSpecs.length > 0) count += selectedSpecs.length;
    if (minCasesWon > 0) count++;
    if (minRating > 0) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCity, selectedSpecs, minCasesWon, minRating, searchQuery]);

  // Filter & Sort Logic for Profiles
  const filteredAndSortedProfiles = useMemo(() => {
    let result = [...profiles];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const name = p.lawyer?.name?.toLowerCase() || '';
        const spec = p.specialization?.toLowerCase() || '';
        const bio = p.bio?.toLowerCase() || '';
        const city = p.city?.toLowerCase() || '';
        return name.includes(q) || spec.includes(q) || bio.includes(q) || city.includes(q);
      });
    }

    if (selectedCity !== 'All Cities') {
      result = result.filter((p) => {
        const city = p.city || p.bio || '';
        return city.toLowerCase().includes(selectedCity.toLowerCase());
      });
    }

    if (selectedSpecs.length > 0) {
      result = result.filter((p) => selectedSpecs.includes(p.specialization));
    }

    if (minCasesWon > 0) {
      result = result.filter((p) => (p.cases_won || 0) >= minCasesWon);
    }

    if (minRating > 0) {
      result = result.filter((p) => {
        const meta = profileMeta[p.id];
        return meta && parseFloat(meta.rating) >= minRating;
      });
    }

    if (sortBy === 'rating_desc') {
      result.sort((a, b) => (profileMeta[b.id]?.rating || 0) - (profileMeta[a.id]?.rating || 0));
    } else if (sortBy === 'cases_desc') {
      result.sort((a, b) => (b.cases_won || 0) - (a.cases_won || 0));
    }

    return result;
  }, [profiles, searchQuery, selectedCity, selectedSpecs, minCasesWon, minRating, sortBy, profileMeta]);

  // Filter Logic for Service Gigs
  const filteredGigs = useMemo(() => {
    let result = [...allGigsList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g =>
        g.title?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q) ||
        g.lawyerProfile?.lawyer?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allGigsList, searchQuery]);

  function handleOpenHireModal(lawyerProfile, gigItem = null) {
    if (!user) {
      navigate(`/login?redirect=/marketplace`);
      return;
    }
    setSelectedTargetLawyer(lawyerProfile);
    setSelectedGigItem(gigItem);
    if (gigItem?.category) setHireCaseType(gigItem.category);
    setShowHireModal(true);
  }

  async function handleConfirmHireSubmit(e) {
    e.preventDefault();
    if (!selectedTargetLawyer?.lawyer_id) return;
    setHiringSubmitting(true);
    try {
      const created = await createCase({
        lawyer_id: selectedTargetLawyer.lawyer_id,
        case_number: 'LH-' + Math.floor(100000 + Math.random() * 900000),
        court_name: selectedTargetLawyer.court_level || 'High Court',
        case_type: hireCaseType,
      });
      setShowHireModal(false);
      showToast('🎉 Advocate hired successfully! Opening your case workspace...');
      setTimeout(() => {
        navigate(`/cases/${created.id}`);
      }, 1000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process hiring request.');
    } finally {
      setHiringSubmitting(false);
    }
  }

  const renderFilterControls = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--color-secondary)' }}>Filter Advocate Search</h3>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            Reset ({activeFilterCount})
          </button>
        )}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>City / Region</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '13px', backgroundColor: '#FFFFFF', outline: 'none' }}
        >
          {CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Specialization</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {SPECIALIZATIONS.map((spec) => (
            <label key={spec} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedSpecs.includes(spec)} onChange={() => handleSpecChange(spec)} style={{ accentColor: 'var(--color-primary)' }} />
              {spec}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
          <span>Min Cases Won:</span>
          <span style={{ color: 'var(--color-primary)' }}>{minCasesWon}+</span>
        </div>
        <input type="range" min="0" max="100" step="5" value={minCasesWon} onChange={(e) => setMinCasesWon(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <PublicNavbar />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
              padding: '14px 22px', backgroundColor: '#ECFDF5', border: '1.5px solid var(--color-success)',
              color: '#065F46', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0A2B1D 0%, #0F5C3C 55%, #072619 100%)', color: '#FFFFFF', padding: isSmallMobile ? '36px 16px 44px' : '50px 24px 60px', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: isSmallMobile ? '24px' : '36px', fontWeight: 800, margin: '0 0 14px', color: '#FFFFFF' }}>
            Find & Hire Verified Advocates in Pakistan
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: isSmallMobile ? '13.5px' : '15.5px', maxWidth: '720px', margin: '0 auto 28px' }}>
            Browse top High Court Advocates, inspect verified client reviews, compare legal service gig packages, and hire advocates directly.
          </p>

          {/* Search Bar (Single Row) */}
          <div style={{ maxWidth: '640px', margin: '0 auto 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: '9999px', padding: '5px 6px 5px 20px', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search advocates by name, corporate, criminal, property..."
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: '14px', color: '#1F2937', backgroundColor: 'transparent', padding: '8px 0' }}
              />
              <button aria-label="Search" style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
            </div>
          </div>

          {/* View Mode Selector Pills */}
          <div style={{ display: 'inline-flex', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px', borderRadius: '9999px', backdropFilter: 'blur(8px)' }}>
            <button
              type="button"
              onClick={() => setViewMode('advocates')}
              style={{
                padding: '8px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                backgroundColor: viewMode === 'advocates' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'advocates' ? 'var(--color-primary)' : '#FFFFFF',
                fontWeight: 700, fontSize: '13px', transition: 'all 0.15s ease'
              }}
            >
              ⚖️ Verified Advocates ({filteredAndSortedProfiles.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gigs')}
              style={{
                padding: '8px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                backgroundColor: viewMode === 'gigs' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'gigs' ? 'var(--color-primary)' : '#FFFFFF',
                fontWeight: 700, fontSize: '13px', transition: 'all 0.15s ease'
              }}
            >
              📦 Fiverr-Style Service Gigs ({filteredGigs.length})
            </button>
          </div>
        </div>
      </section>

      {/* Main Browse Container */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: isSmallMobile ? '20px 12px' : '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '270px 1fr', gap: '28px', alignItems: 'flex-start' }}>
          
          {!isMobile && (
            <aside style={{ backgroundColor: '#FFFFFF', padding: '24px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', position: 'sticky', top: '90px' }}>
              {renderFilterControls()}
            </aside>
          )}

          <div>
            {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading marketplace advocates & legal service gigs…</p>}
            {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

            {!loading && viewMode === 'advocates' && filteredAndSortedProfiles.length === 0 && (
              <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>⚖️</span>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>No Advocates Found</h3>
                <Button variant="secondary" onClick={resetFilters}>Reset Search Filters</Button>
              </Card>
            )}

            {/* ── ADVOCATE PROFILES VIEW ────────────────────────────────────── */}
            {!loading && viewMode === 'advocates' && (
              <div style={{ display: 'grid', gridTemplateColumns: isSmallMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredAndSortedProfiles.map((prof) => {
                  const meta = profileMeta[prof.id] || {};
                  const gigs = profileGigsMap[prof.id] || [];
                  const lawyerName = prof.lawyer?.name || 'Advocate';

                  return (
                    <Card key={prof.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '22px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={prof.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80'}
                              alt={lawyerName}
                              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                            />
                            <div>
                              <h3 style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 800, color: 'var(--color-secondary)' }}>
                                Adv. {lawyerName}
                              </h3>
                              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                📍 {prof.city || 'Lahore'} / {prof.court_level || 'High Court'}
                              </span>
                            </div>
                          </div>
                          <Badge status="Paid" label="Verified" />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ backgroundColor: 'rgba(15,92,60,0.08)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px' }}>
                            ⚖️ {prof.specialization}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '14px', fontSize: '12.5px', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
                          <span>🏆 <strong>{prof.cases_won}</strong> cases won</span>
                          <span style={{ color: '#D97706', fontWeight: 700 }}>⭐ {meta.rating || prof.rating || '4.9'}</span>
                        </div>

                        {prof.bio && (
                          <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {prof.bio}
                          </p>
                        )}

                        {/* Top Gigs Preview */}
                        {gigs.length > 0 && (
                          <div style={{ backgroundColor: '#F9FAFB', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '6px' }}>Service Gigs & Packages</span>
                            {gigs.slice(0, 2).map((g) => (
                              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, color: '#1F2937' }}>• {g.title}</span>
                                <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>PKR {Number(g.price).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'flex', gap: '8px' }}>
                        <Button variant="secondary" onClick={() => navigate(`/marketplace/${prof.id}`)} style={{ flex: 1, fontSize: '12.5px', padding: '8px' }}>
                          View Profile
                        </Button>
                        <Button onClick={() => handleOpenHireModal(prof)} style={{ flex: 1, fontSize: '12.5px', padding: '8px', backgroundColor: 'var(--color-primary)' }}>
                          Hire Advocate ⚖️
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ── FIVERR-STYLE SERVICE GIGS VIEW ─────────────────────────────── */}
            {!loading && viewMode === 'gigs' && (
              <div style={{ display: 'grid', gridTemplateColumns: isSmallMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredGigs.map((gig) => {
                  const prof = gig.lawyerProfile;
                  return (
                    <Card key={gig.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <img src={prof?.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80'} alt="Lawyer" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Adv. {prof?.lawyer?.name || 'Advocate'}</p>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>📍 {prof?.city || 'High Court Advocate'}</span>
                          </div>
                        </div>

                        <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 800, color: 'var(--color-secondary)', lineHeight: 1.35 }}>
                          {gig.title}
                        </h4>

                        <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                          {gig.description}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Starting Fee</span>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>PKR {Number(gig.price).toLocaleString()}</span>
                        </div>
                        <Button onClick={() => handleOpenHireModal(prof, gig)} style={{ fontSize: '12.5px', padding: '8px 16px' }}>
                          Order Service 💳
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Interactive Hire Advocate / Order Service Modal */}
      {showHireModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <Card style={{ width: '100%', maxWidth: '520px', backgroundColor: '#FFFFFF', padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px', color: 'var(--color-primary)', fontSize: '18px', fontWeight: 800 }}>
              Hire Adv. {selectedTargetLawyer?.lawyer?.name || 'Advocate'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
              Service: <strong>{selectedGigItem?.title || selectedTargetLawyer?.specialization || 'Legal Representation'}</strong>
            </p>

            <form onSubmit={handleConfirmHireSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Legal Category *</label>
                <select
                  value={hireCaseType}
                  onChange={(e) => setHireCaseType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', outline: 'none' }}
                >
                  <option value="Civil">Civil Litigation</option>
                  <option value="Criminal">Criminal Defense & Bail</option>
                  <option value="Family">Family & Child Custody</option>
                  <option value="Corporate">Corporate & Contracts</option>
                  <option value="Property">Property & Land Disputes</option>
                  <option value="Constitutional">Constitutional Writ Petition</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Describe Your Legal Issue *</label>
                <textarea
                  value={hireSummary}
                  onChange={(e) => setHireSummary(e.target.value)}
                  placeholder="Provide details about your court matter, land dispute, contract, or legal assistance needed..."
                  rows={3}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Button variant="secondary" type="button" onClick={() => setShowHireModal(false)}>Cancel</Button>
                <Button type="submit" disabled={hiringSubmitting || !hireSummary.trim()}>
                  {hiringSubmitting ? 'Processing Hiring Request…' : 'Confirm & Hire Advocate ⚖️'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}

export default MarketplaceBrowse;
