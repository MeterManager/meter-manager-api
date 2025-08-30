const AuthService = require('../services/authService');

class AuthController {
  async verifyToken(req, res) {
    try {
      const payload = req.auth?.payload;

      console.log('--- verifyToken ---');
      console.log('Decoded payload from token:', payload);

      if (!payload?.sub) {
        return res.status(400).json({ message: 'sub not found in token' });
      }

      const user = await AuthService.syncUser(payload);

      res.json({
        message: 'Token verified',
        user,
      });
    } catch (error) {
      console.error('verifyToken error:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
