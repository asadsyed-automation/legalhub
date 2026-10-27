const {
  Case,
  CaseEntry,
  Hearing,
  Document,
  CaseStatusEvent
} = require('../../models');
const { ROLES } = require('../../constants');
const AppError = require('../../utils/AppError');

/**
 * Merges case entries, hearings, documents, and status events into a unified chronological timeline.
 * Role-aware:
 * - Advocate: sees all items (both private and shared), with hearing private notes.
 * - Client: sees ONLY shared items (status events are always shared). For hearings, sees date, court,
 *   stage, outcome, and clientExplanation, but NEVER the private note.
 * - Admin or unlinked user: 403 Forbidden.
 *
 * @param {string} caseId - UUID of the case
 * @param {object} user - Authenticated user
 * @param {object} [query={}] - Query params (page, limit, kind)
 * @returns {Promise<{ items: object[], total: number, page: number, limit: number, totalPages: number }>}
 */
const getCaseTimeline = async (caseId, user, query = {}) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError(
      'Forbidden: Administrators have no access to confidential case timelines',
      403
    );
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (user.role === ROLES.LAWYER && caseRecord.lawyerId !== user.id) {
    throw new AppError(
      'Forbidden: You cannot access the timeline for a case belonging to another chamber',
      403
    );
  }

  if (user.role === ROLES.CLIENT && caseRecord.clientId !== user.id) {
    throw new AppError(
      'Forbidden: You cannot access the timeline for a case not linked to your account',
      403
    );
  }

  const isClient = user.role === ROLES.CLIENT;
  const sharedFilter = isClient ? { visibility: 'shared' } : {};

  // Fetch all 4 streams in parallel
  const [rawEntries, rawHearings, rawDocs, rawEvents] = await Promise.all([
    CaseEntry.findAll({ where: { caseId, ...sharedFilter } }),
    Hearing.findAll({ where: { caseId, ...sharedFilter } }),
    Document.findAll({ where: { caseId, ...sharedFilter } }),
    CaseStatusEvent.findAll({ where: { caseId } }) // Status events are always shared
  ]);

  // Normalize entries
  const entries = rawEntries.map((e) => ({
    kind: 'entry',
    date: e.entryDate
      ? new Date(`${e.entryDate}T00:00:00.000Z`).toISOString()
      : new Date(e.createdAt).toISOString(),
    title: e.title,
    summary: e.body,
    visibility: e.visibility,
    refId: e.id
  }));

  // Normalize hearings (strictly suppress private notes for client)
  const hearings = rawHearings.map((h) => {
    const outcomeText = h.outcome || 'Hearing scheduled';
    const explanationText = h.clientExplanation ? ` - ${h.clientExplanation}` : '';
    const noteText = !isClient && h.note ? ` [Note: ${h.note}]` : '';

    return {
      kind: 'hearing',
      date: new Date(h.scheduledAt).toISOString(),
      title: h.stage ? `Hearing: ${h.stage} (${h.court})` : `Hearing at ${h.court}`,
      summary: `${outcomeText}${explanationText}${noteText}`,
      visibility: h.visibility,
      refId: h.id,
      court: h.court,
      stage: h.stage || null,
      outcome: h.outcome || null,
      clientExplanation: h.clientExplanation || null,
      ...(!isClient ? { note: h.note || null } : {})
    };
  });

  // Normalize documents (upload events)
  const docs = rawDocs.map((d) => ({
    kind: 'document',
    date: new Date(d.createdAt).toISOString(),
    title: `Uploaded: ${d.originalName}`,
    summary: `${d.docType} (${d.mimeType})`,
    visibility: d.visibility,
    refId: d.id
  }));

  // Normalize case status events (always shared)
  const events = rawEvents.map((ev) => ({
    kind: 'status_change',
    date: new Date(ev.createdAt).toISOString(),
    title: `Status changed to ${ev.toStatus}`,
    summary: `Case status changed from ${ev.fromStatus || 'Initial'} to ${ev.toStatus}${
      ev.toStage ? ` (Stage: ${ev.toStage})` : ''
    }`,
    visibility: 'shared',
    refId: ev.id
  }));

  let merged = [...entries, ...hearings, ...docs, ...events];

  if (query.kind) {
    merged = merged.filter((item) => item.kind === query.kind);
  }

  // Sort newest first
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Paginate
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const paginated = merged.slice(offset, offset + limit);
  const total = merged.length;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items: paginated,
    total,
    page,
    limit,
    totalPages
  };
};

module.exports = {
  getCaseTimeline
};
