const { createGig, getGigsForProfile, getMyGigs, updateGig, deleteGig } = require('./gig.service');

async function create(req, res) {
  try {
    const gig = await createGig({
      lawyerId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      thumbnail_url: req.body.thumbnail_url,
    });
    res.status(201).json(gig);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getForProfile(req, res) {
  try {
    const gigs = await getGigsForProfile(req.params.profileId);
    res.json(gigs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getMine(req, res) {
  try {
    const gigs = await getMyGigs(req.user.id);
    res.json(gigs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const gig = await updateGig({
      lawyerId: req.user.id,
      gigId: req.params.id,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      thumbnail_url: req.body.thumbnail_url,
    });
    res.json(gig);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const result = await deleteGig({
      lawyerId: req.user.id,
      gigId: req.params.id,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getForProfile, getMine, update, remove };