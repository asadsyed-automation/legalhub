const path = require('path');
const { DOCUMENT_LIMITS } = require('../constants/case');
const AppError = require('./AppError');

/**
 * Checks if buffer starts with a specific byte sequence.
 *
 * @param {Buffer} buffer
 * @param {number[]} bytes
 * @returns {boolean}
 */
const matchesBytes = (buffer, bytes) => {
  if (!buffer || buffer.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[i] !== bytes[i]) return false;
  }
  return true;
};

/**
 * Detects file type from leading magic bytes.
 *
 * @param {Buffer} buffer
 * @returns {{ mimeType: string, extension: string } | null}
 */
const detectSignature = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) {
    return null;
  }

  // 1. PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (matchesBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2D])) {
    return {
      mimeType: 'application/pdf',
      extension: '.pdf'
    };
  }

  // 2. JPEG: 0xFF, 0xD8, 0xFF
  if (matchesBytes(buffer, [0xFF, 0xD8, 0xFF])) {
    return {
      mimeType: 'image/jpeg',
      extension: '.jpeg'
    };
  }

  // 3. PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (matchesBytes(buffer, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
    return {
      mimeType: 'image/png',
      extension: '.png'
    };
  }

  // 4. DOC (OLE Compound File): 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1
  if (matchesBytes(buffer, [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) {
    return {
      mimeType: 'application/msword',
      extension: '.doc'
    };
  }

  // 5. DOCX (PK ZIP archive containing Office XML): 0x50, 0x4B, 0x03, 0x04
  if (matchesBytes(buffer, [0x50, 0x4B, 0x03, 0x04])) {
    return {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: '.docx'
    };
  }

  return null;
};

/**
 * Validates that an uploaded file buffer is within limits and has authentic magic bytes
 * matching one of the approved document types.
 *
 * @param {Buffer} buffer
 * @param {string} declaredMimeType
 * @param {string} originalName
 * @returns {{ mimeType: string, extension: string }}
 */
const validateFileSignature = (buffer, declaredMimeType, originalName) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError('File content is empty or invalid', 400);
  }

  if (buffer.length > DOCUMENT_LIMITS.MAX_FILE_SIZE_BYTES) {
    throw new AppError('File size exceeds 10 MB limit', 400);
  }

  const detected = detectSignature(buffer);
  if (!detected) {
    throw new AppError(
      'Unsupported file format or invalid file signature. Allowed: PDF, JPEG, PNG, DOC, DOCX',
      400
    );
  }

  const ext = path.extname(originalName || '').toLowerCase();
  if (!DOCUMENT_LIMITS.ALLOWED_EXTENSIONS.includes(ext)) {
    throw new AppError(
      `File extension "${ext}" is not permitted. Allowed: ${DOCUMENT_LIMITS.ALLOWED_EXTENSIONS.join(', ')}`,
      400
    );
  }

  // Verify extension matches detected signature
  const isImageMatch = (ext === '.jpg' || ext === '.jpeg') && detected.mimeType === 'image/jpeg';
  const isDocMatch = ext === detected.extension;

  if (!isImageMatch && !isDocMatch) {
    throw new AppError(
      `File extension "${ext}" does not match the actual file signature content (${detected.mimeType})`,
      400
    );
  }

  return detected;
};

module.exports = {
  detectSignature,
  validateFileSignature
};
