const { AuditLog } = require('../models');
class AuditService {
  static async write({ actorUserId=null, action, resourceType, resourceId=null, outcome='success', metadata=null, requestId=null }, options={}) {
    try {
      return await AuditLog.create({ actor_user_id:actorUserId, action_code:action, resource_type:resourceType, resource_id:resourceId, outcome, metadata, request_id:requestId }, options);
    } catch(error) {
      if (options.transaction) throw error;
      if (process.env.NODE_ENV !== 'production') console.error('Audit write failed:', error.message);
      return null;
    }
  }
}
module.exports=AuditService;
