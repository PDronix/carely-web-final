const SUPPORTED_METRIC_CODES = Object.freeze(['blood_pressure', 'heart_rate', 'weight']);
const isSupportedMetricCode = (code) => SUPPORTED_METRIC_CODES.includes(code);
module.exports = { SUPPORTED_METRIC_CODES, isSupportedMetricCode };
