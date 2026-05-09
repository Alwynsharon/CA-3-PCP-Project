const express = require('express');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ADMIN-only: list users (used by ADMIN UI to assign datasets)
router.get('/', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
});

module.exports = router;
