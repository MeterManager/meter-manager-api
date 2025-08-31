const { User } = require('../../models');

class AuthService {
  async syncUser(payload) {
    console.log('--- syncUser ---');
    console.log('Payload received:', payload);

    try {
      const auth0UserId = payload.sub;

      const email = payload['https://energy-api.local/email'] || '';
      const fullNameFromEmail =
        payload['https://energy-api.local/full_name'] || (email ? email.split('@')[0] : 'Unknown User');

      let user = await User.findOne({ where: { auth0_user_id: auth0UserId } });
      console.log('Existing user from DB:', user?.toJSON?.() || null);

      if (!user) {
        user = await User.create({
          auth0_user_id: auth0UserId,
          full_name: fullNameFromEmail,
          role: payload['https://energy-api.local/roles']?.[0] || 'operator',
          is_active: true,
        });
        console.log('Created new user:', user.toJSON());
      } else {
        await user.update({
          full_name: fullNameFromEmail || user.full_name,
          role: payload['https://energy-api.local/roles']?.[0] || user.role,
        });
        console.log('Updated user:', user.toJSON());
      }

      return {
        id: user.id,
        auth0_user_id: user.auth0_user_id,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
      };
    } catch (error) {
      console.error('Sync user error:', error);
      throw new Error(`User synchronisation error: ${error.message}`);
    }
  }
}

module.exports = new AuthService();
