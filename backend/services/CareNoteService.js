const { sequelize, CareNote } = require('../models');
const ProfileAccessService = require('./ProfileAccessService');
const AppError = require('../utils/AppError');
const validation = require('../utils/validation');

class CareNoteService {
  static async change(userId, noteId, action, payload = {}) {
    if (!['update', 'delete'].includes(action)) throw new AppError('Thao tác không hợp lệ.', 400);
    return sequelize.transaction(async transaction => {
      const note = await CareNote.findByPk(noteId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!note) throw new AppError('Không tìm thấy ghi chú.', 404);
      await ProfileAccessService.requireAccess(userId, note.health_profile_id, 'full');
      if (String(note.author_user_id) !== String(userId)) {
        throw new AppError('Chỉ người tạo ghi chú mới được sửa hoặc xóa.', 403);
      }
      const profileId = note.health_profile_id;
      if (action === 'delete') await note.destroy({ transaction });
      else {
        note.content = validation.text(payload.content, { field: 'Ghi chú chăm sóc', required: true, max: 1200 });
        await note.save({ transaction });
      }
      return { profileId };
    });
  }
}
module.exports = CareNoteService;
