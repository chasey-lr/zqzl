const express = require('express');
const router = express.Router();
const {
  getPolls,
  getPublicPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  endPoll
} = require('../controllers/pollController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/public', getPublicPolls);
router.get('/', protect, getPolls);
router.post('/', protect, createPoll);
router.get('/:id', optionalAuth, getPollById);
router.put('/:id', protect, updatePoll);
router.delete('/:id', protect, deletePoll);
router.post('/:id/vote', protect, votePoll);
router.post('/:id/end', protect, endPoll);

module.exports = router;
