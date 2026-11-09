const MetricService = require('../services/MetricService');
const ProfileAccessService = require('../services/ProfileAccessService');

exports.index = async (req, res, next) => {
  try {
    const profiles = await ProfileAccessService.listAccessibleProfiles(req.user.id);
    const profileId = req.query.profileId || profiles[0]?.profile?.id;
    const selected = profiles.find((x) => Number(x.profile.id) === Number(profileId)) || null;
    const catalog = await MetricService.getMetricCatalog();
    const requestedType = catalog.find((item) => Number(item.id) === Number(req.query.metricTypeId));
    const metricTypeId = requestedType?.id || catalog[0]?.id || null;
    let history = []; let overviewHistory = []; let thresholds = [];
    if (profileId) {
      overviewHistory = await MetricService.history(req.user.id, profileId, null, req.query.from || null, req.query.to || null);
      history = metricTypeId ? overviewHistory.filter((row) => Number(row.metric_type_id) === Number(metricTypeId)) : overviewHistory;
      thresholds = await MetricService.listThresholds(req.user.id, profileId);
    }
    const selectedType = catalog.find((t) => Number(t.id) === Number(metricTypeId)) || null;
    const chartRows = history.slice().reverse().map((record) => ({
      measuredAt: record.measured_at,
      isAlert: Boolean(record.is_alert),
      values: Object.fromEntries((record.values || []).map((v) => [String(v.component_id), Number(v.numeric_value)]))
    }));
    const chartSeries = (selectedType?.components || []).map((component) => ({ id: String(component.id), name: component.name, unit: component.unit, values: chartRows.map((row) => row.values[String(component.id)] ?? null) }));
    const chartThresholds = Object.fromEntries(thresholds.filter((t) => Number(t.component?.metric_type_id) === Number(metricTypeId)).map((t) => [String(t.component_id), { min: t.min_value === null ? null : Number(t.min_value), max: t.max_value === null ? null : Number(t.max_value), enabled: Boolean(t.enabled) }]));
    res.render('metrics/index', { title: 'Chỉ số sức khỏe', profiles, selected, profileId, metricTypeId, selectedType, catalog, history, overviewHistory, thresholds, chartData: { rows: chartRows, series: chartSeries, thresholds: chartThresholds } });
  } catch (e) { next(e); }
};

exports.record = async (req, res, next) => {
  try {
    const values = {}; for (const [key, value] of Object.entries(req.body)) if (key.startsWith('component_')) values[key.replace('component_', '')] = value;
    const result = await MetricService.recordMetric(req.user.id, req.body.profileId, req.body.metricTypeId, req.body.measuredAt, values, req.body.note);
    req.session.flash = { type: result.warnings.length ? 'warning' : 'success', message: result.warnings.length ? `Đã lưu chỉ số. Có giá trị vượt ngưỡng: ${result.warnings.join(', ')}` : 'Đã lưu chỉ số sức khỏe.' };
    res.redirect(`/metrics?profileId=${req.body.profileId}&metricTypeId=${req.body.metricTypeId}`);
  } catch (e) { next(e); }
};

exports.saveThreshold = async (req, res, next) => {
  try {
    await MetricService.saveThreshold(req.user.id, req.body.profileId, req.body.componentId, req.body.minValue, req.body.maxValue, req.body.enabled === 'on');
    req.session.flash = { type: 'success', message: 'Đã cập nhật ngưỡng cảnh báo.' };
    res.redirect(`/metrics?profileId=${req.body.profileId}&metricTypeId=${req.body.metricTypeId || ''}`);
  } catch (e) { next(e); }
};
