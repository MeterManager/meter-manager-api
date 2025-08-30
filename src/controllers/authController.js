const AuthService = require('../services/authService');

class AuthController {
  async verifyToken(req, res) {
    try {
      // Дістаємо payload з токена
      const payload = req.auth?.payload;

      console.log('--- verifyToken ---');
      console.log('Decoded payload from token:', payload);

      if (!payload?.sub) {
        return res.status(400).json({ message: 'Не знайдено sub у токені' });
      }

      // Синхронізація з БД
      const user = await AuthService.syncUser(payload);

      res.json({
        message: 'Токен перевірено!',
        user,
      });
    } catch (error) {
      console.error('verifyToken error:', error);
      res.status(500).json({
        message: 'Помилка сервера',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
