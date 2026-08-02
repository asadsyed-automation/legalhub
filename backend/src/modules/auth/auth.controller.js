const { registerUser, loginUser, googleAuthUser, setUserRole } = require('./auth.service');

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

async function googleAuth(req, res) {
  try {
    const result = await googleAuthUser({ idToken: req.body.idToken || req.body.token });
    if (result.needsRole) {
      return res.json({
        needsRole: true,
        tempToken: result.tempToken,
        user: result.user,
      });
    }
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: { id: result.user.id, name: result.user.name, role: result.user.role },
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

async function setRole(req, res) {
  try {
    const { role } = req.body;
    const { user, accessToken, refreshToken } = await setUserRole({
      userId: req.user.id,
      role,
    });
    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { register, login, googleAuth, setRole };