const { createSubscription, getSubscriptionForUser } = require('./subscription.service');

async function create(req, res) {
  try {
    const sub = await createSubscription({ userId: req.user.id, planType: req.body.plan_type });
    res.status(201).json(sub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getMine(req, res) {
  try {
    const sub = await getSubscriptionForUser(req.user.id);
    res.json(sub);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

module.exports = { create, getMine };