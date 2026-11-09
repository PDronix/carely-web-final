const { Op } = require('sequelize');
const { CareTask, Appointment, Facility, HealthMetricRecord, MetricType, HealthProfile, Person } = require('../models');
const { SUPPORTED_METRIC_CODES } = require('../config/healthMetrics');

class NotificationService {
  static async forProfiles(profileIds) {
    if (!profileIds.length) return [];
    const now = new Date(); const next24h = new Date(Date.now() + 24 * 3600000); const recent = new Date(Date.now() - 48 * 3600000);
    const [tasks, appointments, alerts] = await Promise.all([
      CareTask.findAll({ where: { health_profile_id: { [Op.in]: profileIds }, status: { [Op.in]: ['pending','missed'] }, due_at: { [Op.between]: [recent, next24h] } }, order: [['due_at','ASC']], limit: 6 }),
      Appointment.findAll({ where: { health_profile_id: { [Op.in]: profileIds }, status: { [Op.in]: ['proposed_time','confirmed'] }, updated_at: { [Op.gte]: recent } }, include: [{ model: Facility, as: 'facility' }], order: [['updated_at','DESC']], limit: 5 }),
      HealthMetricRecord.findAll({ where: { health_profile_id: { [Op.in]: profileIds }, is_alert: true, measured_at: { [Op.gte]: recent } }, include: [{ model: MetricType, as: 'metricType', required: true, where: { code: SUPPORTED_METRIC_CODES } }, { model: HealthProfile, as: 'profile', include: [{ model: Person, as: 'person' }] }], order: [['measured_at','DESC']], limit: 5 })
    ]);
    const rows = [];
    tasks.forEach((t) => rows.push({ type: 'care', title: t.title, detail: t.status==='missed' ? 'Đã bỏ lỡ' : (new Date(t.due_at)<now?'Đã đến giờ':'Sắp đến giờ'), at: t.due_at, href: `/care?profileId=${t.health_profile_id}` }));
    appointments.forEach((a) => {
      const at = a.status === 'confirmed' ? a.confirmed_at : a.updated_at;
      if (!at || new Date(at) < recent) return;
      rows.push({ type: 'appointment', title: a.status === 'proposed_time' ? 'Cơ sở y tế đề xuất thời gian mới' : 'Lịch khám đã được xác nhận', detail: a.facility?.facility_name || 'Cơ sở y tế', at, href: '/appointments' });
    });
    alerts.forEach((m) => rows.push({ type: 'metric', title: `${m.metricType?.name || 'Chỉ số'} vượt ngưỡng`, detail: m.profile?.person?.full_name || 'Hồ sơ sức khỏe', at: m.measured_at, href: `/metrics?profileId=${m.health_profile_id}&metricTypeId=${m.metric_type_id}` }));
    return rows.sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,8);
  }
}
module.exports = NotificationService;
