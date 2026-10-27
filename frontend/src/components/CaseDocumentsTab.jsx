import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import caseApi from '../api/case.api';
import EmptyState from './EmptyState';
import {
  DocumentIcon,
  PlusIcon,
  CloseIcon,
  SearchIcon,
  ShieldIcon,
} from './Icons';
import {
  DOCUMENT_TYPES,
  DOCUMENT_LIMITS,
} from '../constants';
import './CaseDocumentsTab.css';

export const CaseDocumentsTab = ({ caseId, isLawyer }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Upload Form State (Advocate Only)
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDocType, setUploadDocType] = useState(DOCUMENT_TYPES[0] || 'Evidence');
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [tagInput, setTagInput] = useState('');
  const [uploadTags, setUploadTags] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const fileInputRef = useRef(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (docTypeFilter) params.docType = docTypeFilter;
      if (visibilityFilter) params.visibility = visibilityFilter;
      if (tagFilter.trim()) params.tag = tagFilter.trim();

      const res = await caseApi.getDocuments(caseId, params);
      const list = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.documents)
        ? res.documents
        : [];
      setDocuments(list);
    } catch (err) {
      setError(err.message || 'Failed to retrieve case documents.');
    } finally {
      setLoading(false);
    }
  }, [caseId, docTypeFilter, visibilityFilter, tagFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // File size formatter
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  // Upload handlers
  const handleFileChange = (e) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > DOCUMENT_LIMITS.MAX_FILE_SIZE_BYTES) {
      setUploadError(`File exceeds maximum allowed limit of 10 MB (Selected: ${formatFileSize(file.size)}).`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (clean.length > DOCUMENT_LIMITS.MAX_TAG_LENGTH) {
      setUploadError(`Tag cannot exceed ${DOCUMENT_LIMITS.MAX_TAG_LENGTH} characters.`);
      return;
    }
    if (uploadTags.length >= DOCUMENT_LIMITS.MAX_TAGS) {
      setUploadError(`Maximum ${DOCUMENT_LIMITS.MAX_TAGS} tags allowed per document.`);
      return;
    }
    if (!uploadTags.includes(clean)) {
      setUploadTags((prev) => [...prev, clean]);
    }
    setTagInput('');
    setUploadError(null);
  };

  const handleRemoveTag = (index) => {
    setUploadTags((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedFile) {
      setUploadError('Please select a document file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('docType', uploadDocType);
    formData.append('visibility', uploadVisibility);
    formData.append('tags', JSON.stringify(uploadTags));

    setUploading(true);
    try {
      await caseApi.uploadDocument(caseId, formData);
      setUploadSuccess(`"${selectedFile.name}" successfully uploaded and verified.`);
      setSelectedFile(null);
      setUploadTags([]);
      setTagInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocuments();
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Ensure file is an allowed format and passes binary signature verification.');
    } finally {
      setUploading(false);
    }
  };

  // Visibility toggle handler
  const handleToggleVisibility = async (doc) => {
    const nextVisibility = doc.visibility === 'shared' ? 'private' : 'shared';
    try {
      await caseApi.updateDocument(doc.id, { visibility: nextVisibility });
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to update document visibility.');
    }
  };

  // Preview & Download handlers
  const isPreviewable = (doc) => {
    if (!doc) return false;
    const mime = (doc.mimeType || '').toLowerCase();
    const name = (doc.originalName || '').toLowerCase();
    return (
      mime === 'application/pdf' ||
      mime.startsWith('image/') ||
      name.endsWith('.pdf') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg')
    );
  };

  const handlePreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewBlobUrl(null);
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const res = await caseApi.fetchDocumentBlob(doc.id);
      // If response interceptor returned axios data directly, res is the blob
      const blob = res instanceof Blob ? res : new Blob([res], { type: doc.mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (err) {
      setPreviewError(err.message || 'Failed to stream document preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewDoc(null);
    setPreviewBlobUrl(null);
    setPreviewError(null);
  };

  const handleDirectDownload = async (doc) => {
    try {
      const res = await caseApi.fetchDocumentBlob(doc.id);
      const blob = res instanceof Blob ? res : new Blob([res], { type: doc.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download document file.');
    }
  };

  return (
    <div className="docs-tab">
      {/* Upfront Security Notice Banner */}
      <div className="docs-notice-banner">
        <ShieldIcon size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Confidential Case File Asset Storage (Bar Council Verified):</strong>
          <p style={{ margin: '4px 0 0 0' }}>
            Supported Formats: <strong>PDF, JPEG, PNG, DOC, DOCX</strong> | Max Size: <strong>10 MB</strong>.
            All uploads undergo binary magic-byte verification. Files are stored securely and streamed via authenticated proxy.
            Public asset URLs are never exposed.
          </p>
        </div>
      </div>

      {/* Upload Section (Advocate Only) */}
      {isLawyer && (
        <div className="docs-upload-panel">
          <h2 className="docs-upload-panel__title">
            <PlusIcon size={16} />
            <span>Upload Document to Case Brief</span>
          </h2>

          {uploadSuccess && (
            <div
              style={{
                backgroundColor: 'var(--color-success-light, #dcfce7)',
                border: '1px solid var(--color-success, #22c55e)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-2) var(--spacing-3)',
                color: 'var(--color-success-dark, #15803d)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {uploadSuccess}
            </div>
          )}

          {uploadError && (
            <div
              style={{
                backgroundColor: 'var(--color-danger-light, #fee2e2)',
                border: '1px solid var(--color-danger, #ef4444)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-2) var(--spacing-3)',
                color: 'var(--color-danger-dark, #991b1b)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUploadSubmit}>
            <div className="docs-upload-grid">
              {/* File Dropzone */}
              <div
                className="docs-file-picker"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fileInputRef.current?.click();
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={DOCUMENT_LIMITS.ALLOWED_ACCEPT}
                  onChange={handleFileChange}
                />
                <DocumentIcon size={28} color="var(--color-primary)" />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  {selectedFile ? 'Change Selected File' : 'Click to Browse File'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                  PDF, JPEG, PNG, DOCX up to 10 MB
                </span>
                {selectedFile && (
                  <span className="docs-file-picker__selected">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>

              {/* Metadata Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <div className="new-case-field">
                  <label htmlFor="upload-doc-type">Document Classification *</label>
                  <select
                    id="upload-doc-type"
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags input */}
                <div className="new-case-field">
                  <label htmlFor="upload-tag-input">Document Tags (Max 5)</label>
                  <div className="docs-tag-input-row">
                    <input
                      id="upload-tag-input"
                      type="text"
                      placeholder="e.g. Injunction, Revenue"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      maxLength={DOCUMENT_LIMITS.MAX_TAG_LENGTH}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddTag}
                      disabled={uploadTags.length >= DOCUMENT_LIMITS.MAX_TAGS || !tagInput.trim()}
                    >
                      Add
                    </button>
                  </div>

                  {uploadTags.length > 0 && (
                    <div className="docs-tags-pills">
                      {uploadTags.map((tag, idx) => (
                        <span key={idx} className="docs-tag-pill">
                          #{tag}
                          <button
                            type="button"
                            className="docs-tag-pill__remove"
                            onClick={() => handleRemoveTag(idx)}
                            aria-label={`Remove tag ${tag}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visibility Toggle */}
                <div className="new-case-field">
                  <label>Client Visibility</label>
                  <div className="entry-visibility-group">
                    <label
                      className={`entry-visibility-option ${
                        uploadVisibility === 'private' ? 'entry-visibility-option--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="doc-visibility"
                        value="private"
                        checked={uploadVisibility === 'private'}
                        onChange={() => setUploadVisibility('private')}
                      />
                      <div>
                        <strong>Private (Chamber Only)</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Internal litigation draft or notes.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`entry-visibility-option ${
                        uploadVisibility === 'shared' ? 'entry-visibility-option--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="doc-visibility"
                        value="shared"
                        checked={uploadVisibility === 'shared'}
                        onChange={() => setUploadVisibility('shared')}
                      />
                      <div>
                        <strong>Shared with Client</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Available on the client portal.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading || !selectedFile}
                  style={{ marginTop: 'auto' }}
                >
                  {uploading ? 'Verifying & Uploading...' : 'Upload Document'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="docs-filters-bar">
        <div className="docs-filters-group">
          <select
            className="entries-tab__filter-select"
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            aria-label="Filter by document type"
          >
            <option value="">All Document Types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {isLawyer && (
            <select
              className="entries-tab__filter-select"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              aria-label="Filter by visibility"
            >
              <option value="">All Visibility</option>
              <option value="private">Private (Chamber Only)</option>
              <option value="shared">Shared with Client</option>
            </select>
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
            <input
              type="text"
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              style={{
                padding: 'var(--spacing-2) var(--spacing-3) var(--spacing-2) 28px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--color-surface)',
              }}
            />
            <SearchIcon
              size={14}
              color="var(--color-text-subtle)"
              style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }}
            />
          </div>
        </div>

        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Total: <strong>{documents.length}</strong> document(s)
        </span>
      </div>

      {/* Error state */}
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchDocuments}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: 'var(--color-text-muted)' }}>
          Loading case documents...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && documents.length === 0 && (
        <EmptyState
          icon={<DocumentIcon size={40} />}
          title={isLawyer ? 'No documents uploaded' : 'No shared documents'}
          message={
            isLawyer
              ? 'Upload pleadings, interim court orders, or evidentiary documents to build a complete case record.'
              : 'Your advocate has not shared any documents for this case yet. Court orders and petitions will appear here once shared.'
          }
        />
      )}

      {/* Documents Grid */}
      {!loading && !error && documents.length > 0 && (
        <div className="docs-grid">
          {documents.map((doc) => {
            const previewable = isPreviewable(doc);
            const isWord =
              doc.mimeType?.includes('word') ||
              doc.originalName?.endsWith('.doc') ||
              doc.originalName?.endsWith('.docx');

            return (
              <div key={doc.id} className="doc-card">
                <div className="doc-card__header">
                  <div className="doc-card__title-row">
                    <DocumentIcon size={18} color="var(--color-primary)" />
                    <h3 className="doc-card__name" title={doc.originalName}>
                      {doc.originalName}
                    </h3>
                  </div>

                  <span className="case-banner__pill" style={{ fontWeight: 'bold' }}>
                    {doc.docType}
                  </span>
                </div>

                <div className="doc-card__meta">
                  <span>Size: {formatFileSize(doc.sizeBytes)}</span>
                  <span>Uploaded: {formatDate(doc.createdAt)}</span>
                </div>

                {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                  <div className="doc-card__tags">
                    {doc.tags.map((t, tIdx) => (
                      <span key={tIdx} className="docs-tag-pill">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="doc-card__actions">
                  <div>
                    {isLawyer ? (
                      <button
                        type="button"
                        className={`entry-visibility-pill entry-visibility-pill--${doc.visibility}`}
                        onClick={() => handleToggleVisibility(doc)}
                        title="Click to toggle client visibility"
                        style={{ cursor: 'pointer', border: '1px solid currentColor' }}
                      >
                        {doc.visibility === 'shared' ? 'Shared with Client' : 'Private (Chamber Only)'}
                      </button>
                    ) : (
                      <span className="entry-visibility-pill entry-visibility-pill--shared">
                        Shared Document
                      </span>
                    )}
                  </div>

                  <div className="doc-card__btn-group">
                    {previewable && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePreview(doc)}
                      >
                        Preview
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDirectDownload(doc)}
                      title={isWord ? 'Word documents download directly' : 'Download copy'}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IN-PAGE PREVIEW MODAL (Streamed In-Memory Blob) */}
      {previewDoc && (
        <div className="entry-modal-overlay" role="dialog" aria-modal="true">
          <div className="doc-preview-modal">
            <div className="entry-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', minWidth: 0 }}>
                <DocumentIcon size={18} color="var(--color-primary)" />
                <h2 style={{ fontSize: 'var(--font-size-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {previewDoc.originalName}
                </h2>
                <span className="case-banner__pill">{previewDoc.docType}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDirectDownload(previewDoc)}
                >
                  Download File
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClosePreview}
                  aria-label="Close document preview"
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  <CloseIcon size={20} />
                </button>
              </div>
            </div>

            <div className="doc-preview-modal__body">
              {previewLoading && (
                <div style={{ color: '#ffffff', textAlign: 'center' }}>
                  Streaming encrypted document binary from chamber vault...
                </div>
              )}

              {previewError && (
                <div style={{ color: '#fca5a5', textAlign: 'center', padding: 'var(--spacing-4)' }}>
                  {previewError}
                </div>
              )}

              {!previewLoading && !previewError && previewBlobUrl && (
                <>
                  {previewDoc.mimeType === 'application/pdf' || previewDoc.originalName?.endsWith('.pdf') ? (
                    <iframe
                      src={previewBlobUrl}
                      title={previewDoc.originalName}
                    />
                  ) : (
                    <img
                      src={previewBlobUrl}
                      alt={previewDoc.originalName}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CaseDocumentsTab.propTypes = {
  caseId: PropTypes.string.isRequired,
  isLawyer: PropTypes.bool.isRequired,
};

export default CaseDocumentsTab;
