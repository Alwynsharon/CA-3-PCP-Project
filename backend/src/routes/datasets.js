const express = require('express');
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const AccessMapping = require('../models/AccessMapping');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// LIST
// ADMIN: all datasets
// USER: only datasets explicitly assigned to them via AccessMapping
router.get('/', async (req, res) => {
  if (req.user.role === 'ADMIN') {
    const datasets = await Dataset.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
    return res.json({ datasets });
  }

  const mappings = await AccessMapping.find({ user: req.user._id }).select('dataset');
  const datasetIds = mappings.map((m) => m.dataset);
  const datasets = await Dataset.find({ _id: { $in: datasetIds } })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
  res.json({ datasets });
});

// READ ONE — enforces business rule: USER must have an explicit mapping
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid dataset id' });

  const dataset = await Dataset.findById(id).populate('createdBy', 'name email');
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  if (req.user.role !== 'ADMIN') {
    const mapping = await AccessMapping.findOne({ user: req.user._id, dataset: dataset._id });
    if (!mapping) {
      return res.status(403).json({ message: 'Access denied: dataset is not assigned to you' });
    }
  }

  res.json({ dataset });
});

// CREATE — ADMIN only
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { name, description, category, content } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name is required' });

  const dataset = await Dataset.create({
    name: name.trim(),
    description: (description || '').trim(),
    category: (category || 'general').trim(),
    content: content || '',
    createdBy: req.user._id,
  });
  res.status(201).json({ dataset });
});

// UPDATE — ADMIN only
router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid dataset id' });

  const updates = {};
  ['name', 'description', 'category', 'content'].forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  const dataset = await Dataset.findByIdAndUpdate(id, updates, { new: true });
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
  res.json({ dataset });
});

// DELETE — ADMIN only (also clears related mappings)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid dataset id' });

  const dataset = await Dataset.findByIdAndDelete(id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
  await AccessMapping.deleteMany({ dataset: id });
  res.json({ message: 'Dataset deleted' });
});

module.exports = router;
