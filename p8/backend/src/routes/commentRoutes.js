const express = require('express');
const router = express.Router();
const {
  getComments,
  createComment,
  likeComment
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/:pollId', optionalAuth, getComments);
router.post('/:pollId', protect, createComment);
router.post('/:id/like', protect, likeComment);

module.exports = router;
