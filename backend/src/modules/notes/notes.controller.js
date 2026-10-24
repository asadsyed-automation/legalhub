const notesService = require('./notes.service');

const getNotes = async (req, res, next) => {
  try {
    const note = await notesService.getNotes(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Consultation notes retrieved successfully',
      data: note
    });
  } catch (error) {
    next(error);
  }
};

const upsertNotes = async (req, res, next) => {
  try {
    const note = await notesService.upsertNotes(req.params.id, req.user, req.body);
    res.status(200).json({
      success: true,
      message: 'Consultation notes saved successfully',
      data: note
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  upsertNotes
};
