const jwt = require('jsonwebtoken');
const { getCollection } = require('../utils/getCollection');

// Verify JWT token
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided in request headers');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token extracted from header:', token.substring(0, 20) + '...');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Verify user role
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('No user information in request');
      return res.status(401).json({ message: 'Access denied. No user information.' });
    }
    
    const userRole = req.user.role;
    console.log('User role:', userRole, 'Allowed roles:', allowedRoles);
    
    if (!allowedRoles.includes(userRole)) {
      console.log('Access denied due to insufficient permissions');
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    
    console.log('Role verification passed');
    next();
  };
};

// Verify user is admin
const verifyAdmin = (req, res, next) => {
  return verifyRole('admin')(req, res, next);
};

// Verify user is rider
const verifyRider = (req, res, next) => {
  return verifyRole('rider')(req, res, next);
};

// Verify user is regular user
const verifyUser = (req, res, next) => {
  return verifyRole('user')(req, res, next);
};

module.exports = {
  verifyToken,
  verifyRole,
  verifyAdmin,
  verifyRider,
  verifyUser
};