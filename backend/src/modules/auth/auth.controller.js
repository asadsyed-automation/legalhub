const { registerUser, loginUser } = require('./auth.service');

async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { user, accessToken, refreshToken } = await loginUser(req.body);
    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

module.exports = { register, login };