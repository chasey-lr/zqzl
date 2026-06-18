const Comment = require('../models/Comment');
const Poll = require('../models/Poll');
const User = require('../models/User');

const checkPollAccess = (poll, req) => {
  if (poll.type === 'private') {
    if (!req.user) {
      return false;
    }
    const isCreator = poll.creator.toString() === req.user._id.toString();
    const isInvited = poll.invitedEmails.includes(req.user.email);
    if (!isCreator && !isInvited) {
      return false;
    }
  }
  return true;
};

const getComments = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: '投票不存在' });
    }

    if (!checkPollAccess(poll, req)) {
      return res.status(403).json({ message: '您没有权限查看此投票的评论' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const comments = await Comment.find({ pollId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'nickname email avatar');

    const total = await Comment.countDocuments({ pollId });

    const commentsWithLiked = comments.map(comment => {
      const commentObj = comment.toObject();
      commentObj.isLiked = req.user
        ? comment.likedBy.some(id => id.toString() === req.user._id.toString())
        : false;
      return commentObj;
    });

    res.json({
      comments: commentsWithLiked,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { content } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: '投票不存在' });
    }

    if (!checkPollAccess(poll, req)) {
      return res.status(403).json({ message: '您没有权限在此投票下评论' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    const comment = await Comment.create({
      pollId,
      userId: req.user._id,
      content: content.trim()
    });

    await comment.populate('userId', 'nickname email avatar');

    const commentObj = comment.toObject();
    commentObj.isLiked = false;

    res.status(201).json(commentObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const poll = await Poll.findById(comment.pollId);
    if (poll && !checkPollAccess(poll, req)) {
      return res.status(403).json({ message: '您没有权限操作此评论' });
    }

    const likedIndex = comment.likedBy.findIndex(
      id => id.toString() === userId.toString()
    );

    if (likedIndex !== -1) {
      comment.likedBy.splice(likedIndex, 1);
      comment.likes -= 1;
    } else {
      comment.likedBy.push(userId);
      comment.likes += 1;
    }

    const updatedComment = await comment.save();
    await updatedComment.populate('userId', 'nickname email avatar');

    const commentObj = updatedComment.toObject();
    commentObj.isLiked = likedIndex === -1;

    res.json(commentObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getComments, createComment, likeComment };
