import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfile,
  createProfile,
  updateProfile,
  getMyGigs,
  createGig,
  updateGig,
  deleteGig,
} from '../api/marketplaceApi';
import { Card, Badge, Button, Input } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

const SPECIALIZATIONS = [
  'General Practice & Litigation',
  'Constitutional & High Court Litigation',
  'Family Law & Khula',
  'Criminal Defense & Bail',
  'Corporate, Tax & Commercial Law',
  'Property, Rent & Real Estate',
  'Civil Rights & Intellectual Property',
  'Labor, Employment & Service Law',
];

const PRESET_AVATARS = [
  { label: 'Advocate Male 1', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80' },
  { label: 'Advocate Female 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80' },
  { label: 'Advocate Male 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
  { label: 'Advocate Female 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80' },
];

const PRESET_THUMBNAILS = [
  { label: 'High Court / Gavel', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80' },
  { label: 'Legal Contract / Agreement', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&auto=format&fit=crop&q=80' },
  { label: 'Corporate Office', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80' },
  { label: 'Consultation & Desk', url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&auto=format&fit=crop&q=80' },
];

function MarketplaceProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [spec, setSpec] = useState('General Practice & Litigation');
  const [bio, setBio] = useState('');
  const [fee, setFee] = useState('');
  const [casesWon, setCasesWon] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Gig Form State (Create / Edit)
  const [showGigForm, setShowGigForm] = useState(false);
  const [editingGigId, setEditingGigId] = useState(null);
  const [gigTitle, setGigTitle] = useState('');
  const [gigDesc, setGigDesc] = useState('');
  const [gigPrice, setGigPrice] = useState('');
  const [gigThumbnail, setGigThumbnail] = useState('');
  const [submittingGig, setSubmittingGig] = useState(false);
  const [gigError, setGigError] = useState('');

  // Delete Confirm Modal State
  const [deletingGigId, setDeletingGigId] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'lawyer') {
      navigate('/marketplace', { replace: true });
      return;
    }
    loadData();
  }, [user, navigate]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 4000);
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      let myProf = await getMyProfile().catch(() => null);

      // Auto-ensure profile exists seamlessly
      if (!myProf) {
        try {
          myProf = await createProfile({
            specialization: 'General Practice & Litigation',
            bio: 'Verified Advocate on LegalHub Pakistan. Providing legal consultation and court representation.',
            fee_structure: 'Rs. 10,000 / Consultation',
          });
        } catch {
          myProf = await getMyProfile().catch(() => null);
        }
      }

      setProfile(myProf);
      setSpec(myProf?.specialization || 'General Practice & Litigation');
      setBio(myProf?.bio || '');
      setFee(myProf?.fee_structure || '');
      setCasesWon(myProf?.cases_won || 0);
      setAvatarUrl(myProf?.avatar_url || '');
      setWhatsappNumber(myProf?.whatsapp_number || '');

      // Load all lawyer gigs
      const myGigs = await getMyGigs().catch(() => []);
      setGigs(myGigs);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load marketplace module');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      const updated = await updateProfile({
        specialization: spec,
        bio: bio.trim() || undefined,
        fee_structure: fee.trim() || undefined,
        cases_won: Number(casesWon),
        avatar_url: avatarUrl.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
      });
      setProfile((prev) => ({ ...prev, ...updated }));
      setEditingProfile(false);
      showToast('✅ Profile information updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  function openCreateGigForm() {
    setEditingGigId(null);
    setGigTitle('');
    setGigDesc('');
    setGigPrice('');
    setGigThumbnail(PRESET_THUMBNAILS[0].url);
    setGigError('');
    setShowGigForm(true);
  }

  function openEditGigForm(gig) {
    setEditingGigId(gig.id);
    setGigTitle(gig.title);
    setGigDesc(gig.description || '');
    setGigPrice(String(gig.price));
    setGigThumbnail(gig.thumbnail_url || PRESET_THUMBNAILS[0].url);
    setGigError('');
    setShowGigForm(true);
  }

  async function handleGigSubmit(e) {
    e.preventDefault();
    if (!gigTitle.trim() || !gigPrice) {
      setGigError('Title and price are required');
      return;
    }
    setSubmittingGig(true);
    setGigError('');
    try {
      if (editingGigId) {
        // UPDATE GIG
        const updated = await updateGig(editingGigId, {
          title: gigTitle.trim(),
          description: gigDesc.trim() || undefined,
          price: Number(gigPrice),
          thumbnail_url: gigThumbnail.trim() || undefined,
        });
        setGigs((prev) => prev.map((g) => (g.id === editingGigId ? updated : g)));
        showToast('✏️ Gig updated successfully!');
      } else {
        // CREATE GIG
        const created = await createGig({
          title: gigTitle.trim(),
          description: gigDesc.trim() || undefined,
          price: Number(gigPrice),
          thumbnail_url: gigThumbnail.trim() || undefined,
        });
        setGigs((prev) => [created, ...prev]);
        showToast('🚀 New Gig published to Marketplace!');
      }
      setShowGigForm(false);
      setEditingGigId(null);
    } catch (err) {
      setGigError(err.response?.data?.error || 'Failed to save gig');
    } finally {
      setSubmittingGig(false);
    }
  }

  async function handleDeleteGig(gigId) {
    try {
      await deleteGig(gigId);
      setGigs((prev) => prev.filter((g) => g.id !== gigId));
      setDeletingGigId(null);
      showToast('🗑️ Gig deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete gig');
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-secondary)', padding: '20px' }}>Loading Gig Management Module…</p>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '12px 18px', marginBottom: '20px',
              backgroundColor: '#ECFDF5', border: '1px solid var(--color-success)',
              color: '#065F46', borderRadius: 'var(--radius-sm)',
              fontSize: '14px', fontWeight: 600, display: 'flex',
              justifyContent: 'space-between', alignItems: 'center'
            }}
          >
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: 'var(--color-secondary)', fontSize: '24px', fontWeight: 800 }}>
            Lawyer Marketplace & Gig Module
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
            Manage your advocate profile and publish legal service packages for prospective clients across Pakistan.
          </p>
        </div>

        <Button onClick={openCreateGigForm} style={{ marginTop: 0, padding: '10px 20px', fontWeight: 700 }}>
          + Create New Gig
        </Button>
      </div>

      {error && <p style={{ color: 'var(--color-danger)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

      {/* ── INTERACTIVE PROFILE OVERVIEW BANNER (ABOVE GIGS) ──────────────── */}
      {profile && (
        <Card style={{
          marginBottom: '28px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
          borderLeft: profile.is_verified ? '5px solid var(--color-success)' : '5px solid var(--color-warning)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            
            {/* Left: Avatar & Advocate Info */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80'}
                alt={profile.lawyer?.name || 'Advocate'}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)', flexShrink: 0 }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--color-secondary)' }}>
                    Adv. {profile.lawyer?.name || 'Advocate'}
                  </h3>
                  <Badge status={profile.is_verified ? 'Paid' : 'Pending'} label={profile.is_verified ? 'Verified Advocate' : 'Pending Admin Verification'} />
                </div>

                <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  ⚖️ {profile.specialization}
                </p>

                {profile.bio && (
                  <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {profile.bio}
                  </p>
                )}

                {/* Interactive Quick Stats Pills */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    backgroundColor: 'rgba(15,92,60,0.08)', color: 'var(--color-primary)',
                    fontSize: '12.5px', fontWeight: 700, padding: '5px 12px', borderRadius: '9999px'
                  }}>
                    🏆 {profile.cases_won || 0} Cases Won
                  </span>

                  <span style={{
                    backgroundColor: 'rgba(201,162,39,0.14)', color: 'var(--color-accent)',
                    fontSize: '12.5px', fontWeight: 700, padding: '5px 12px', borderRadius: '9999px'
                  }}>
                    💰 {profile.fee_structure || 'Negotiable'}
                  </span>

                  <span style={{
                    backgroundColor: 'rgba(59,130,196,0.1)', color: 'var(--color-info)',
                    fontSize: '12.5px', fontWeight: 700, padding: '5px 12px', borderRadius: '9999px'
                  }}>
                    📦 {gigs.length} Published Service Packages
                  </span>

                  {/* Private WhatsApp Admin Badge (Only visible to advocate & admin) */}
                  <span style={{
                    backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D',
                    fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '9999px'
                  }} title="Admin verification contact number (not visible to public)">
                    🔒 WhatsApp (Admin Verification): <strong>{profile.whatsapp_number || 'Not set (Click edit)'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Edit Toggle Button */}
            <Button variant="secondary" onClick={() => setEditingProfile(!editingProfile)} style={{ marginTop: 0, fontWeight: 700 }}>
              {editingProfile ? 'Close Edit Form' : '✏️ Edit Profile Info'}
            </Button>
          </div>

          {/* Edit Profile Form Container */}
          {editingProfile && (
            <form onSubmit={handleSaveProfile} style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, margin: '0 0 14px', color: 'var(--color-secondary)' }}>
                Edit Advocate Profile & Verification Info
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                {/* Specialization Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                    Specialization *
                  </label>
                  <select
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    required
                    style={{
                      width: '100%', minHeight: '42px', padding: '0 12px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                      fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', backgroundColor: '#FFF'
                    }}
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* WhatsApp Contact Number for Admin Verification */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                    WhatsApp / Contact Number (Admin Verification) *
                  </label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. +923001234567"
                    required
                    style={{
                      width: '100%', minHeight: '42px', padding: '0 12px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                      fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', backgroundColor: '#FFF'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                    🔒 Used exclusively by LegalHub Admins for license verification. Never shown to public.
                  </span>
                </div>

                {/* Cases Won */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                    Cases Won *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={casesWon}
                    onChange={(e) => setCasesWon(e.target.value)}
                    required
                    style={{
                      width: '100%', minHeight: '42px', padding: '0 12px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                      fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', backgroundColor: '#FFF'
                    }}
                  />
                </div>

                {/* Fee Structure */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                    Fee Structure
                  </label>
                  <input
                    type="text"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="e.g. Rs. 15,000 / Hearing"
                    style={{
                      width: '100%', minHeight: '42px', padding: '0 12px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                      fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', backgroundColor: '#FFF'
                    }}
                  />
                </div>
              </div>

              {/* Profile Picture URL & Preset Picker */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  style={{
                    width: '100%', minHeight: '42px', padding: '0 12px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                    fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', backgroundColor: '#FFF',
                    marginBottom: '8px'
                  }}
                />
                
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Or select a preset profile photo:
                </span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {PRESET_AVATARS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      style={{
                        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                        border: avatarUrl === preset.url ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: avatarUrl === preset.url ? 'rgba(15,92,60,0.08)' : '#FFF',
                        fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <img src={preset.url} alt={preset.label} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio / Experience */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Bio / Advocate Professional Experience
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Describe your legal qualifications, court experience, and track record…"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Saving Changes…' : 'Save Profile Changes'}
                </Button>
                <Button variant="secondary" onClick={() => setEditingProfile(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* ── GIG CREATION / EDIT FORM MODAL ────────────────────────────────── */}
      <AnimatePresence>
        {showGigForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ marginBottom: '28px' }}
          >
            <Card style={{ backgroundColor: '#F9FAFB', border: '2px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  {editingGigId ? '✏️ Edit Legal Service Package' : '🚀 Publish New Legal Service Package / Gig'}
                </h3>
                <button onClick={() => setShowGigForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>

              <form onSubmit={handleGigSubmit}>
                <Input
                  label="Gig Title *"
                  value={gigTitle}
                  onChange={(e) => setGigTitle(e.target.value)}
                  placeholder="e.g. High Court Appeal Petition & Case Summary"
                  required
                />
                
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    Gig Description
                  </label>
                  <textarea
                    value={gigDesc}
                    onChange={(e) => setGigDesc(e.target.value)}
                    placeholder="Detail what is included in this service (e.g. 1-hour consultation, petition drafting, High Court filing)…"
                    rows={3}
                    style={{
                      display: 'block', width: '100%', padding: '10px 12px',
                      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                      fontSize: '14px', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-surface)',
                      boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <Input
                    label="Package Price (PKR) *"
                    type="number"
                    value={gigPrice}
                    onChange={(e) => setGigPrice(e.target.value)}
                    placeholder="e.g. 25000"
                    required
                  />

                  {/* Gig Thumbnail URL Field */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                      Gig Thumbnail Image URL
                    </label>
                    <input
                      type="url"
                      value={gigThumbnail}
                      onChange={(e) => setGigThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      style={{
                        width: '100%', minHeight: '42px', padding: '0 12px',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                        fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', backgroundColor: '#FFF'
                      }}
                    />
                  </div>
                </div>

                {/* Preset Thumbnails Picker */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Select a preset thumbnail image for your gig:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    {PRESET_THUMBNAILS.map((thumb, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setGigThumbnail(thumb.url)}
                        style={{
                          padding: '6px', borderRadius: 'var(--radius-sm)',
                          border: gigThumbnail === thumb.url ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: '#FFF', cursor: 'pointer', textAlign: 'left'
                        }}
                      >
                        <img src={thumb.url} alt={thumb.label} style={{ width: '100%', height: '65px', borderRadius: '4px', objectFit: 'cover', marginBottom: '4px' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {thumb.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {gigError && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{gigError}</p>}

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <Button type="submit" disabled={submittingGig}>
                    {submittingGig ? 'Saving…' : editingGigId ? 'Update Gig' : 'Publish Gig to Marketplace'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowGigForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GIGS LIST (READ, UPDATE, DELETE) ────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-secondary)' }}>
            Published Service Packages ({gigs.length})
          </h3>
        </div>

        {gigs.length === 0 && !showGigForm && (
          <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>📦</span>
            <h4 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 8px', fontSize: '16px', color: 'var(--color-secondary)' }}>
              No Legal Gigs Published Yet
            </h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
              Create your first legal service package to start offering legal assistance to clients on the Marketplace.
            </p>
            <Button onClick={openCreateGigForm}>+ Publish Your First Gig</Button>
          </Card>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {gigs.map((gig) => (
            <Card key={gig.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0', overflow: 'hidden' }}>
              {/* Gig Thumbnail */}
              <div style={{ height: '140px', width: '100%', backgroundColor: '#E5E7EB', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={gig.thumbnail_url || PRESET_THUMBNAILS[0].url}
                  alt={gig.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <span style={{
                    backgroundColor: 'rgba(0,0,0,0.75)', color: '#FFF', fontSize: '13px',
                    fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', backdropFilter: 'blur(4px)'
                  }}>
                    Rs. {Number(gig.price).toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '16px', color: 'var(--color-secondary)' }}>{gig.title}</h4>
                  {gig.description && (
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                      {gig.description}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={() => openEditGigForm(gig)} style={{ flex: 1, marginTop: 0, fontSize: '13px', padding: '6px 12px' }}>
                      ✏️ Edit
                    </Button>
                    <Button variant="danger" onClick={() => setDeletingGigId(gig.id)} style={{ marginTop: 0, fontSize: '13px', padding: '6px 12px' }}>
                      🗑️ Delete
                    </Button>
                  </div>
                </div>

                {/* Confirm Delete Popup Overlay */}
                {deletingGigId === gig.id && (
                  <div style={{
                    marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--color-danger)',
                    backgroundColor: 'rgba(214,69,69,0.06)', padding: '12px', borderRadius: 'var(--radius-sm)'
                  }}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--color-danger)', fontWeight: 600 }}>
                      Are you sure you want to delete this Gig?
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="danger" onClick={() => handleDeleteGig(gig.id)} style={{ marginTop: 0, fontSize: '12px', padding: '4px 10px' }}>
                        Yes, Delete
                      </Button>
                      <Button variant="secondary" onClick={() => setDeletingGigId(null)} style={{ marginTop: 0, fontSize: '12px', padding: '4px 10px' }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default MarketplaceProfile;
