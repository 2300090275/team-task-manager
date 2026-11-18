const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, admin access required' });
  }
};

const adminOrMember = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'member')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized' });
  }
};

module.exports = { adminOnly, adminOrMember };
