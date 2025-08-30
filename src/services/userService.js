const { User } = require('../../models');
const { Op } = require('sequelize');

class UserService {
  async getAllUsers(filters = {}) {
    const where = {};

    if (filters.full_name) {
      where.full_name = { [Op.iLike]: `%${filters.full_name}%` };
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    return await User.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getUserById(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }


  async updateUser(id, updateData) {
    const user = await this.getUserById(id);

    return await user.update({
      ...(updateData.full_name && { full_name: updateData.full_name }),
      ...(updateData.role && { role: updateData.role }),
      ...(updateData.is_active !== undefined && { is_active: updateData.is_active }),
    });
  }

  async deleteUser(id) {
    const user = await this.getUserById(id);
    return await user.destroy();
  }
}

module.exports = new UserService();
