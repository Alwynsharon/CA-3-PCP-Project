const express = require('express');
const mongoose = require('mongoose');
const AccessMapping = require('../models/AccessMapping');
const Dataset = require('../models/Dataset');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

// LIST all access mappings (ADMIN view)
router.get('/', async (_req, res) => {
  const mappings = await AccessMapping.find()
    .sort({ createdAt: -1 })
    .populate('user', 'name email role')
    .populate('dataset', 'name category')
    .populate('grantedBy', 'name email');
  res.json({ mappings });
});

// ASSIGN dataset to user
router.post('/', async (req, res) => {
  const { userId, datasetId } = req.body || {};
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(datasetId)) {
    return res.status(400).json({ message: 'Valid userId and datasetId are required' });
  }

  const [user, dataset] = await Promise.all([User.findById(userId), Dataset.findById(datasetId)]);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  try {
    const mapping = await AccessMapping.create({
      user: user._id,
      dataset: dataset._id,
      grantedBy: req.user._id,
    });
    const populated = await mapping.populate([
      { path: 'user', select: 'name email role' },
      { path: 'dataset', select: 'name category' },
      { path: 'grantedBy', select: 'name email' },
    ]);
    res.status(201).json({ mapping: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Access already granted' });
    }
    throw err;
  }
});

// REVOKE by mapping id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid mapping id' });
  const removed = await AccessMapping.findByIdAndDelete(id);
  if (!removed) return res.status(404).json({ message: 'Mapping not found' });
  res.json({ message: 'Access revoked' });
});

// REVOKE by user + dataset
router.delete('/', async (req, res) => {
  const { userId, datasetId } = req.body || {};
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(datasetId)) {
    return res.status(400).json({ message: 'Valid userId and datasetId are required' });
  }
  const removed = await AccessMapping.findOneAndDelete({ user: userId, dataset: datasetId });
  if (!removed) return res.status(404).json({ message: 'Mapping not found' });
  res.json({ message: 'Access revoked' });
});

module.exports = router;
