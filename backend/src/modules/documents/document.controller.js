const { uploadDocument, getDocumentsForCase } = require('./document.service');
const cloudinary = require('../../config/cloudinary');

async function create(req, res) {
  try {
    if (!req.file) throw new Error('No file uploaded');

    // Upload buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'legalhub-documents' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const doc = await uploadDocument({
      caseId: req.body.case_id,
      uploadedBy: req.user.id,
      fileUrl: uploadResult.secure_url,
      isShared: req.body.is_shared_with_client === 'true',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getForCase(req, res) {
  try {
    const docs = await getDocumentsForCase({ caseId: req.params.caseId, userId: req.user.id, role: req.user.role });
    res.json(docs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getForCase };