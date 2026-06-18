const mongoose = require('mongoose');
const { v4: uuidv4 } = require('crypto');

const generateOptionId = () => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

const optionSchema = new mongoose.Schema({
  optionId: {
    type: String,
    required: true,
    default: generateOptionId
  },
  text: {
    type: String,
    required: true,
    maxlength: 30
  },
  votes: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    required: true
  }
});

const voteRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  optionId: {
    type: String,
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
});

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '投票主题不能为空'],
    maxlength: [60, '投票主题最多60字'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  options: {
    type: [optionSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 2 && v.length <= 8;
      },
      message: '选项数量需在2-8个之间'
    }
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  invitedEmails: {
    type: [String],
    default: []
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deadline: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  isEnded: {
    type: Boolean,
    default: false
  },
  voteRecords: {
    type: [voteRecordSchema],
    default: []
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

pollSchema.virtual('status').get(function() {
  if (this.isEnded) return 'ended';
  if (new Date() > this.deadline) return 'ended';
  return 'active';
});

pollSchema.set('toJSON', { virtuals: true });
pollSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Poll', pollSchema);
