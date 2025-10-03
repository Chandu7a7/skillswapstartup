// server/src/middleware/adminMiddleware.js

const adminMiddleware = (req, res, next) => {
  // This middleware runs AFTER authMiddleware, so req.user will exist.
  if (req.user && req.user.role === 'admin') {
    next(); // If user is an admin, proceed to the controller
  } else {
    // If not an admin, send a 'Forbidden' error
    res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
};

export default adminMiddleware;