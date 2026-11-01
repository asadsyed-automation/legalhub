import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/admin.api';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { UsersIcon } from '../components/Icons';
import './AdminUsers.css';

export const AdminUsers = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal dialog states
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isReinstateOpen, setIsReinstateOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Debounce search input by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch users with current query parameters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      page: pagination.page,
      limit: pagination.limit,
    };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (roleFilter !== 'all') params.role = roleFilter;
    if (statusFilter !== 'all') params.status = statusFilter;

    try {
      const response = await adminApi.getUsers(params);
      const userList = response?.users || response?.data?.users || [];
      const pageMeta = response?.pagination || response?.data?.pagination || {
        page: 1,
        limit: 10,
        total: userList.length,
        totalPages: 1,
      };

      setUsers(Array.isArray(userList) ? userList : []);
      setPagination(pageMeta);
    } catch (err) {
      setError(err.message || 'Failed to retrieve user directory.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handlers for Suspend Dialog
  const handleOpenSuspend = (user) => {
    setSelectedUser(user);
    setSuspensionReason('');
    setDialogError(null);
    setIsSuspendOpen(true);
  };

  const handleConfirmSuspend = async () => {
    if (!suspensionReason || suspensionReason.trim().length < 10) {
      setDialogError('Suspension reason must be at least 10 characters long.');
      return;
    }

    setDialogLoading(true);
    setDialogError(null);

    try {
      await adminApi.updateUserStatus(selectedUser.id, {
        status: 'suspended',
        reason: suspensionReason.trim(),
      });

      setIsSuspendOpen(false);
      setFeedback(`User ${selectedUser.name || selectedUser.email} has been suspended.`);
      fetchUsers();
    } catch (err) {
      setDialogError(err.message || 'Failed to suspend user.');
    } finally {
      setDialogLoading(false);
    }
  };

  // Handlers for Reinstate Dialog
  const handleOpenReinstate = (user) => {
    setSelectedUser(user);
    setDialogError(null);
    setIsReinstateOpen(true);
  };

  const handleConfirmReinstate = async () => {
    setDialogLoading(true);
    setDialogError(null);

    try {
      await adminApi.updateUserStatus(selectedUser.id, {
        status: 'active',
      });

      setIsReinstateOpen(false);
      setFeedback(`User ${selectedUser.name || selectedUser.email} has been reinstated.`);
      fetchUsers();
    } catch (err) {
      setDialogError(err.message || 'Failed to reinstate user.');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="page-container admin-users-page">
      <PageHeader
        title="User Management & Discipline"
        subtitle="Search, audit, and regulate user accounts and advocate roster credentials"
      />

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-4)' }}>
          <strong>Notice:</strong> <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ float: 'right', fontWeight: 'bold' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-4)' }}>
          <strong>Error:</strong> <span>{error}</span>
          <button
            type="button"
            onClick={fetchUsers}
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'var(--spacing-3)' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="admin-users-controls card">
        <div className="admin-users-search">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users by name or email"
            />
          </div>
        </div>

        <div className="admin-users-filters">
          <label htmlFor="role-select" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            Role:
          </label>
          <select
            id="role-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="all">All Roles</option>
            <option value="client">Clients</option>
            <option value="lawyer">Advocates</option>
            <option value="law_firm">Law Firms</option>
            <option value="admin">Administrators</option>
          </select>

          <label htmlFor="status-select" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            Status:
          </label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Users Table / List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <span className="spinner" />
          <p style={{ marginTop: 'var(--spacing-3)' }}>Loading user directory...</p>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No Users Found"
          description="No registered user matches your current search criteria or filter configuration."
          actionText="Clear Search & Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <>
          <div className="admin-users-table-container">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentAdmin = u.id === currentUser?.id;
                  const isSuspended = u.isActive === false;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{u.name || 'Unnamed'}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                          {u.email}
                        </div>
                        {isSuspended && u.suspensionReason && (
                          <div
                            style={{
                              marginTop: 'var(--spacing-1)',
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-danger)',
                            }}
                          >
                            <strong>Reason:</strong> {u.suspensionReason}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusChip status={u.role} />
                      </td>
                      <td>
                        <StatusChip status={isSuspended ? 'suspended' : 'active'} />
                      </td>
                      <td>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        {isCurrentAdmin ? (
                          <span
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            Current Session
                          </span>
                        ) : isSuspended ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenReinstate(u)}
                          >
                            Reinstate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleOpenSuspend(u)}
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="admin-users-pagination">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total users)
            </div>
            <div className="admin-users-pagination__btns">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSuspendOpen}
        title="Suspend User Account"
        isDanger={true}
        confirmText="Confirm Suspension"
        cancelText="Cancel"
        isLoading={dialogLoading}
        onConfirm={handleConfirmSuspend}
        onCancel={() => {
          if (!dialogLoading) setIsSuspendOpen(false);
        }}
        message={
          <div>
            <p style={{ marginBottom: 'var(--spacing-3)' }}>
              Are you sure you want to suspend access for <strong>{selectedUser?.name || selectedUser?.email}</strong>?
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-3)' }}>
              Suspension immediately revokes active login sessions and blocks further access across the platform. A mandatory explanation is required for administrative audit logs.
            </p>

            {dialogError && (
              <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-3)' }}>
                <span>{dialogError}</span>
              </div>
            )}

            <div className="suspend-reason-box">
              <label
                htmlFor="suspensionReasonInput"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 'var(--spacing-1)',
                }}
              >
                Administrative Reason (minimum 10 characters):
              </label>
              <textarea
                id="suspensionReasonInput"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g. Disciplinary inquiry initiated by Bar Council ethics committee..."
                autoFocus
              />
              <span
                style={{
                  display: 'block',
                  textAlign: 'right',
                  fontSize: 'var(--font-size-xs)',
                  color: suspensionReason.trim().length >= 10 ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {suspensionReason.trim().length} / 10 minimum characters
              </span>
            </div>
          </div>
        }
      />

      {/* Reinstate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isReinstateOpen}
        title="Reinstate User Account"
        isDanger={false}
        confirmText="Confirm Reinstatement"
        cancelText="Cancel"
        isLoading={dialogLoading}
        onConfirm={handleConfirmReinstate}
        onCancel={() => {
          if (!dialogLoading) setIsReinstateOpen(false);
        }}
        message={
          <div>
            <p style={{ marginBottom: 'var(--spacing-3)' }}>
              Are you sure you want to reinstate access for <strong>{selectedUser?.name || selectedUser?.email}</strong>?
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Their account will be marked active immediately, clearing any previous suspension lockout and allowing them to sign in.
            </p>
            {dialogError && (
              <div className="alert alert-danger" style={{ marginTop: 'var(--spacing-3)' }}>
                <span>{dialogError}</span>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};

export default AdminUsers;
