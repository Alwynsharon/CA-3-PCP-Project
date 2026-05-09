const mongoose = require('mongoose');

const accessMappingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

accessMappingSchema.index({ user: 1, dataset: 1 }, { unique: true });

module.exports = mongoose.model('AccessMapping', accessMappingSchema);
