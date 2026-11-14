import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { firmApi } from '../api/firm.api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  BriefcaseIcon,
  ShieldIcon,
  CloseIcon,
  TrashIcon,
  CheckIcon
} from '../components/Icons';
import './FirmTeam.css';

const DESIGNATIONS = [
  'Senior Partner',
  'Partner',
  'Senior Associate Counsel',
  'Associate Advocate',
  'Junior Counsel',
  'Chamber Associate'
];

export const FirmTeam = () => {
  const { showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [newMember, setNewMember] = useState({
    lawyerEmail: '',
    enrolmentNo: '',
    designation: 'Associate Advocate'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, statsRes] = await Promise.allSettled([
        firmApi.getMembers(),
        firmApi.getFirmStats()
      ]);

      if (membersRes.status === 'fulfilled') {
        setMembers(membersRes.value?.members || membersRes.value?.data?.members || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.stats || statsRes.value?.data?.stats || null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load chamber roster', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced search for available advocates
  useEffect(() => {
    if (!searchKeyword || searchKeyword.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await firmApi.searchLawyers(searchKeyword.trim());
        const lawyers = res?.lawyers || res?.data?.lawyers || [];
        setSearchResults(lawyers);
      } catch (err) {
        console.debug('Search advocates error:', err?.message);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const handleSelectLawyer = (lawyer) => {
    setNewMember((prev) => ({
      ...prev,
      lawyerEmail: lawyer.email,
      enrolmentNo: lawyer.enrolmentNo !== 'N/A' ? lawyer.enrolmentNo : ''
    }));
    setSearchResults([]);
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMember.lawyerEmail && !newMember.enrolmentNo) {
      showToast('Please enter advocate email or Bar Council licence number', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await firmApi.addMember({
        lawyerEmail: newMember.lawyerEmail ? newMember.lawyerEmail.trim() : undefined,
        enrolmentNo: newMember.enrolmentNo ? newMember.enrolmentNo.trim() : undefined,
        designation: newMember.designation
      });

      showToast('Advocate successfully added to your chamber roster', 'success');
      setIsModalOpen(false);
      setNewMember({
        lawyerEmail: '',
        enrolmentNo: '',
        designation: 'Associate Advocate'
      });
      setSearchKeyword('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to add advocate to chamber', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to remove "${member.name}" from your chamber roster?\nAny active case files assigned to them will be unassigned.`
    );
    if (!isConfirmed) return;

    try {
      await firmApi.removeMember(member.id);
      showToast('Associate advocate removed from chamber roster', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  return (
    <div className="firm-team-page">
      <PageHeader
        title="Chamber Associates & Team Roster"
        subtitle="Manage practicing advocates, associates, and case delegation across your legal firm."
        badge={<span className="firm-designation-badge">Chamber Management</span>}
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <BriefcaseIcon size={16} />
            <span>Add Chamber Associate</span>
          </button>
        }
      />

      {/* Aggregate Metrics Ribbon */}
      <div className="firm-team-metrics">
        <div className="firm-metric-card">
          <span className="firm-metric-label">Total Associates</span>
          <span className="firm-metric-value">{stats?.totalAssociates ?? members.length}</span>
          <span className="firm-metric-subtext">Registered in chamber</span>
        </div>
        <div className="firm-metric-card">
          <span className="firm-metric-label">Active Roster</span>
          <span className="firm-metric-value">{stats?.activeAssociates ?? members.filter((m) => m.status === 'active').length}</span>
          <span className="firm-metric-subtext">Eligible for case assignment</span>
        </div>
        <div className="firm-metric-card">
          <span className="firm-metric-label">Delegated Cases</span>
          <span className="firm-metric-value">{stats?.assignedCases ?? 0}</span>
          <span className="firm-metric-subtext">Assigned across team</span>
        </div>
        <div className="firm-metric-card">
          <span className="firm-metric-label">Pending Hearings</span>
          <span className="firm-metric-value">{stats?.upcomingHearings ?? 0}</span>
          <span className="firm-metric-subtext">Firm-wide court schedule</span>
        </div>
      </div>

      {/* Associates List */}
      <div className="firm-table-container">
        <div className="firm-table-header">
          <h3 className="firm-table-title">Chamber Legal Counsel &amp; Partners</h3>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {members.length} {members.length === 1 ? 'Counsel' : 'Counsel Members'} Enrolled
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
            <span className="spinner" />
            <p style={{ marginTop: 'var(--spacing-2)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Loading chamber roster...
            </p>
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIcon size={44} color="var(--color-primary)" />}
            title="No Associate Advocates on Roster"
            description="Add junior counsel, partners, and associates to your chamber to delegate court hearings and case files."
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                Add Your First Associate
              </button>
            }
          />
        ) : (
          <div className="firm-table-scroll">
            <table className="firm-table">
              <thead>
                <tr>
                  <th>Advocate Name</th>
                  <th>Designation</th>
                  <th>Bar Council &amp; Licence</th>
                  <th>Court Level</th>
                  <th>Station</th>
                  <th>Assigned Cases</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--color-text)' }}>{m.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{m.email}</span>
                    </td>
                    <td>
                      <span className="firm-designation-badge">{m.designation}</span>
                    </td>
                    <td>
                      <div>{m.barCouncil}</div>
                      <code style={{ fontSize: '11px' }}>{m.enrolmentNo}</code>
                    </td>
                    <td>{m.courtLevel}</td>
                    <td>{m.city}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: m.activeCasesCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)'
                        }}
                      >
                        {m.activeCasesCount} Active {m.activeCasesCount === 1 ? 'Case' : 'Cases'}
                      </span>
                    </td>
                    <td>
                      <span className={m.status === 'active' ? 'firm-status-badge--active' : 'firm-status-badge--inactive'}>
                        <CheckIcon size={12} />
                        {m.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRemoveMember(m)}
                        title="Remove advocate from chamber"
                        style={{
                          borderColor: '#fecaca',
                          color: '#dc2626',
                          backgroundColor: '#fff1f2',
                          padding: '4px 8px',
                          fontSize: '11px'
                        }}
                      >
                        <TrashIcon size={12} color="#dc2626" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Chamber Associate Modal */}
      {isModalOpen && (
        <div className="firm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="firm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="firm-modal__header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldIcon size={20} color="var(--color-primary)" />
                Add Chamber Associate Advocate
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                aria-label="Close"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit}>
              <div className="firm-modal__body">
                {/* Search Registered Advocates */}
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 4 }}>
                    Quick Search Practicing Advocates:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by advocate name or email..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    {searching && (
                      <span
                        className="spinner"
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '10px',
                          width: '14px',
                          height: '14px'
                        }}
                      />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="firm-search-results">
                      {searchResults.map((lawyer) => (
                        <div
                          key={lawyer.id}
                          className="firm-search-item"
                          onClick={() => handleSelectLawyer(lawyer)}
                        >
                          <strong>{lawyer.name}</strong> ({lawyer.email})
                          <div style={{ color: '#64748b', fontSize: '11px' }}>
                            {lawyer.barCouncil} • {lawyer.courtLevel} • Licence: {lawyer.enrolmentNo}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 4 }}>
                    Advocate Registered Email: <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. advocate.tariq@example.com"
                    value={newMember.lawyerEmail}
                    onChange={(e) => setNewMember({ ...newMember, lawyerEmail: e.target.value })}
                  />
                </div>

                {/* Bar Council Enrolment No */}
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 4 }}>
                    Or Bar Council Enrolment Number:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. PBC-18492"
                    value={newMember.enrolmentNo}
                    onChange={(e) => setNewMember({ ...newMember, enrolmentNo: e.target.value })}
                  />
                </div>

                {/* Designation */}
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 4 }}>
                    Chamber Designation:
                  </label>
                  <select
                    className="form-control"
                    value={newMember.designation}
                    onChange={(e) => setNewMember({ ...newMember, designation: e.target.value })}
                  >
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="firm-modal__footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add to Chamber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirmTeam;
