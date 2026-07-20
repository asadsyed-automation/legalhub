const { createGig, getGigsForProfile } = require('./gig.service');

async function create(req, res) {
  try {
    const gig = await createGig({
      lawyerId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
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

module.exports = { create, getForProfile };