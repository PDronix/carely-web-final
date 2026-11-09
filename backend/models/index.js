const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const common = { timestamps: false, freezeTableName: true };
const model = (name, fields) => sequelize.define(name, fields, { ...common, tableName: name });

const User = model('users', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(254), allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  display_name: { type: DataTypes.STRING(120), allowNull: false },
  phone: DataTypes.STRING(20),
  account_type: { type: DataTypes.ENUM('member', 'facility', 'admin'), allowNull: false },
  status: { type: DataTypes.ENUM('active', 'locked'), allowNull: false },
  auth_version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
  last_login_at: DataTypes.DATE,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const PasswordResetToken = model('password_reset_tokens', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  token_hash: { type: DataTypes.STRING(64), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used_at: DataTypes.DATE,
  created_at: DataTypes.DATE
});

const Family = model('families', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  owner_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const Person = model('people', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  family_id: DataTypes.BIGINT.UNSIGNED,
  user_id: DataTypes.BIGINT.UNSIGNED,
  person_type: { type: DataTypes.ENUM('member', 'dependent'), allowNull: false },
  full_name: { type: DataTypes.STRING(120), allowNull: false },
  date_of_birth: DataTypes.DATEONLY,
  gender: DataTypes.ENUM('male', 'female', 'other', 'unspecified'),
  relationship_to_manager: DataTypes.STRING(50),
  manager_user_id: DataTypes.BIGINT.UNSIGNED,
  status: DataTypes.ENUM('active', 'inactive'),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const UserConsent = model('user_consents', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  subject_person_id: DataTypes.BIGINT.UNSIGNED,
  consent_type: { type: DataTypes.ENUM('terms', 'privacy', 'health_data', 'dependent_health_data'), allowNull: false },
  document_version: { type: DataTypes.STRING(30), allowNull: false },
  status: { type: DataTypes.ENUM('granted', 'revoked'), allowNull: false },
  granted_at: DataTypes.DATE,
  revoked_at: DataTypes.DATE,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const FamilyInvite = model('family_invites', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  family_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  code: { type: DataTypes.STRING(64), allowNull: false },
  created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  status: DataTypes.ENUM('active', 'revoked'),
  created_at: DataTypes.DATE
});

const FamilyJoinRequest = model('family_join_requests', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  invite_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  status: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
  requested_at: DataTypes.DATE,
  reviewed_at: DataTypes.DATE,
  reviewed_by_user_id: DataTypes.BIGINT.UNSIGNED
});

const HealthProfile = model('health_profiles', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  person_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  blood_type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'),
  general_note: DataTypes.TEXT,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const ProfilePermission = model('profile_permissions', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  grantee_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  access_level: DataTypes.ENUM('view', 'full'),
  granted_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const Facility = model('facilities', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  facility_name: { type: DataTypes.STRING(180), allowNull: false },
  address: DataTypes.STRING(255),
  specialty: DataTypes.STRING(180),
  phone: DataTypes.STRING(20),
  description: DataTypes.TEXT,
  license_number: { type: DataTypes.STRING(100), allowNull: false },
  verification_status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  reviewed_at: DataTypes.DATE,
  reviewed_by_user_id: DataTypes.BIGINT.UNSIGNED,
  rejection_reason: DataTypes.STRING(500),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const FacilityDocument = model('facility_documents', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  facility_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  uploaded_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  document_type: { type: DataTypes.ENUM('operating_license', 'other'), allowNull: false },
  original_name: { type: DataTypes.STRING(255), allowNull: false },
  storage_key: { type: DataTypes.STRING(255), allowNull: false },
  mime_type: { type: DataTypes.STRING(100), allowNull: false },
  size_bytes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  sha256: { type: DataTypes.STRING(64), allowNull: false },
  uploaded_at: DataTypes.DATE
});

const Appointment = model('appointments', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  facility_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  requested_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  reason: DataTypes.STRING(500),
  requested_for: { type: DataTypes.DATE, allowNull: false },
  proposed_for: DataTypes.DATE,
  confirmed_for: DataTypes.DATE,
  status: DataTypes.ENUM('pending', 'proposed_time', 'confirmed', 'rejected', 'completed', 'cancelled'),
  facility_response_note: DataTypes.STRING(500),
  confirmed_at: DataTypes.DATE,
  rejected_at: DataTypes.DATE,
  rejected_by_user_id: DataTypes.BIGINT.UNSIGNED,
  completed_at: DataTypes.DATE,
  cancelled_at: DataTypes.DATE,
  cancelled_by_user_id: DataTypes.BIGINT.UNSIGNED,
  access_revoked_at: DataTypes.DATE,
  access_revoked_by_user_id: DataTypes.BIGINT.UNSIGNED,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const VisitResult = model('visit_results', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  recorded_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  doctor_name: DataTypes.STRING(120),
  examined_at: { type: DataTypes.DATE, allowNull: false },
  diagnosis: DataTypes.TEXT,
  conclusion: DataTypes.TEXT,
  instructions: DataTypes.TEXT,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const MedicalCondition = model('medical_conditions', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  condition_name: { type: DataTypes.STRING(180), allowNull: false },
  diagnosed_on: DataTypes.DATEONLY,
  status: DataTypes.ENUM('active', 'resolved'),
  note: DataTypes.TEXT,
  source_type: DataTypes.ENUM('member', 'facility'),
  visit_result_id: DataTypes.BIGINT.UNSIGNED,
  created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const HealthRestriction = model('health_restrictions', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  restriction_type: DataTypes.ENUM('allergy', 'dietary', 'other'),
  name: { type: DataTypes.STRING(180), allowNull: false },
  note: DataTypes.TEXT,
  created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const CareNote = model('care_notes', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  author_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const PersonalAppointment = model('personal_appointments', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  facility_name: DataTypes.STRING(180),
  doctor_name: DataTypes.STRING(120),
  scheduled_at: { type: DataTypes.DATE, allowNull: false },
  reminder_at: DataTypes.DATE,
  status: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
  note: DataTypes.TEXT,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const Medication = model('medications', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  visit_result_id: DataTypes.BIGINT.UNSIGNED,
  created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(180), allowNull: false },
  dosage: DataTypes.STRING(120),
  instructions: DataTypes.TEXT,
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: DataTypes.DATEONLY,
  source_type: DataTypes.ENUM('self_recorded', 'facility_prescribed'),
  status: DataTypes.ENUM('active', 'completed', 'stopped'),
  reminder_state: DataTypes.ENUM('none', 'draft', 'active'),
  reminder_confirmed_at: DataTypes.DATE,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const MedicationSchedule = model('medication_schedules', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  medication_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  time_of_day: { type: DataTypes.TIME, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: DataTypes.DATE
});

const CareTask = model('care_tasks', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  task_type: DataTypes.ENUM('medication', 'appointment', 'general'),
  medication_schedule_id: DataTypes.BIGINT.UNSIGNED,
  personal_appointment_id: DataTypes.BIGINT.UNSIGNED,
  title: { type: DataTypes.STRING(180), allowNull: false },
  description: DataTypes.STRING(500),
  due_at: { type: DataTypes.DATE, allowNull: false },
  status: DataTypes.ENUM('pending', 'completed', 'missed', 'cancelled'),
  completed_at: DataTypes.DATE,
  completed_by_user_id: DataTypes.BIGINT.UNSIGNED,
  completion_note: DataTypes.STRING(500),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const MetricType = model('metric_types', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(50), allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: DataTypes.STRING(500)
});

const MetricComponent = model('metric_components', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  metric_type_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  unit: { type: DataTypes.STRING(30), allowNull: false },
  display_order: DataTypes.SMALLINT.UNSIGNED
});

const HealthMetricRecord = model('health_metric_records', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  metric_type_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  measured_at: { type: DataTypes.DATE, allowNull: false },
  note: DataTypes.STRING(500),
  created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  is_alert: DataTypes.BOOLEAN,
  created_at: DataTypes.DATE
});

const HealthMetricValue = model('health_metric_values', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  metric_record_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  component_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  numeric_value: { type: DataTypes.DECIMAL(12, 4), allowNull: false }
});

const MetricThreshold = model('metric_thresholds', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  health_profile_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  component_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  min_value: DataTypes.DECIMAL(12, 4),
  max_value: DataTypes.DECIMAL(12, 4),
  enabled: DataTypes.BOOLEAN,
  set_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const Invoice = model('invoices', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  visit_result_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  invoice_number: { type: DataTypes.STRING(50), allowNull: false },
  total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  payment_status: DataTypes.ENUM('unpaid', 'paid'),
  issued_at: DataTypes.DATE,
  paid_at: DataTypes.DATE,
  note: DataTypes.TEXT,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
});

const AuditLog = model('audit_logs', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  actor_user_id: DataTypes.BIGINT.UNSIGNED,
  action_code: { type: DataTypes.STRING(80), allowNull: false },
  resource_type: { type: DataTypes.STRING(60), allowNull: false },
  resource_id: DataTypes.BIGINT.UNSIGNED,
  outcome: { type: DataTypes.ENUM('success', 'denied', 'failure'), allowNull: false },
  metadata: DataTypes.JSON,
  request_id: DataTypes.STRING(36),
  created_at: DataTypes.DATE
});


User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'passwordResetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserConsent, { foreignKey: 'user_id', as: 'consents' });
UserConsent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserConsent.belongsTo(Person, { foreignKey: 'subject_person_id', as: 'subjectPerson' });
Facility.hasMany(FacilityDocument, { foreignKey: 'facility_id', as: 'documents' });
FacilityDocument.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });
FacilityDocument.belongsTo(User, { foreignKey: 'uploaded_by_user_id', as: 'uploader' });
AuditLog.belongsTo(User, { foreignKey: 'actor_user_id', as: 'actor' });
User.hasOne(Person, { foreignKey: 'user_id', as: 'person' });
Person.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Family.hasMany(Person, { foreignKey: 'family_id', as: 'people' });
Person.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });
Family.belongsTo(User, { foreignKey: 'owner_user_id', as: 'owner' });
Person.belongsTo(User, { foreignKey: 'manager_user_id', as: 'manager' });
Person.hasOne(HealthProfile, { foreignKey: 'person_id', as: 'healthProfile' });
HealthProfile.belongsTo(Person, { foreignKey: 'person_id', as: 'person' });
HealthProfile.hasMany(ProfilePermission, { foreignKey: 'health_profile_id', as: 'permissions' });
ProfilePermission.belongsTo(User, { foreignKey: 'grantee_user_id', as: 'grantee' });
Facility.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Appointment.belongsTo(Facility, { foreignKey: 'facility_id', as: 'facility' });
Appointment.belongsTo(HealthProfile, { foreignKey: 'health_profile_id', as: 'profile' });
VisitResult.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
Appointment.hasOne(VisitResult, { foreignKey: 'appointment_id', as: 'visitResult' });
Medication.hasMany(MedicationSchedule, { foreignKey: 'medication_id', as: 'schedules' });
MedicationSchedule.belongsTo(Medication, { foreignKey: 'medication_id', as: 'medication' });
MetricType.hasMany(MetricComponent, { foreignKey: 'metric_type_id', as: 'components' });
MetricComponent.belongsTo(MetricType, { foreignKey: 'metric_type_id', as: 'metricType' });
HealthMetricRecord.belongsTo(MetricType, { foreignKey: 'metric_type_id', as: 'metricType' });
HealthMetricRecord.belongsTo(HealthProfile, { foreignKey: 'health_profile_id', as: 'profile' });
HealthProfile.hasMany(HealthMetricRecord, { foreignKey: 'health_profile_id', as: 'metricRecords' });
HealthMetricRecord.hasMany(HealthMetricValue, { foreignKey: 'metric_record_id', as: 'values' });
HealthMetricValue.belongsTo(MetricComponent, { foreignKey: 'component_id', as: 'component' });
MetricThreshold.belongsTo(MetricComponent, { foreignKey: 'component_id', as: 'component' });
Invoice.belongsTo(VisitResult, { foreignKey: 'visit_result_id', as: 'visitResult' });
VisitResult.hasOne(Invoice, { foreignKey: 'visit_result_id', as: 'invoice' });
Medication.belongsTo(VisitResult, { foreignKey: 'visit_result_id', as: 'visitResult' });
VisitResult.hasMany(Medication, { foreignKey: 'visit_result_id', as: 'prescriptions' });

module.exports = {
  sequelize,
  User,
  PasswordResetToken,
  UserConsent,
  Family,
  Person,
  FamilyInvite,
  FamilyJoinRequest,
  HealthProfile,
  ProfilePermission,
  Facility,
  FacilityDocument,
  Appointment,
  VisitResult,
  MedicalCondition,
  HealthRestriction,
  CareNote,
  PersonalAppointment,
  Medication,
  MedicationSchedule,
  CareTask,
  MetricType,
  MetricComponent,
  HealthMetricRecord,
  HealthMetricValue,
  MetricThreshold,
  Invoice,
  AuditLog
};
