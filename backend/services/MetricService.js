const { sequelize, MetricType, MetricComponent, HealthMetricRecord, HealthMetricValue, MetricThreshold } = require('../models');
const ProfileAccessService = require('./ProfileAccessService');
const AppError = require('../utils/AppError');
const { parseLocalDateTime, parseDateOnly, startOfLocalDay, endOfLocalDay } = require('../utils/dateTime');
const { SUPPORTED_METRIC_CODES, isSupportedMetricCode } = require('../config/healthMetrics');

class MetricService {
  static async getMetricCatalog() {
    return MetricType.findAll({ where: { code: SUPPORTED_METRIC_CODES }, include: [{ model: MetricComponent, as: 'components' }], order: [['id', 'ASC'], [{ model: MetricComponent, as: 'components' }, 'display_order', 'ASC']] });
  }

  static async recordMetric(userId, profileId, metricTypeId, measuredAt, values, note = null) {
    await ProfileAccessService.requireAccess(userId, profileId, 'full');
    const metricType = await MetricType.findByPk(metricTypeId, { include: [{ model: MetricComponent, as: 'components' }] });
    if (!metricType || !isSupportedMetricCode(metricType.code)) throw new AppError('Loại chỉ số không được hỗ trợ.', 404);
    const components = metricType.components || [];
    if (!components.length) throw new AppError('Loại chỉ số chưa được cấu hình thành phần.', 400);

    const parsed = [];
    for (const component of components) {
      const raw = values[String(component.id)] ?? values[component.id];
      if (raw === undefined || raw === null || raw === '') throw new AppError(`Thiếu giá trị ${component.name}.`, 400);
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) throw new AppError(`Giá trị ${component.name} không hợp lệ.`, 400);
      parsed.push({ component, numeric });
    }

    const measured = measuredAt ? parseLocalDateTime(measuredAt, { field: 'Thời gian đo' }) : new Date();
    if (measured.getTime() > Date.now() + 5*60000) throw new AppError('Thời gian đo không được ở tương lai.',422);

    return sequelize.transaction(async (transaction) => {
      const record = await HealthMetricRecord.create({
        health_profile_id: profileId,
        metric_type_id: metricTypeId,
        measured_at: measured,
        note: note || null,
        created_by_user_id: userId,
        is_alert: false
      }, { transaction });

      for (const item of parsed) {
        await HealthMetricValue.create({
          metric_record_id: record.id,
          component_id: item.component.id,
          numeric_value: item.numeric
        }, { transaction });
      }

      const thresholds = await MetricThreshold.findAll({
        where: { health_profile_id: profileId, enabled: true },
        transaction
      });
      let isAlert = false;
      const warnings = [];
      for (const item of parsed) {
        const threshold = thresholds.find((x) => Number(x.component_id) === Number(item.component.id));
        if (!threshold) continue;
        const min = threshold.min_value === null ? null : Number(threshold.min_value);
        const max = threshold.max_value === null ? null : Number(threshold.max_value);
        if ((min !== null && item.numeric < min) || (max !== null && item.numeric > max)) {
          isAlert = true;
          warnings.push(`${item.component.name}: ${item.numeric} ${item.component.unit}`);
        }
      }
      if (isAlert) {
        record.is_alert = true;
        await record.save({ transaction });
      }
      return { record, warnings };
    });
  }

  static async history(userId, profileId, metricTypeId = null, from = null, to = null) {
    await ProfileAccessService.requireAccess(userId, profileId, 'view');
    const where = { health_profile_id: profileId };
    if (metricTypeId) where.metric_type_id = metricTypeId;
    if (from || to) {
      const { Op } = require('sequelize');
      where.measured_at = {};
      if (from) { const d=parseDateOnly(from, 'Từ ngày'); where.measured_at[Op.gte] = startOfLocalDay(new Date(`${d}T00:00:00+07:00`)); }
      if (to) { const d=parseDateOnly(to, 'Đến ngày'); where.measured_at[Op.lte] = endOfLocalDay(new Date(`${d}T00:00:00+07:00`)); }
    }
    return HealthMetricRecord.findAll({
      where,
      include: [
        { model: MetricType, as: 'metricType', where: { code: SUPPORTED_METRIC_CODES }, required: true, include: [{ model: MetricComponent, as: 'components' }] },
        { model: HealthMetricValue, as: 'values', include: [{ model: MetricComponent, as: 'component' }] }
      ],
      order: [['measured_at', 'DESC']],
      limit: 200
    });
  }

  static async saveThreshold(userId, profileId, componentId, minValue, maxValue, enabled = true) {
    await ProfileAccessService.requireAccess(userId, profileId, 'full');
    const component = await MetricComponent.findByPk(componentId, { include: [{ model: MetricType, as: 'metricType' }] });
    if (!component || !isSupportedMetricCode(component.metricType?.code)) throw new AppError('Thành phần chỉ số không tồn tại.', 404);
    const min = minValue === '' || minValue === null || minValue === undefined ? null : Number(minValue);
    const max = maxValue === '' || maxValue === null || maxValue === undefined ? null : Number(maxValue);
    if (min === null && max === null) throw new AppError('Cần nhập ít nhất một ngưỡng tối thiểu hoặc tối đa.', 400);
    if (min !== null && !Number.isFinite(min)) throw new AppError('Ngưỡng tối thiểu không hợp lệ.', 400);
    if (max !== null && !Number.isFinite(max)) throw new AppError('Ngưỡng tối đa không hợp lệ.', 400);
    if (min !== null && max !== null && min > max) throw new AppError('Ngưỡng tối thiểu không được lớn hơn ngưỡng tối đa.', 400);
    const [threshold] = await MetricThreshold.findOrCreate({
      where: { health_profile_id: profileId, component_id: componentId },
      defaults: { min_value: min, max_value: max, enabled, set_by_user_id: userId }
    });
    if (!threshold.isNewRecord) {
      threshold.min_value = min;
      threshold.max_value = max;
      threshold.enabled = Boolean(enabled);
      threshold.set_by_user_id = userId;
      await threshold.save();
    }
    return threshold;
  }

  static async listThresholds(userId, profileId) {
    await ProfileAccessService.requireAccess(userId, profileId, 'view');
    return MetricThreshold.findAll({
      where: { health_profile_id: profileId },
      include: [{ model: MetricComponent, as: 'component', required: true, include: [{ model: MetricType, as: 'metricType', required: true, where: { code: SUPPORTED_METRIC_CODES } }] }]
    });
  }
}

module.exports = MetricService;
