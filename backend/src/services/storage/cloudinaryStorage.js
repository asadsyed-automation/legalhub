const { Readable } = require('stream');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const cloudinary = require('cloudinary').v2;
const config = require('../../config/env');
const AppError = require('../../utils/AppError');

// Configure Cloudinary if credentials are provided
if (config.cloudinary && config.cloudinary.cloudName && config.cloudinary.cloudName !== 'demo_cloud') {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

// In-memory buffer store for deterministic offline tests & fallback
const memoryStore = new Map();

/**
 * Uploads a buffer to private storage.
 * In test environment or when Cloudinary is not configured, uses memory store.
 *
 * @param {object} params
 * @param {Buffer} params.buffer
 * @param {string} params.originalName
 * @param {string} params.mimeType
 * @param {string} [params.folder]
 * @returns {Promise<{ publicId: string, resourceType: string, sizeBytes: number }>}
 */
const uploadFile = async ({ buffer, originalName, mimeType, folder = 'legalhub/documents' }) => {
  const isImage = mimeType.startsWith('image/');
  const resourceType = isImage ? 'image' : 'raw';

  // In test environment or unconfigured Cloudinary, use mock storage
  if (config.env === 'test' || config.cloudinary.cloudName === 'demo_cloud' || !config.cloudinary.apiKey) {
    const publicId = `test_${crypto.randomUUID()}`;
    memoryStore.set(publicId, {
      buffer,
      mimeType,
      originalName,
      sizeBytes: buffer.length
    });
    return {
      publicId,
      resourceType,
      sizeBytes: buffer.length
    };
  }

  // Production Cloudinary authenticated upload
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: 'authenticated', // NEVER public; strictly authenticated
        use_filename: false,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          return reject(new AppError(`Cloudinary upload failed: ${error.message}`, 502));
        }
        resolve({
          publicId: result.public_id,
          resourceType: result.resource_type || resourceType,
          sizeBytes: result.bytes || buffer.length
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Retrieves a readable stream for an authenticated file.
 *
 * @param {string} publicId
 * @param {string} [resourceType='raw']
 * @returns {Promise<import('stream').Readable>}
 */
const getFileStream = async (publicId, resourceType = 'raw') => {
  // Check in-memory store first (for test mode)
  if (memoryStore.has(publicId)) {
    const item = memoryStore.get(publicId);
    return Readable.from(item.buffer);
  }

  if (config.env === 'test' || config.cloudinary.cloudName === 'demo_cloud') {
    throw new AppError('File not found in storage', 404);
  }

  // Generate authenticated private download URL
  const format = resourceType === 'raw' ? '' : undefined;
  const privateUrl = cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 300 // 5 minutes expiration
  });

  return new Promise((resolve, reject) => {
    const client = privateUrl.startsWith('https') ? https : http;
    client.get(privateUrl, (res) => {
      if (res.statusCode >= 400) {
        return reject(new AppError(`Storage fetch failed with status ${res.statusCode}`, 502));
      }
      resolve(res);
    }).on('error', (err) => {
      reject(new AppError(`Storage connection error: ${err.message}`, 502));
    });
  });
};

/**
 * Deletes an authenticated asset.
 *
 * @param {string} publicId
 * @param {string} [resourceType='raw']
 * @returns {Promise<void>}
 */
const deleteFile = async (publicId, resourceType = 'raw') => {
  if (memoryStore.has(publicId)) {
    memoryStore.delete(publicId);
    return;
  }

  if (config.env === 'test' || config.cloudinary.cloudName === 'demo_cloud') {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: 'authenticated'
  });
};

module.exports = {
  uploadFile,
  getFileStream,
  deleteFile,
  memoryStore
};
