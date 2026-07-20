const Subscription = require('./subscription.model');

async function createSubscription({ userId, planType }) {
  return await Subscription.create({
    user_id: userId,
    plan_type: planType,
    status: 'Active',
    start_date: new Date(),
    end_date: null, // will be set once real billing cycles are added later
  });
}

async function getSubscriptionForUser(userId) {
  const sub = await Subscription.findOne({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
  });
  if (!sub) throw new Error('No subscription found');
  return sub;
}

module.exports = { createSubscription, getSubscriptionForUser };