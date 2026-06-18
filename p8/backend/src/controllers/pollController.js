const Poll = require('../models/Poll');
const User = require('../models/User');
const Comment = require('../models/Comment');

const generateRandomColor = () => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const generateOptionId = () => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

const getPolls = async (req, res) => {
  try {
    const { status = 'all', search = '', page = 1, limit = 6 } = req.query;
    const userId = req.user._id;

    let query = { creator: userId };

    if (status === 'active') {
      query.isEnded = false;
      query.deadline = { $gt: new Date() };
    } else if (status === 'ended') {
      query.$or = [
        { isEnded: true },
        { deadline: { $lte: new Date() } }
      ];
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const polls = await Poll.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Poll.countDocuments(query);

    const pollsWithStatus = polls.map(poll => {
      const pollObj = poll.toObject();
      const isEnded = poll.isEnded || new Date() > poll.deadline;
      pollObj.status = isEnded ? 'ended' : 'active';
      return pollObj;
    });

    res.json({
      polls: pollsWithStatus,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPublicPolls = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = { type: 'public' };

    const polls = await Poll.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('creator', 'nickname email');

    const total = await Poll.countDocuments(query);

    const pollsWithStatus = polls.map(poll => {
      const pollObj = poll.toObject();
      const isEnded = poll.isEnded || new Date() > poll.deadline;
      pollObj.status = isEnded ? 'ended' : 'active';
      return pollObj;
    });

    res.json({
      polls: pollsWithStatus,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id)
      .populate('creator', 'nickname email');

    if (!poll) {
      return res.status(404).json({ message: '投票不存在' });
    }

    const isEnded = poll.isEnded || new Date() > poll.deadline;
    const pollObj = poll.toObject();
    pollObj.status = isEnded ? 'ended' : 'active';

    const userVotes = pollObj.voteRecords.filter(
      r => req.user && r.userId.toString() === req.user._id.toString()
    );
    pollObj.userVote = userVotes.length > 0 ? userVotes[0] : null;

    if (pollObj.type === 'private') {
      if (!req.user) {
        return res.status(403).json({ message: '您没有权限查看此投票' });
      }
      const isCreator = poll.creator._id.toString() === req.user._id.toString();
      const isInvited = poll.invitedEmails.includes(req.user.email);
      if (!isCreator && !isInvited) {
        return res.status(403).json({ message: '您没有权限查看此投票' });
      }
    }

    if (pollObj.type === 'private') {
      pollObj.voteRecords = pollObj.voteRecords.map(r => ({
        ...r,
        userId: null
      }));
    } else {
      const voterIds = pollObj.voteRecords.map(r => r.userId).filter(Boolean);
      const uniqueVoterIds = [...new Set(voterIds.map(id => id.toString()))];
      const voters = await User.find({ _id: { $in: uniqueVoterIds } }, 'nickname email avatar');
      const voterMap = {};
      voters.forEach(v => {
        voterMap[v._id.toString()] = v;
      });
      pollObj.voteRecords = pollObj.voteRecords.map(r => ({
        ...r,
        user: voterMap[r.userId.toString()] || null
      }));
    }

    res.json(pollObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createPoll = async (req, res) => {
  try {
    const { title, description, options, type, invitedEmails, deadline } = req.body;

    if (!title || !options || options.length < 2 || options.length > 8) {
      return res.status(400).json({ message: '请填写正确的投票信息' });
    }

    const coloredOptions = options.map(text => ({
      optionId: generateOptionId(),
      text,
      votes: 0,
      color: generateRandomColor()
    }));

    const pollData = {
      title,
      description: description || '',
      options: coloredOptions,
      type: type || 'public',
      creator: req.user._id,
    };

    if (deadline) {
      pollData.deadline = new Date(deadline);
    }

    if (type === 'private' && invitedEmails) {
      pollData.invitedEmails = invitedEmails.filter(e => e.trim());
    }

    const poll = await Poll.create(pollData);

    res.status(201).json(poll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, options } = req.body;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: '投票不存在' });
    }

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '您没有权限编辑此投票' });
    }

    if (poll.isEnded || new Date() > poll.deadline) {
      return res.status(400).json({ message: '已结束的投票不可编辑' });
    }

    if (title !== undefined) poll.title = title;
    if (description !== undefined) poll.description = description;

    if (options && Array.isArray(options)) {
      if (options.length < 2 || options.length > 8) {
        return res.status(400).json({ message: '选项数量需在2-8个之间' });
      }

      const existingOptionsMap = {};
      poll.options.forEach(opt => {
        existingOptionsMap[opt.optionId] = opt;
      });

      const optionIdsInUpdate = options.filter(o => o.optionId).map(o => o.optionId);
      for (const existingOpt of poll.options) {
        if (existingOpt.votes > 0 && !optionIdsInUpdate.includes(existingOpt.optionId)) {
          return res.status(400).json({ message: '已有人投票的选项不可删除' });
        }
      }

      const newOptions = options.map(opt => {
        if (opt.optionId && existingOptionsMap[opt.optionId]) {
          const existing = existingOptionsMap[opt.optionId];
          return {
            ...existing.toObject(),
            text: opt.text || existing.text
          };
        }
        return {
          optionId: generateOptionId(),
          text: opt.text,
          votes: 0,
          color: generateRandomColor()
        };
      });

      poll.options = newOptions;
    }

    const updatedPoll = await poll.save();
    res.json(updatedPoll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: '投票不存在' });
    }

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '您没有权限删除此投票' });
    }

    await Poll.findByIdAndDelete(id);
    await Comment.deleteMany({ pollId: id });

    res.json({ message: '投票已删除' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: '投票不存在' });
    }

    if (poll.isEnded || new Date() > poll.deadline) {
      return res.status(400).json({ message: '投票已结束' });
    }

    if (poll.type === 'private') {
      const isCreator = poll.creator.toString() === req.user._id.toString();
      const isInvited = poll.invitedEmails.includes(req.user.email);
      if (!isCreator && !isInvited) {
        return res.status(403).json({ message: '您没有权限参与此投票' });
      }
    }

    const targetOption = poll.options.find(o => o.optionId === optionId);
    if (!targetOption) {
      return res.status(400).json({ message: '无效的选项' });
    }

    const userId = req.user._id;
    const existingVoteIndex = poll.voteRecords.findIndex(
      r => r.userId.toString() === userId.toString()
    );

    if (existingVoteIndex !== -1) {
      const oldOptionId = poll.voteRecords[existingVoteIndex].optionId;
      const oldOption = poll.options.find(o => o.optionId === oldOptionId);
      if (oldOption) {
        oldOption.votes -= 1;
      }
      targetOption.votes += 1;
      poll.voteRecords[existingVoteIndex].optionId = optionId;
      poll.voteRecords[existingVoteIndex].votedAt = new Date();
    } else {
      targetOption.votes += 1;
      poll.totalVotes += 1;
      poll.voteRecords.push({
        userId,
        optionId,
        votedAt: new Date()
      });
    }

    const updatedPoll = await poll.save();

    const pollObj = updatedPoll.toObject();
    pollObj.status = 'active';
    const userVotes = pollObj.voteRecords.filter(
      r => r.userId.toString() === req.user._id.toString()
    );
    pollObj.userVote = userVotes.length > 0 ? userVotes[0] : null;

    res.json(pollObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const endPoll = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: '投票不存在' });
    }

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '您没有权限结束此投票' });
    }

    if (poll.isEnded) {
      return res.status(400).json({ message: '投票已结束' });
    }

    poll.isEnded = true;
    const updatedPoll = await poll.save();

    res.json(updatedPoll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPolls,
  getPublicPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  endPoll
};
