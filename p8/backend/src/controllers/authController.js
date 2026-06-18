const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const register = async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码不能为空' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    const user = await User.create({
      email,
      password,
      nickname,
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    res.json({
      _id: user._id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      email: req.user.email,
      nickname: req.user.nickname,
      avatar: req.user.avatar,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { register, login, getCurrentUser };
