-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: carely
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `facility_id` bigint unsigned NOT NULL,
  `requested_by_user_id` bigint unsigned NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `requested_for` datetime NOT NULL,
  `proposed_for` datetime DEFAULT NULL,
  `confirmed_for` datetime DEFAULT NULL,
  `status` enum('pending','proposed_time','confirmed','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
  `facility_response_note` varchar(500) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejected_by_user_id` bigint unsigned DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by_user_id` bigint unsigned DEFAULT NULL,
  `access_revoked_at` datetime DEFAULT NULL,
  `access_revoked_by_user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_appointments_requester` (`requested_by_user_id`),
  KEY `fk_appointments_rejector` (`rejected_by_user_id`),
  KEY `fk_appointments_canceller` (`cancelled_by_user_id`),
  KEY `fk_appointments_access_revoker` (`access_revoked_by_user_id`),
  KEY `idx_appointments_facility_status` (`facility_id`,`status`),
  KEY `idx_appointments_profile_status` (`health_profile_id`,`status`),
  KEY `idx_appointments_confirmed_for` (`confirmed_for`),
  CONSTRAINT `fk_appointments_access_revoker` FOREIGN KEY (`access_revoked_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_appointments_canceller` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_appointments_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`),
  CONSTRAINT `fk_appointments_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`),
  CONSTRAINT `fk_appointments_rejector` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_appointments_requester` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_appointments_cancelled_time` CHECK (((`status` <> _utf8mb4'cancelled') or (`cancelled_at` is not null))),
  CONSTRAINT `chk_appointments_completed_time` CHECK (((`status` <> _utf8mb4'completed') or (`completed_at` is not null))),
  CONSTRAINT `chk_appointments_confirmed_time` CHECK (((`status` not in (_utf8mb4'confirmed',_utf8mb4'completed')) or ((`confirmed_for` is not null) and (`confirmed_at` is not null)))),
  CONSTRAINT `chk_appointments_proposed_time` CHECK (((`status` <> _utf8mb4'proposed_time') or (`proposed_for` is not null))),
  CONSTRAINT `chk_appointments_rejected_time` CHECK (((`status` <> _utf8mb4'rejected') or ((`rejected_at` is not null) and (`rejected_by_user_id` is not null))))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,3,1,2,'Khám định kỳ','2026-11-02 21:37:12',NULL,'2026-11-02 21:37:12','confirmed',NULL,'2026-10-31 21:37:12',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,4,4,6,'khám tổng quan','2026-11-11 20:49:00',NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-03 11:46:45','2026-11-03 11:46:45'),(3,4,1,6,NULL,'2026-11-03 20:54:00','2026-11-04 21:50:00','2026-11-04 21:50:00','confirmed','Đã kín lịch','2026-11-03 18:49:47',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-03 11:48:43','2026-11-03 11:49:47'),(4,1,1,2,'khám cho trẻ','2026-11-06 14:30:00',NULL,'2026-11-06 14:30:00','completed',NULL,'2026-11-05 00:29:00',NULL,NULL,'2026-11-06 22:41:29',NULL,NULL,NULL,NULL,'2026-11-04 17:27:37','2026-11-06 15:41:29'),(5,1,4,2,NULL,'2026-11-08 22:37:00',NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-06 15:37:36','2026-11-06 15:37:36'),(6,1,4,2,NULL,'2026-11-10 22:37:00',NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-06 15:37:46','2026-11-06 15:37:46'),(7,1,1,2,NULL,'2026-11-06 22:44:00','2026-11-07 10:43:00','2026-11-07 10:43:00','confirmed',NULL,'2026-11-06 22:44:14',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-06 15:43:27','2026-11-06 15:44:14');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `actor_user_id` bigint unsigned DEFAULT NULL,
  `action_code` varchar(80) NOT NULL,
  `resource_type` varchar(60) NOT NULL,
  `resource_id` bigint unsigned DEFAULT NULL,
  `outcome` enum('success','denied','failure') NOT NULL,
  `metadata` json DEFAULT NULL,
  `request_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_actor_created` (`actor_user_id`,`created_at`),
  KEY `idx_audit_logs_resource_created` (`resource_type`,`resource_id`,`created_at`),
  KEY `idx_audit_logs_action_created` (`action_code`,`created_at`),
  CONSTRAINT `fk_audit_logs_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,NULL,'AUTH_LOGIN_FAILURE','auth',NULL,'denied',NULL,NULL,'2026-10-31 14:38:50'),(2,NULL,'AUTH_LOGIN_FAILURE','auth',NULL,'denied',NULL,NULL,'2026-10-31 14:39:28'),(3,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-10-31 14:40:00'),(4,6,'AUTH_LOGIN_SUCCESS','user',6,'success',NULL,NULL,'2026-10-31 14:42:41'),(5,1,'AUTH_LOGIN_SUCCESS','user',1,'success',NULL,NULL,'2026-10-31 14:43:12'),(6,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-10-31 14:43:23'),(7,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-10-31 15:06:29'),(8,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-03 10:11:10'),(9,15,'CONSENT_GRANTED','user',15,'success','{\"types\": [\"terms\", \"privacy\"]}',NULL,'2026-11-03 10:15:15'),(10,15,'CONSENT_GRANTED','person',8,'success','{\"type\": \"health_data\", \"version\": \"1.0\"}',NULL,'2026-11-03 10:18:39'),(11,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-03 11:41:48'),(12,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-03 11:44:09'),(13,1,'AUTH_LOGIN_SUCCESS','user',1,'success',NULL,NULL,'2026-11-03 11:44:50'),(14,NULL,'AUTH_LOGIN_FAILURE','auth',NULL,'denied',NULL,NULL,'2026-11-03 11:45:34'),(15,6,'AUTH_LOGIN_SUCCESS','user',6,'success',NULL,NULL,'2026-11-03 11:45:41'),(16,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-03 11:46:58'),(17,6,'AUTH_LOGIN_SUCCESS','user',6,'success',NULL,NULL,'2026-11-03 11:48:16'),(18,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-03 11:48:51'),(19,6,'AUTH_LOGIN_SUCCESS','user',6,'success',NULL,NULL,'2026-11-03 11:49:38'),(20,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-03 11:50:00'),(21,6,'AUTH_LOGIN_SUCCESS','user',6,'success',NULL,NULL,'2026-11-03 11:50:18'),(22,6,'PROFILE_PERMISSION_CHANGED','health_profile',4,'success','{\"accessLevel\": \"view\", \"granteeUserId\": \"3\"}',NULL,'2026-11-03 11:53:13'),(23,6,'PROFILE_PERMISSION_CHANGED','health_profile',4,'success','{\"accessLevel\": \"view\", \"granteeUserId\": \"7\"}',NULL,'2026-11-03 11:53:16'),(24,6,'PROFILE_PERMISSION_CHANGED','health_profile',4,'success','{\"accessLevel\": \"view\", \"granteeUserId\": \"8\"}',NULL,'2026-11-03 11:53:22'),(25,6,'PROFILE_PERMISSION_CHANGED','health_profile',4,'success','{\"accessLevel\": \"view\", \"granteeUserId\": \"9\"}',NULL,'2026-11-03 11:53:26'),(26,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-03 13:15:00'),(27,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-03 13:19:34'),(28,4,'FACILITY_PROFILE_ACCESS','appointment',1,'success',NULL,NULL,'2026-11-03 13:19:42'),(29,1,'AUTH_LOGIN_SUCCESS','user',1,'success',NULL,NULL,'2026-11-03 13:20:11'),(30,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-03 13:47:15'),(31,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-04 10:49:20'),(32,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-04 10:49:41'),(33,1,'AUTH_LOGIN_SUCCESS','user',1,'success',NULL,NULL,'2026-11-04 10:50:02'),(34,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-04 10:50:30'),(35,15,'AUTH_LOGIN_SUCCESS','user',15,'success',NULL,NULL,'2026-11-04 10:51:18'),(36,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-04 10:52:14'),(37,1,'AUTH_LOGIN_SUCCESS','user',1,'success',NULL,NULL,'2026-11-04 11:11:21'),(38,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-04 11:11:32'),(39,NULL,'AUTH_LOGIN_FAILURE','auth',NULL,'denied',NULL,NULL,'2026-11-04 11:12:25'),(40,6,'AUTH_LOGIN_SUCCESS','user',6,'success',NULL,NULL,'2026-11-04 11:12:29'),(41,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-04 11:13:01'),(42,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-04 17:22:28'),(43,1,'AUTH_LOGIN_SUCCESS','user',1,'success',NULL,NULL,'2026-11-04 17:22:47'),(44,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-04 17:23:11'),(45,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-04 17:28:57'),(46,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-04 17:29:09'),(47,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-04 17:33:05'),(48,4,'FACILITY_IDENTITY_CHANGED','facility',1,'success',NULL,NULL,'2026-11-04 17:33:21'),(49,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-04 17:33:29'),(50,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-04 17:34:05'),(51,1,'AUTH_LOGIN_SUCCESS','user',1,'success',NULL,NULL,'2026-11-04 17:34:16'),(52,1,'FACILITY_DOCUMENT_VIEWED','facility_document',1,'success','{\"facilityId\": 1}',NULL,'2026-11-04 17:34:27'),(53,1,'FACILITY_REJECTED','facility',7,'success','{\"reason\": \"Chưa đạt yêu cầu\"}',NULL,'2026-11-04 17:34:51'),(54,1,'FACILITY_APPROVED','facility',1,'success',NULL,NULL,'2026-11-04 17:34:57'),(55,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-04 17:35:09'),(56,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-06 15:36:46'),(57,NULL,'AUTH_LOGIN_FAILURE','auth',NULL,'denied',NULL,NULL,'2026-11-06 15:39:10'),(58,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-06 15:39:21'),(59,4,'FACILITY_PROFILE_ACCESS','appointment',4,'success',NULL,NULL,'2026-11-06 15:40:00'),(60,4,'FACILITY_PROFILE_ACCESS','appointment',4,'success',NULL,NULL,'2026-11-06 15:40:15'),(61,4,'FACILITY_PROFILE_ACCESS','appointment',4,'success',NULL,NULL,'2026-11-06 15:41:29'),(62,4,'VISIT_RESULT_COMPLETED','appointment',4,'success','{\"facilityId\": 1, \"visitResultId\": 1}',NULL,'2026-11-06 15:41:29'),(63,6,'AUTH_LOGIN_SUCCESS','user',6,'success',NULL,NULL,'2026-11-06 15:41:46'),(64,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-06 15:42:15'),(65,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-06 15:42:32'),(66,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-06 15:43:35'),(67,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-06 15:44:07'),(68,2,'AUTH_LOGIN_SUCCESS','user',2,'success',NULL,NULL,'2026-11-07 07:20:19'),(69,1,'AUTH_LOGIN_SUCCESS','user',1,'success',NULL,NULL,'2026-11-07 07:27:16'),(70,4,'AUTH_LOGIN_SUCCESS','user',4,'success',NULL,NULL,'2026-11-07 07:28:24');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `care_notes`
--

DROP TABLE IF EXISTS `care_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `care_notes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `author_user_id` bigint unsigned NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_care_notes_author` (`author_user_id`),
  KEY `idx_care_notes_profile_created` (`health_profile_id`,`created_at`),
  CONSTRAINT `fk_care_notes_author` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_care_notes_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `care_notes`
--

LOCK TABLES `care_notes` WRITE;
/*!40000 ALTER TABLE `care_notes` DISABLE KEYS */;
INSERT INTO `care_notes` VALUES (1,3,2,'Hôm nay hơi sốt nhẹ, cần theo dõi buổi tối.','2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,4,6,'Cần uống bia vào buổi tối','2026-11-03 11:57:18','2026-11-03 11:57:18'),(3,1,2,'Buổi sáng uống thuốc','2026-11-04 17:23:52','2026-11-04 17:23:52');
/*!40000 ALTER TABLE `care_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `care_tasks`
--

DROP TABLE IF EXISTS `care_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `care_tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `task_type` enum('medication','appointment','general') NOT NULL,
  `medication_schedule_id` bigint unsigned DEFAULT NULL,
  `personal_appointment_id` bigint unsigned DEFAULT NULL,
  `title` varchar(180) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `due_at` datetime NOT NULL,
  `status` enum('pending','completed','missed','cancelled') NOT NULL DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `completed_by_user_id` bigint unsigned DEFAULT NULL,
  `completion_note` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_care_task_medication_occurrence` (`medication_schedule_id`,`due_at`),
  UNIQUE KEY `uq_care_task_appointment_occurrence` (`personal_appointment_id`,`due_at`),
  KEY `fk_care_tasks_completer` (`completed_by_user_id`),
  KEY `idx_care_tasks_profile_due_status` (`health_profile_id`,`due_at`,`status`),
  KEY `idx_care_tasks_due_status` (`due_at`,`status`),
  CONSTRAINT `fk_care_tasks_completer` FOREIGN KEY (`completed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_care_tasks_medication_schedule` FOREIGN KEY (`medication_schedule_id`) REFERENCES `medication_schedules` (`id`),
  CONSTRAINT `fk_care_tasks_personal_appointment` FOREIGN KEY (`personal_appointment_id`) REFERENCES `personal_appointments` (`id`),
  CONSTRAINT `fk_care_tasks_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=221 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `care_tasks`
--

LOCK TABLES `care_tasks` WRITE;
/*!40000 ALTER TABLE `care_tasks` DISABLE KEYS */;
INSERT INTO `care_tasks` VALUES (1,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-01 08:00:00','completed','2026-10-31 21:41:07',2,NULL,'2026-10-31 14:37:12','2026-10-31 14:41:07'),(2,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-02 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:12','2026-11-03 10:11:10'),(3,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-03 08:00:00','completed','2026-11-03 20:15:13',2,NULL,'2026-10-31 14:37:12','2026-11-03 13:15:13'),(4,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-04 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:12','2026-11-04 17:21:36'),(5,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-05 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:12','2026-11-06 09:05:00'),(6,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-06 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:12','2026-11-06 17:05:55'),(7,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-07 08:00:00','pending',NULL,NULL,NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(8,1,'appointment',NULL,1,'Lịch khám cá nhân: Tái khám mắt','Phòng khám Mắt Demo','2026-11-03 21:37:12','missed',NULL,NULL,NULL,'2026-10-31 14:37:12','2026-11-04 10:05:00'),(9,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-11 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(10,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-12 08:00:00','completed','2026-10-12 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(11,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-13 08:00:00','completed','2026-10-13 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(12,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-14 08:00:00','completed','2026-10-14 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(13,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-15 08:00:00','completed','2026-10-15 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(14,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-16 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(15,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-17 08:00:00','completed','2026-10-17 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(16,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-18 08:00:00','completed','2026-10-18 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(17,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-19 08:00:00','completed','2026-10-19 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(18,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-20 08:00:00','completed','2026-10-20 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(19,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-21 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(20,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-22 08:00:00','completed','2026-10-22 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(21,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-23 08:00:00','completed','2026-10-23 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(22,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-24 08:00:00','completed','2026-10-24 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(23,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-25 08:00:00','completed','2026-10-25 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(24,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-26 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(25,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-27 08:00:00','completed','2026-10-27 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(26,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-28 08:00:00','completed','2026-10-28 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(27,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-29 08:00:00','completed','2026-10-29 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(28,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-30 08:00:00','completed','2026-10-30 08:15:00',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(29,1,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-31 20:30:00','completed','2026-10-31 21:41:04',2,NULL,'2026-10-31 14:37:13','2026-10-31 14:41:04'),(30,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-11 08:00:00','completed','2026-10-11 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(31,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-12 08:00:00','completed','2026-10-12 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(32,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-13 08:00:00','completed','2026-10-13 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(33,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-14 08:00:00','completed','2026-10-14 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(34,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-15 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(35,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-16 08:00:00','completed','2026-10-16 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(36,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-17 08:00:00','completed','2026-10-17 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(37,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-18 08:00:00','completed','2026-10-18 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(38,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-19 08:00:00','completed','2026-10-19 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(39,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-20 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(40,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-21 08:00:00','completed','2026-10-21 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(41,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-22 08:00:00','completed','2026-10-22 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(42,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-23 08:00:00','completed','2026-10-23 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(43,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-24 08:00:00','completed','2026-10-24 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(44,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-25 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(45,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-26 08:00:00','completed','2026-10-26 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(46,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-27 08:00:00','completed','2026-10-27 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(47,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-28 08:00:00','completed','2026-10-28 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(48,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-29 08:00:00','completed','2026-10-29 08:15:00',3,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(49,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-30 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(50,2,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-31 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-11-03 10:11:10'),(51,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-01 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-11-03 10:11:10'),(52,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-02 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-11-03 10:11:10'),(53,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-03 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-11-04 10:05:00'),(54,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-04 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-11-04 17:21:36'),(55,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-05 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-11-06 09:05:00'),(56,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-06 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-11-06 17:05:55'),(57,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-07 20:30:00','pending',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(58,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-11 08:00:00','completed','2026-10-11 08:15:00',6,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(59,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-12 08:00:00','completed','2026-10-12 08:15:00',6,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(60,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-13 08:00:00','completed','2026-10-13 08:15:00',6,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(61,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-14 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(62,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-15 08:00:00','completed','2026-10-15 08:15:00',6,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(63,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-16 08:00:00','completed','2026-10-16 08:15:00',6,NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(64,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-17 08:00:00','completed','2026-10-17 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(65,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-18 08:00:00','completed','2026-10-18 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(66,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-19 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(67,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-20 08:00:00','completed','2026-10-20 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(68,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-21 08:00:00','completed','2026-10-21 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(69,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-22 08:00:00','completed','2026-10-22 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(70,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-23 08:00:00','completed','2026-10-23 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(71,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-24 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(72,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-25 08:00:00','completed','2026-10-25 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(73,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-26 08:00:00','completed','2026-10-26 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(74,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-27 08:00:00','completed','2026-10-27 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(75,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-28 08:00:00','completed','2026-10-28 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(76,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-29 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(77,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-30 08:00:00','completed','2026-10-30 08:15:00',6,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(78,4,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-31 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-03 10:11:10'),(79,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-01 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-03 10:11:10'),(80,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-02 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-03 10:11:10'),(81,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-03 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-04 10:05:00'),(82,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-04 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-04 17:21:36'),(83,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-05 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-06 09:05:00'),(84,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-06 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-06 17:05:55'),(85,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-07 20:30:00','pending',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(86,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-11 08:00:00','completed','2026-10-11 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(87,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-12 08:00:00','completed','2026-10-12 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(88,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-13 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(89,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-14 08:00:00','completed','2026-10-14 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(90,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-15 08:00:00','completed','2026-10-15 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(91,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-16 08:00:00','completed','2026-10-16 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(92,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-17 08:00:00','completed','2026-10-17 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(93,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-18 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(94,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-19 08:00:00','completed','2026-10-19 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(95,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-20 08:00:00','completed','2026-10-20 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(96,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-21 08:00:00','completed','2026-10-21 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(97,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-22 08:00:00','completed','2026-10-22 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(98,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-23 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(99,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-24 08:00:00','completed','2026-10-24 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(100,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-25 08:00:00','completed','2026-10-25 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(101,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-26 08:00:00','completed','2026-10-26 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(102,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-27 08:00:00','completed','2026-10-27 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(103,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-28 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(104,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-29 08:00:00','completed','2026-10-29 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(105,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-30 08:00:00','completed','2026-10-30 08:15:00',7,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(106,5,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-31 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-03 10:11:10'),(107,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-01 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-03 10:11:10'),(108,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-02 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-03 10:11:10'),(109,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-03 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-04 10:05:00'),(110,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-04 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-04 17:21:36'),(111,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-05 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-06 09:05:00'),(112,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-06 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-11-06 17:05:55'),(113,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-07 20:30:00','pending',NULL,NULL,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(114,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-11 08:00:00','completed','2026-10-11 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(115,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-12 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(116,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-13 08:00:00','completed','2026-10-13 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(117,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-14 08:00:00','completed','2026-10-14 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(118,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-15 08:00:00','completed','2026-10-15 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(119,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-16 08:00:00','completed','2026-10-16 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(120,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-17 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(121,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-18 08:00:00','completed','2026-10-18 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(122,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-19 08:00:00','completed','2026-10-19 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(123,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-20 08:00:00','completed','2026-10-20 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(124,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-21 08:00:00','completed','2026-10-21 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(125,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-22 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(126,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-23 08:00:00','completed','2026-10-23 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(127,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-24 08:00:00','completed','2026-10-24 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(128,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-25 08:00:00','completed','2026-10-25 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(129,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-26 08:00:00','completed','2026-10-26 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(130,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-27 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(131,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-28 08:00:00','completed','2026-10-28 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(132,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-29 08:00:00','completed','2026-10-29 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(133,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-30 08:00:00','completed','2026-10-30 08:15:00',8,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(134,6,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-31 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-03 10:11:10'),(135,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-01 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-03 10:11:10'),(136,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-02 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-03 10:11:10'),(137,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-03 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-04 10:05:00'),(138,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-04 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-04 17:21:36'),(139,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-05 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-06 09:05:00'),(140,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-06 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-06 17:05:55'),(141,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-07 20:30:00','pending',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(142,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-11 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(143,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-12 08:00:00','completed','2026-10-12 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(144,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-13 08:00:00','completed','2026-10-13 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(145,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-14 08:00:00','completed','2026-10-14 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(146,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-15 08:00:00','completed','2026-10-15 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(147,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-16 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(148,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-17 08:00:00','completed','2026-10-17 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(149,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-18 08:00:00','completed','2026-10-18 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(150,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-19 08:00:00','completed','2026-10-19 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(151,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-20 08:00:00','completed','2026-10-20 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(152,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-21 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(153,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-22 08:00:00','completed','2026-10-22 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(154,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-23 08:00:00','completed','2026-10-23 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(155,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-24 08:00:00','completed','2026-10-24 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(156,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-25 08:00:00','completed','2026-10-25 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(157,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-26 08:00:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(158,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-27 08:00:00','completed','2026-10-27 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(159,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-28 08:00:00','completed','2026-10-28 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(160,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-29 08:00:00','completed','2026-10-29 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(161,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-30 08:00:00','completed','2026-10-30 08:15:00',9,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(162,7,'general',NULL,NULL,'Đo chỉ số sức khỏe định kỳ','Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.','2026-10-31 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-03 10:11:10'),(163,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-01 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-03 10:11:10'),(164,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-02 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-03 10:11:10'),(165,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-03 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-04 10:05:00'),(166,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-04 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-04 17:21:36'),(167,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-05 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-06 09:05:00'),(168,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-06 20:30:00','missed',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-11-06 17:05:55'),(169,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-07 20:30:00','pending',NULL,NULL,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(170,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-08 08:00:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(171,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-09 08:00:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(172,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-10 08:00:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(173,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-08 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(174,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-09 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(175,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-10 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(176,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-08 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(177,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-09 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(178,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-10 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(179,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-08 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(180,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-09 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(181,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-10 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(182,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-08 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(183,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-09 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(184,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-10 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(185,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-08 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(186,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-09 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(187,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-10 20:30:00','pending',NULL,NULL,NULL,'2026-11-03 11:05:00','2026-11-03 11:05:00'),(188,4,'medication',7,NULL,'Uống thuốc: Vitamin A','1','2026-11-03 19:00:00','completed','2026-11-03 20:14:40',6,NULL,'2026-11-03 11:59:14','2026-11-03 13:14:40'),(189,4,'medication',7,NULL,'Uống thuốc: Vitamin A','1','2026-11-04 19:00:00','missed',NULL,NULL,NULL,'2026-11-03 11:59:14','2026-11-04 17:21:36'),(190,4,'medication',7,NULL,'Uống thuốc: Vitamin A','1','2026-11-05 19:00:00','missed',NULL,NULL,NULL,'2026-11-03 11:59:14','2026-11-06 09:05:00'),(191,4,'medication',7,NULL,'Uống thuốc: Vitamin A','1','2026-11-06 19:00:00','missed',NULL,NULL,NULL,'2026-11-03 11:59:14','2026-11-06 17:05:55'),(192,4,'medication',7,NULL,'Uống thuốc: Vitamin A','1','2026-11-07 19:00:00','pending',NULL,NULL,NULL,'2026-11-03 11:59:14','2026-11-03 11:59:14'),(193,4,'medication',7,NULL,'Uống thuốc: Vitamin A','1','2026-11-08 19:00:00','pending',NULL,NULL,NULL,'2026-11-03 11:59:14','2026-11-03 11:59:14'),(194,4,'medication',7,NULL,'Uống thuốc: Vitamin A','1','2026-11-09 19:00:00','pending',NULL,NULL,NULL,'2026-11-03 11:59:14','2026-11-03 11:59:14'),(195,4,'medication',7,NULL,'Uống thuốc: Vitamin A','1','2026-11-10 19:00:00','pending',NULL,NULL,NULL,'2026-11-03 11:59:14','2026-11-03 11:59:14'),(196,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-11 08:00:00','pending',NULL,NULL,NULL,'2026-11-04 10:05:00','2026-11-04 10:05:00'),(197,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-11 20:30:00','pending',NULL,NULL,NULL,'2026-11-04 10:05:00','2026-11-04 10:05:00'),(198,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-11 20:30:00','pending',NULL,NULL,NULL,'2026-11-04 10:05:00','2026-11-04 10:05:00'),(199,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-11 20:30:00','pending',NULL,NULL,NULL,'2026-11-04 10:05:00','2026-11-04 10:05:00'),(200,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-11 20:30:00','pending',NULL,NULL,NULL,'2026-11-04 10:05:00','2026-11-04 10:05:00'),(201,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-11 20:30:00','pending',NULL,NULL,NULL,'2026-11-04 10:05:00','2026-11-04 10:05:00'),(202,1,'appointment',NULL,2,'Lịch khám cá nhân: Tái khám mắt','Bệnh Viện mắt','2026-11-06 06:30:00','completed','2026-11-06 22:37:01',2,NULL,'2026-11-04 17:30:28','2026-11-06 15:37:01'),(203,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-12 08:00:00','pending',NULL,NULL,NULL,'2026-11-05 04:05:00','2026-11-05 04:05:00'),(204,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-12 20:30:00','pending',NULL,NULL,NULL,'2026-11-05 04:05:00','2026-11-05 04:05:00'),(205,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-12 20:30:00','pending',NULL,NULL,NULL,'2026-11-05 04:05:00','2026-11-05 04:05:00'),(206,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-12 20:30:00','pending',NULL,NULL,NULL,'2026-11-05 04:05:00','2026-11-05 04:05:00'),(207,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-12 20:30:00','pending',NULL,NULL,NULL,'2026-11-05 04:05:00','2026-11-05 04:05:00'),(208,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-12 20:30:00','pending',NULL,NULL,NULL,'2026-11-05 04:05:00','2026-11-05 04:05:00'),(209,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-13 08:00:00','pending',NULL,NULL,NULL,'2026-11-06 09:05:00','2026-11-06 09:05:00'),(210,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-13 20:30:00','pending',NULL,NULL,NULL,'2026-11-06 09:05:00','2026-11-06 09:05:00'),(211,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-13 20:30:00','pending',NULL,NULL,NULL,'2026-11-06 09:05:00','2026-11-06 09:05:00'),(212,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-13 20:30:00','pending',NULL,NULL,NULL,'2026-11-06 09:05:00','2026-11-06 09:05:00'),(213,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-13 20:30:00','pending',NULL,NULL,NULL,'2026-11-06 09:05:00','2026-11-06 09:05:00'),(214,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-13 20:30:00','pending',NULL,NULL,NULL,'2026-11-06 09:05:00','2026-11-06 09:05:00'),(215,1,'medication',1,NULL,'Uống thuốc: Vitamin D','1 viên','2026-11-14 08:00:00','pending',NULL,NULL,NULL,'2026-11-07 06:05:00','2026-11-07 06:05:00'),(216,2,'medication',2,NULL,'Uống thuốc: Vitamin B1','1 viên','2026-11-14 20:30:00','pending',NULL,NULL,NULL,'2026-11-07 06:05:00','2026-11-07 06:05:00'),(217,4,'medication',3,NULL,'Uống thuốc: Canxi','1 viên','2026-11-14 20:30:00','pending',NULL,NULL,NULL,'2026-11-07 06:05:00','2026-11-07 06:05:00'),(218,5,'medication',4,NULL,'Uống thuốc: Omega-3','1 viên','2026-11-14 20:30:00','pending',NULL,NULL,NULL,'2026-11-07 06:05:00','2026-11-07 06:05:00'),(219,6,'medication',5,NULL,'Uống thuốc: Vitamin C','1 viên','2026-11-14 20:30:00','pending',NULL,NULL,NULL,'2026-11-07 06:05:00','2026-11-07 06:05:00'),(220,7,'medication',6,NULL,'Uống thuốc: Sắt','1 viên','2026-11-14 20:30:00','pending',NULL,NULL,NULL,'2026-11-07 06:05:00','2026-11-07 06:05:00');
/*!40000 ALTER TABLE `care_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facilities`
--

DROP TABLE IF EXISTS `facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facilities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `facility_name` varchar(180) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `specialty` varchar(180) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `description` text,
  `license_number` varchar(100) NOT NULL,
  `verification_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by_user_id` bigint unsigned DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_facilities_user` (`user_id`),
  UNIQUE KEY `uq_facilities_license_number` (`license_number`),
  KEY `fk_facilities_reviewer` (`reviewed_by_user_id`),
  KEY `idx_facilities_verification_status` (`verification_status`),
  CONSTRAINT `fk_facilities_reviewer` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_facilities_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facilities`
--

LOCK TABLES `facilities` WRITE;
/*!40000 ALTER TABLE `facilities` DISABLE KEYS */;
INSERT INTO `facilities` VALUES (1,4,'Phòng khám Nhi Hòa Bình','Hà Nội','Khoa Nhi',NULL,'Cơ sở y tế mô phỏng chuyên khoa Nhi.','GP-DEMO-001','approved','2026-11-05 00:34:57',1,NULL,'2026-10-31 14:37:12','2026-11-04 17:34:57'),(2,5,'Phòng khám An Khang','Hà Nội',NULL,'024 0000 0000','Cơ sở đang chờ xác minh.','GP-PENDING-001','pending',NULL,NULL,NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(3,10,'Phòng khám Gia Đình Sông Hồng','Hà Nội (dữ liệu mô phỏng)',NULL,'024 0000 0000','Cơ sở y tế mô phỏng phục vụ kiểm thử Carely V4.','GP-DEMO-002','approved','2026-10-31 21:37:15',1,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(4,11,'Phòng khám Đa khoa Bình An','Hà Nội (dữ liệu mô phỏng)',NULL,'024 0000 0000','Cơ sở y tế mô phỏng phục vụ kiểm thử Carely V4.','GP-DEMO-003','approved','2026-10-31 21:37:16',1,NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(5,12,'Trung tâm Chăm sóc Sức khỏe Minh Tâm','Hà Nội (dữ liệu mô phỏng)',NULL,'024 0000 0000','Cơ sở y tế mô phỏng phục vụ kiểm thử Carely V4.','GP-DEMO-004','approved','2026-10-31 21:37:16',1,NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(6,13,'Phòng khám Nội khoa Ánh Dương','Hà Nội (dữ liệu mô phỏng)',NULL,'024 0000 0000','Cơ sở y tế mô phỏng phục vụ kiểm thử Carely V4.','GP-DEMO-005','approved','2026-10-31 21:37:16',1,NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(7,14,'Phòng khám Phú Thịnh','Hà Nội (dữ liệu mô phỏng)',NULL,'024 0000 0000','Cơ sở y tế mô phỏng phục vụ kiểm thử Carely V4.','GP-PENDING-002','rejected','2026-11-05 00:34:51',1,'Chưa đạt yêu cầu','2026-10-31 14:37:16','2026-11-04 17:34:51');
/*!40000 ALTER TABLE `facilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facility_documents`
--

DROP TABLE IF EXISTS `facility_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facility_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `facility_id` bigint unsigned NOT NULL,
  `uploaded_by_user_id` bigint unsigned NOT NULL,
  `document_type` enum('operating_license','other') NOT NULL DEFAULT 'operating_license',
  `original_name` varchar(255) NOT NULL,
  `storage_key` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size_bytes` bigint unsigned NOT NULL,
  `sha256` char(64) NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_facility_documents_storage_key` (`storage_key`),
  KEY `fk_facility_documents_uploader` (`uploaded_by_user_id`),
  KEY `idx_facility_documents_facility_type` (`facility_id`,`document_type`,`uploaded_at`),
  CONSTRAINT `fk_facility_documents_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`),
  CONSTRAINT `fk_facility_documents_uploader` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_facility_documents_size` CHECK ((`size_bytes` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facility_documents`
--

LOCK TABLES `facility_documents` WRITE;
/*!40000 ALTER TABLE `facility_documents` DISABLE KEYS */;
INSERT INTO `facility_documents` VALUES (1,1,4,'operating_license','giay-phep-hoat-dong-demo.pdf','seed-1-giay-phep-hoat-dong-demo.pdf','application/pdf',90,'531f46358e2d9cf8b643002f58b54c3462ceb1900b2d6e730bcc87d321094763','2026-10-31 21:37:12'),(2,2,5,'operating_license','giay-phep-an-khang-demo.pdf','seed-2-giay-phep-an-khang-demo.pdf','application/pdf',90,'531f46358e2d9cf8b643002f58b54c3462ceb1900b2d6e730bcc87d321094763','2026-10-31 21:37:12'),(3,3,10,'operating_license','GIAY-PHEP-MO-PHONG-KHONG-CO-GIA-TRI.pdf','carely-v4-demo-3.pdf','application/pdf',22829,'d7653a914cf111d5b3daf3342f3292242fb5cc003b66023f61ecd4f84595709c','2026-10-31 21:37:15'),(4,4,11,'operating_license','GIAY-PHEP-MO-PHONG-KHONG-CO-GIA-TRI.pdf','carely-v4-demo-4.pdf','application/pdf',22829,'d7653a914cf111d5b3daf3342f3292242fb5cc003b66023f61ecd4f84595709c','2026-10-31 21:37:16'),(5,5,12,'operating_license','GIAY-PHEP-MO-PHONG-KHONG-CO-GIA-TRI.pdf','carely-v4-demo-5.pdf','application/pdf',22829,'d7653a914cf111d5b3daf3342f3292242fb5cc003b66023f61ecd4f84595709c','2026-10-31 21:37:16'),(6,6,13,'operating_license','GIAY-PHEP-MO-PHONG-KHONG-CO-GIA-TRI.pdf','carely-v4-demo-6.pdf','application/pdf',22829,'d7653a914cf111d5b3daf3342f3292242fb5cc003b66023f61ecd4f84595709c','2026-10-31 21:37:16'),(7,7,14,'operating_license','GIAY-PHEP-MO-PHONG-KHONG-CO-GIA-TRI.pdf','carely-v4-demo-7.pdf','application/pdf',22829,'d7653a914cf111d5b3daf3342f3292242fb5cc003b66023f61ecd4f84595709c','2026-10-31 21:37:16');
/*!40000 ALTER TABLE `facility_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `families`
--

DROP TABLE IF EXISTS `families`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `families` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `owner_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_families_owner` (`owner_user_id`),
  CONSTRAINT `fk_families_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `families`
--

LOCK TABLES `families` WRITE;
/*!40000 ALTER TABLE `families` DISABLE KEYS */;
INSERT INTO `families` VALUES (1,'Gia đình Carely Demo',2,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,'Gia đình Carely Demo 2',15,'2026-11-03 10:15:49','2026-11-03 10:15:49');
/*!40000 ALTER TABLE `families` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family_invites`
--

DROP TABLE IF EXISTS `family_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family_invites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `family_id` bigint unsigned NOT NULL,
  `code` varchar(64) NOT NULL,
  `created_by_user_id` bigint unsigned NOT NULL,
  `expires_at` datetime NOT NULL,
  `status` enum('active','revoked') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_family_invites_code` (`code`),
  KEY `fk_family_invites_creator` (`created_by_user_id`),
  KEY `idx_family_invites_family_status_expiry` (`family_id`,`status`,`expires_at`),
  CONSTRAINT `fk_family_invites_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_family_invites_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family_invites`
--

LOCK TABLES `family_invites` WRITE;
/*!40000 ALTER TABLE `family_invites` DISABLE KEYS */;
INSERT INTO `family_invites` VALUES (1,1,'54C83937CEDBBAA5',2,'2026-11-05 17:52:36','revoked','2026-11-04 10:52:36');
/*!40000 ALTER TABLE `family_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family_join_requests`
--

DROP TABLE IF EXISTS `family_join_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family_join_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `invite_id` bigint unsigned NOT NULL,
  `status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by_user_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_join_requests_reviewer` (`reviewed_by_user_id`),
  KEY `idx_join_requests_invite_status` (`invite_id`,`status`),
  KEY `idx_join_requests_user_status` (`user_id`,`status`),
  CONSTRAINT `fk_join_requests_invite` FOREIGN KEY (`invite_id`) REFERENCES `family_invites` (`id`),
  CONSTRAINT `fk_join_requests_reviewer` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_join_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family_join_requests`
--

LOCK TABLES `family_join_requests` WRITE;
/*!40000 ALTER TABLE `family_join_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `family_join_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health_metric_records`
--

DROP TABLE IF EXISTS `health_metric_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_metric_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `metric_type_id` bigint unsigned NOT NULL,
  `measured_at` datetime NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `created_by_user_id` bigint unsigned NOT NULL,
  `is_alert` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_metric_records_type` (`metric_type_id`),
  KEY `fk_metric_records_creator` (`created_by_user_id`),
  KEY `idx_metric_records_profile_type_time` (`health_profile_id`,`metric_type_id`,`measured_at`),
  CONSTRAINT `fk_metric_records_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_metric_records_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`),
  CONSTRAINT `fk_metric_records_type` FOREIGN KEY (`metric_type_id`) REFERENCES `metric_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=506 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health_metric_records`
--

LOCK TABLES `health_metric_records` WRITE;
/*!40000 ALTER TABLE `health_metric_records` DISABLE KEYS */;
INSERT INTO `health_metric_records` VALUES (1,1,1,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(2,1,3,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(3,1,2,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(4,1,4,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(5,1,1,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(6,1,3,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(7,1,2,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(8,1,4,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(9,1,1,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(10,1,3,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(11,1,2,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(12,1,4,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(13,1,1,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(14,1,3,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(15,1,2,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(16,1,4,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(17,1,1,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(18,1,3,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(19,1,2,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(20,1,4,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(21,1,1,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(22,1,3,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(23,1,2,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(24,1,4,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(25,1,1,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(26,1,3,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(27,1,2,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(28,1,4,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(29,1,1,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(30,1,3,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(31,1,2,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(32,1,4,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(33,1,1,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(34,1,3,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(35,1,2,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(36,1,4,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(37,1,1,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(38,1,3,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(39,1,2,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(40,1,4,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(41,1,1,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(42,1,3,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:12'),(43,1,2,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(44,1,4,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(45,1,1,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(46,1,3,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(47,1,2,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(48,1,4,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(49,1,1,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(50,1,3,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(51,1,2,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(52,1,4,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(53,1,1,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(54,1,3,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(55,1,2,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(56,1,4,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(57,1,1,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(58,1,3,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(59,1,2,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(60,1,4,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(61,1,1,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(62,1,3,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(63,1,2,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(64,1,4,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(65,1,1,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(66,1,3,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(67,1,2,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(68,1,4,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(69,1,1,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(70,1,3,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(71,1,2,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(72,1,4,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(73,1,1,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(74,1,3,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(75,1,2,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(76,1,4,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(77,1,1,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(78,1,3,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(79,1,2,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(80,1,4,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(81,1,1,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(82,1,3,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(83,1,2,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(84,1,4,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',2,0,'2026-10-31 14:37:13'),(85,2,1,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(86,2,3,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(87,2,2,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(88,2,4,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(89,2,1,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(90,2,3,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(91,2,2,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(92,2,4,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(93,2,1,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(94,2,3,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(95,2,2,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(96,2,4,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(97,2,1,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(98,2,3,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(99,2,2,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(100,2,4,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(101,2,1,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(102,2,3,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(103,2,2,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(104,2,4,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(105,2,1,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(106,2,3,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(107,2,2,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(108,2,4,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(109,2,1,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(110,2,3,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(111,2,2,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(112,2,4,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(113,2,1,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(114,2,3,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(115,2,2,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(116,2,4,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(117,2,1,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(118,2,3,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(119,2,2,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(120,2,4,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(121,2,1,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(122,2,3,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(123,2,2,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(124,2,4,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(125,2,1,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(126,2,3,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(127,2,2,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(128,2,4,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(129,2,1,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(130,2,3,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(131,2,2,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(132,2,4,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(133,2,1,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(134,2,3,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(135,2,2,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(136,2,4,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(137,2,1,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(138,2,3,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(139,2,2,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(140,2,4,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(141,2,1,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(142,2,3,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(143,2,2,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(144,2,4,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(145,2,1,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(146,2,3,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(147,2,2,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(148,2,4,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(149,2,1,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(150,2,3,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(151,2,2,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(152,2,4,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(153,2,1,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(154,2,3,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(155,2,2,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(156,2,4,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(157,2,1,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(158,2,3,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(159,2,2,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(160,2,4,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(161,2,1,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(162,2,3,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(163,2,2,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(164,2,4,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(165,2,1,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(166,2,3,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(167,2,2,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(168,2,4,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',3,0,'2026-10-31 14:37:13'),(169,4,1,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(170,4,3,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(171,4,2,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(172,4,4,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(173,4,1,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(174,4,3,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(175,4,2,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(176,4,4,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(177,4,1,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(178,4,3,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(179,4,2,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(180,4,4,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(181,4,1,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(182,4,3,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(183,4,2,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(184,4,4,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(185,4,1,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(186,4,3,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(187,4,2,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(188,4,4,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(189,4,1,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(190,4,3,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(191,4,2,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(192,4,4,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(193,4,1,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(194,4,3,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(195,4,2,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(196,4,4,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(197,4,1,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(198,4,3,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(199,4,2,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(200,4,4,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(201,4,1,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(202,4,3,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(203,4,2,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(204,4,4,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(205,4,1,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(206,4,3,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(207,4,2,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(208,4,4,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(209,4,1,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(210,4,3,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(211,4,2,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(212,4,4,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(213,4,1,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(214,4,3,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(215,4,2,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(216,4,4,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(217,4,1,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(218,4,3,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(219,4,2,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(220,4,4,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(221,4,1,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(222,4,3,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(223,4,2,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(224,4,4,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(225,4,1,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(226,4,3,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(227,4,2,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(228,4,4,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(229,4,1,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(230,4,3,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(231,4,2,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(232,4,4,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(233,4,1,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(234,4,3,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(235,4,2,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(236,4,4,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(237,4,1,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(238,4,3,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(239,4,2,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(240,4,4,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(241,4,1,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(242,4,3,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(243,4,2,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(244,4,4,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(245,4,1,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(246,4,3,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(247,4,2,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(248,4,4,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(249,4,1,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(250,4,3,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(251,4,2,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(252,4,4,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',6,0,'2026-10-31 14:37:13'),(253,5,1,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(254,5,3,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(255,5,2,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(256,5,4,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(257,5,1,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(258,5,3,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(259,5,2,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(260,5,4,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(261,5,1,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(262,5,3,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(263,5,2,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(264,5,4,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(265,5,1,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(266,5,3,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(267,5,2,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(268,5,4,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(269,5,1,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(270,5,3,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(271,5,2,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(272,5,4,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(273,5,1,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(274,5,3,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(275,5,2,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(276,5,4,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(277,5,1,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(278,5,3,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(279,5,2,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(280,5,4,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(281,5,1,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(282,5,3,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(283,5,2,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(284,5,4,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(285,5,1,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(286,5,3,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(287,5,2,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(288,5,4,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(289,5,1,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(290,5,3,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(291,5,2,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(292,5,4,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(293,5,1,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(294,5,3,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(295,5,2,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(296,5,4,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(297,5,1,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(298,5,3,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(299,5,2,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(300,5,4,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(301,5,1,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(302,5,3,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(303,5,2,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(304,5,4,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(305,5,1,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(306,5,3,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(307,5,2,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(308,5,4,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(309,5,1,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(310,5,3,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(311,5,2,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(312,5,4,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(313,5,1,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(314,5,3,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(315,5,2,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(316,5,4,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(317,5,1,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(318,5,3,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(319,5,2,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(320,5,4,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(321,5,1,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(322,5,3,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(323,5,2,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(324,5,4,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(325,5,1,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(326,5,3,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(327,5,2,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(328,5,4,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(329,5,1,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(330,5,3,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(331,5,2,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(332,5,4,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(333,5,1,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(334,5,3,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(335,5,2,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(336,5,4,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',7,0,'2026-10-31 14:37:14'),(337,6,1,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(338,6,3,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(339,6,2,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(340,6,4,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(341,6,1,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(342,6,3,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(343,6,2,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(344,6,4,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(345,6,1,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(346,6,3,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(347,6,2,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(348,6,4,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(349,6,1,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(350,6,3,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(351,6,2,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(352,6,4,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(353,6,1,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(354,6,3,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(355,6,2,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(356,6,4,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(357,6,1,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(358,6,3,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(359,6,2,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(360,6,4,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(361,6,1,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(362,6,3,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(363,6,2,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(364,6,4,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(365,6,1,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(366,6,3,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(367,6,2,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(368,6,4,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(369,6,1,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(370,6,3,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(371,6,2,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(372,6,4,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(373,6,1,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(374,6,3,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(375,6,2,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(376,6,4,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(377,6,1,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(378,6,3,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(379,6,2,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(380,6,4,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(381,6,1,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(382,6,3,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(383,6,2,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(384,6,4,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(385,6,1,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(386,6,3,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(387,6,2,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(388,6,4,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(389,6,1,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(390,6,3,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(391,6,2,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(392,6,4,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(393,6,1,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(394,6,3,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(395,6,2,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(396,6,4,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(397,6,1,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(398,6,3,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(399,6,2,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(400,6,4,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(401,6,1,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(402,6,3,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(403,6,2,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(404,6,4,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(405,6,1,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:14'),(406,6,3,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(407,6,2,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(408,6,4,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',8,1,'2026-10-31 14:37:15'),(409,6,1,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(410,6,3,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(411,6,2,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(412,6,4,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(413,6,1,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(414,6,3,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(415,6,2,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(416,6,4,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(417,6,1,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(418,6,3,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(419,6,2,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(420,6,4,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',8,0,'2026-10-31 14:37:15'),(421,7,1,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(422,7,3,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(423,7,2,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(424,7,4,'2026-10-11 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(425,7,1,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(426,7,3,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(427,7,2,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(428,7,4,'2026-10-12 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(429,7,1,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(430,7,3,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(431,7,2,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(432,7,4,'2026-10-13 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(433,7,1,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(434,7,3,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(435,7,2,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(436,7,4,'2026-10-14 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(437,7,1,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(438,7,3,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(439,7,2,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(440,7,4,'2026-10-15 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(441,7,1,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(442,7,3,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(443,7,2,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(444,7,4,'2026-10-16 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(445,7,1,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(446,7,3,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(447,7,2,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(448,7,4,'2026-10-17 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(449,7,1,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(450,7,3,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(451,7,2,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(452,7,4,'2026-10-18 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(453,7,1,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(454,7,3,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(455,7,2,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(456,7,4,'2026-10-19 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(457,7,1,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(458,7,3,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',9,1,'2026-10-31 14:37:15'),(459,7,2,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(460,7,4,'2026-10-20 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(461,7,1,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(462,7,3,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(463,7,2,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(464,7,4,'2026-10-21 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(465,7,1,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(466,7,3,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(467,7,2,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(468,7,4,'2026-10-22 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(469,7,1,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(470,7,3,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(471,7,2,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(472,7,4,'2026-10-23 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(473,7,1,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',9,1,'2026-10-31 14:37:15'),(474,7,3,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(475,7,2,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(476,7,4,'2026-10-24 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(477,7,1,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(478,7,3,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(479,7,2,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(480,7,4,'2026-10-25 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(481,7,1,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(482,7,3,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(483,7,2,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(484,7,4,'2026-10-26 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(485,7,1,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(486,7,3,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(487,7,2,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(488,7,4,'2026-10-27 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(489,7,1,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(490,7,3,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(491,7,2,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(492,7,4,'2026-10-28 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(493,7,1,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(494,7,3,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(495,7,2,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(496,7,4,'2026-10-29 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(497,7,1,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(498,7,3,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(499,7,2,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(500,7,4,'2026-10-30 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(501,7,1,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(502,7,3,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(503,7,2,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(504,7,4,'2026-10-31 09:00:00','CARELY_V4_DEMO_21D',9,0,'2026-10-31 14:37:15'),(505,4,1,'2026-11-03 18:55:00',NULL,6,0,'2026-11-03 11:55:18');
/*!40000 ALTER TABLE `health_metric_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health_metric_values`
--

DROP TABLE IF EXISTS `health_metric_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_metric_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `metric_record_id` bigint unsigned NOT NULL,
  `component_id` bigint unsigned NOT NULL,
  `numeric_value` decimal(12,4) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_metric_record_component` (`metric_record_id`,`component_id`),
  KEY `fk_metric_values_component` (`component_id`),
  CONSTRAINT `fk_metric_values_component` FOREIGN KEY (`component_id`) REFERENCES `metric_components` (`id`),
  CONSTRAINT `fk_metric_values_record` FOREIGN KEY (`metric_record_id`) REFERENCES `health_metric_records` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=633 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health_metric_values`
--

LOCK TABLES `health_metric_values` WRITE;
/*!40000 ALTER TABLE `health_metric_values` DISABLE KEYS */;
INSERT INTO `health_metric_values` VALUES (1,1,2,67.0000),(2,1,1,103.0000),(3,2,4,60.0000),(4,3,3,55.5000),(5,4,5,36.2000),(6,5,2,69.0000),(7,5,1,107.0000),(8,6,4,64.0000),(9,7,3,55.7000),(10,8,5,36.3000),(11,9,2,71.0000),(12,9,1,111.0000),(13,10,4,68.0000),(14,11,3,55.8000),(15,12,5,36.5000),(16,13,2,73.0000),(17,13,1,115.0000),(18,14,4,72.0000),(19,15,3,55.9000),(20,16,5,36.7000),(21,17,2,75.0000),(22,17,1,119.0000),(23,18,4,76.0000),(24,19,3,56.1000),(25,20,5,36.8000),(26,21,2,68.0000),(27,21,1,105.0000),(28,22,4,62.0000),(29,23,3,55.7000),(30,24,5,36.3000),(31,25,2,70.0000),(32,25,1,109.0000),(33,26,4,66.0000),(34,27,3,55.8000),(35,28,5,36.4000),(36,29,2,72.0000),(37,29,1,113.0000),(38,30,4,70.0000),(39,31,3,56.0000),(40,32,5,36.6000),(41,33,2,74.0000),(42,33,1,117.0000),(43,34,4,74.0000),(44,35,3,56.1000),(45,36,5,36.7000),(46,37,2,67.0000),(47,37,1,103.0000),(48,38,4,86.0000),(49,39,3,55.8000),(50,40,5,36.2000),(51,41,2,69.0000),(52,41,1,107.0000),(53,42,4,64.0000),(54,43,3,55.9000),(55,44,5,36.3000),(56,45,2,71.0000),(57,45,1,111.0000),(58,46,4,68.0000),(59,47,3,56.0000),(60,48,5,36.5000),(61,49,2,73.0000),(62,49,1,115.0000),(63,50,4,72.0000),(64,51,3,56.2000),(65,52,5,36.7000),(66,53,2,86.0000),(67,53,1,138.0000),(68,54,4,76.0000),(69,55,3,56.3000),(70,56,5,36.8000),(71,57,2,68.0000),(72,57,1,105.0000),(73,58,4,62.0000),(74,59,3,55.9000),(75,60,5,36.3000),(76,61,2,70.0000),(77,61,1,109.0000),(78,62,4,66.0000),(79,63,3,56.1000),(80,64,5,36.4000),(81,65,2,72.0000),(82,65,1,113.0000),(83,66,4,70.0000),(84,67,3,56.2000),(85,68,5,36.6000),(86,69,2,74.0000),(87,69,1,117.0000),(88,70,4,74.0000),(89,71,3,56.3000),(90,72,5,37.8000),(91,73,2,67.0000),(92,73,1,103.0000),(93,74,4,60.0000),(94,75,3,56.0000),(95,76,5,36.2000),(96,77,2,69.0000),(97,77,1,107.0000),(98,78,4,64.0000),(99,79,3,56.1000),(100,80,5,36.3000),(101,81,2,71.0000),(102,81,1,111.0000),(103,82,4,68.0000),(104,83,3,56.3000),(105,84,5,36.5000),(106,85,2,75.0000),(107,85,1,120.0000),(108,86,4,76.0000),(109,87,3,60.0000),(110,88,5,36.7000),(111,89,2,68.0000),(112,89,1,106.0000),(113,90,4,62.0000),(114,91,3,59.7000),(115,92,5,36.2000),(116,93,2,70.0000),(117,93,1,110.0000),(118,94,4,66.0000),(119,95,3,59.8000),(120,96,5,36.3000),(121,97,2,72.0000),(122,97,1,114.0000),(123,98,4,70.0000),(124,99,3,59.9000),(125,100,5,36.5000),(126,101,2,74.0000),(127,101,1,118.0000),(128,102,4,74.0000),(129,103,3,60.1000),(130,104,5,36.7000),(131,105,2,76.0000),(132,105,1,122.0000),(133,106,4,78.0000),(134,107,3,60.2000),(135,108,5,36.8000),(136,109,2,69.0000),(137,109,1,108.0000),(138,110,4,64.0000),(139,111,3,59.8000),(140,112,5,36.3000),(141,113,2,71.0000),(142,113,1,112.0000),(143,114,4,68.0000),(144,115,3,60.0000),(145,116,5,36.4000),(146,117,2,73.0000),(147,117,1,116.0000),(148,118,4,72.0000),(149,119,3,60.1000),(150,120,5,36.6000),(151,121,2,75.0000),(152,121,1,120.0000),(153,122,4,102.0000),(154,123,3,60.2000),(155,124,5,36.7000),(156,125,2,68.0000),(157,125,1,106.0000),(158,126,4,62.0000),(159,127,3,59.9000),(160,128,5,36.2000),(161,129,2,70.0000),(162,129,1,110.0000),(163,130,4,66.0000),(164,131,3,60.0000),(165,132,5,36.3000),(166,133,2,72.0000),(167,133,1,114.0000),(168,134,4,70.0000),(169,135,3,60.1000),(170,136,5,36.5000),(171,137,2,85.0000),(172,137,1,137.0000),(173,138,4,74.0000),(174,139,3,60.3000),(175,140,5,36.7000),(176,141,2,76.0000),(177,141,1,122.0000),(178,142,4,78.0000),(179,143,3,60.4000),(180,144,5,36.8000),(181,145,2,69.0000),(182,145,1,108.0000),(183,146,4,64.0000),(184,147,3,60.1000),(185,148,5,36.3000),(186,149,2,71.0000),(187,149,1,112.0000),(188,150,4,68.0000),(189,151,3,60.2000),(190,152,5,36.4000),(191,153,2,73.0000),(192,153,1,116.0000),(193,154,4,72.0000),(194,155,3,60.3000),(195,156,5,37.7000),(196,157,2,75.0000),(197,157,1,120.0000),(198,158,4,76.0000),(199,159,3,60.5000),(200,160,5,36.7000),(201,161,2,68.0000),(202,161,1,106.0000),(203,162,4,62.0000),(204,163,3,60.1000),(205,164,5,36.2000),(206,165,2,70.0000),(207,165,1,110.0000),(208,166,4,66.0000),(209,167,3,60.2000),(210,168,5,36.3000),(211,169,2,74.0000),(212,169,1,119.0000),(213,170,4,74.0000),(214,171,3,64.0000),(215,172,5,36.6000),(216,173,2,76.0000),(217,173,1,123.0000),(218,174,4,78.0000),(219,175,3,64.1000),(220,176,5,36.7000),(221,177,2,69.0000),(222,177,1,109.0000),(223,178,4,64.0000),(224,179,3,63.8000),(225,180,5,36.2000),(226,181,2,71.0000),(227,181,1,113.0000),(228,182,4,68.0000),(229,183,3,63.9000),(230,184,5,36.3000),(231,185,2,73.0000),(232,185,1,117.0000),(233,186,4,72.0000),(234,187,3,64.0000),(235,188,5,36.5000),(236,189,2,75.0000),(237,189,1,121.0000),(238,190,4,76.0000),(239,191,3,64.2000),(240,192,5,36.7000),(241,193,2,77.0000),(242,193,1,125.0000),(243,194,4,80.0000),(244,195,3,64.3000),(245,196,5,36.8000),(246,197,2,70.0000),(247,197,1,111.0000),(248,198,4,66.0000),(249,199,3,64.0000),(250,200,5,36.3000),(251,201,2,72.0000),(252,201,1,115.0000),(253,202,4,70.0000),(254,203,3,64.1000),(255,204,5,36.4000),(256,205,2,74.0000),(257,205,1,119.0000),(258,206,4,100.0000),(259,207,3,64.2000),(260,208,5,36.6000),(261,209,2,76.0000),(262,209,1,123.0000),(263,210,4,78.0000),(264,211,3,64.4000),(265,212,5,36.7000),(266,213,2,69.0000),(267,213,1,109.0000),(268,214,4,64.0000),(269,215,3,64.0000),(270,216,5,36.2000),(271,217,2,71.0000),(272,217,1,113.0000),(273,218,4,68.0000),(274,219,3,64.1000),(275,220,5,36.3000),(276,221,2,84.0000),(277,221,1,136.0000),(278,222,4,72.0000),(279,223,3,64.3000),(280,224,5,36.5000),(281,225,2,75.0000),(282,225,1,121.0000),(283,226,4,76.0000),(284,227,3,64.4000),(285,228,5,36.7000),(286,229,2,77.0000),(287,229,1,125.0000),(288,230,4,80.0000),(289,231,3,64.5000),(290,232,5,36.8000),(291,233,2,70.0000),(292,233,1,111.0000),(293,234,4,66.0000),(294,235,3,64.2000),(295,236,5,36.3000),(296,237,2,72.0000),(297,237,1,115.0000),(298,238,4,70.0000),(299,239,3,64.3000),(300,240,5,37.5000),(301,241,2,74.0000),(302,241,1,119.0000),(303,242,4,74.0000),(304,243,3,64.5000),(305,244,5,36.6000),(306,245,2,76.0000),(307,245,1,123.0000),(308,246,4,78.0000),(309,247,3,64.6000),(310,248,5,36.7000),(311,249,2,69.0000),(312,249,1,109.0000),(313,250,4,64.0000),(314,251,3,64.2000),(315,252,5,36.2000),(316,253,2,73.0000),(317,253,1,118.0000),(318,254,4,72.0000),(319,255,3,68.0000),(320,256,5,36.4000),(321,257,2,75.0000),(322,257,1,122.0000),(323,258,4,76.0000),(324,259,3,68.1000),(325,260,5,36.6000),(326,261,2,77.0000),(327,261,1,126.0000),(328,262,4,80.0000),(329,263,3,68.3000),(330,264,5,36.7000),(331,265,2,70.0000),(332,265,1,112.0000),(333,266,4,66.0000),(334,267,3,67.9000),(335,268,5,36.2000),(336,269,2,72.0000),(337,269,1,116.0000),(338,270,4,70.0000),(339,271,3,68.0000),(340,272,5,36.3000),(341,273,2,74.0000),(342,273,1,120.0000),(343,274,4,74.0000),(344,275,3,68.2000),(345,276,5,36.5000),(346,277,2,76.0000),(347,277,1,124.0000),(348,278,4,78.0000),(349,279,3,68.3000),(350,280,5,36.7000),(351,281,2,78.0000),(352,281,1,128.0000),(353,282,4,82.0000),(354,283,3,68.4000),(355,284,5,36.8000),(356,285,2,71.0000),(357,285,1,114.0000),(358,286,4,68.0000),(359,287,3,68.1000),(360,288,5,36.3000),(361,289,2,73.0000),(362,289,1,118.0000),(363,290,4,98.0000),(364,291,3,68.2000),(365,292,5,36.4000),(366,293,2,75.0000),(367,293,1,122.0000),(368,294,4,76.0000),(369,295,3,68.4000),(370,296,5,36.6000),(371,297,2,77.0000),(372,297,1,126.0000),(373,298,4,80.0000),(374,299,3,68.5000),(375,300,5,36.7000),(376,301,2,70.0000),(377,301,1,112.0000),(378,302,4,66.0000),(379,303,3,68.1000),(380,304,5,36.2000),(381,305,2,83.0000),(382,305,1,135.0000),(383,306,4,70.0000),(384,307,3,68.3000),(385,308,5,36.3000),(386,309,2,74.0000),(387,309,1,120.0000),(388,310,4,74.0000),(389,311,3,68.4000),(390,312,5,36.5000),(391,313,2,76.0000),(392,313,1,124.0000),(393,314,4,78.0000),(394,315,3,68.5000),(395,316,5,36.7000),(396,317,2,78.0000),(397,317,1,128.0000),(398,318,4,82.0000),(399,319,3,68.7000),(400,320,5,36.8000),(401,321,2,71.0000),(402,321,1,114.0000),(403,322,4,68.0000),(404,323,3,68.3000),(405,324,5,37.4000),(406,325,2,73.0000),(407,325,1,118.0000),(408,326,4,72.0000),(409,327,3,68.4000),(410,328,5,36.4000),(411,329,2,75.0000),(412,329,1,122.0000),(413,330,4,76.0000),(414,331,3,68.6000),(415,332,5,36.6000),(416,333,2,77.0000),(417,333,1,126.0000),(418,334,4,80.0000),(419,335,3,68.7000),(420,336,5,36.7000),(421,337,2,72.0000),(422,337,1,117.0000),(423,338,4,70.0000),(424,339,3,72.0000),(425,340,5,36.3000),(426,341,2,74.0000),(427,341,1,121.0000),(428,342,4,74.0000),(429,343,3,72.1000),(430,344,5,36.4000),(431,345,2,76.0000),(432,345,1,125.0000),(433,346,4,78.0000),(434,347,3,72.3000),(435,348,5,36.6000),(436,349,2,78.0000),(437,349,1,129.0000),(438,350,4,82.0000),(439,351,3,72.4000),(440,352,5,36.7000),(441,353,2,71.0000),(442,353,1,115.0000),(443,354,4,68.0000),(444,355,3,72.0000),(445,356,5,36.2000),(446,357,2,73.0000),(447,357,1,119.0000),(448,358,4,72.0000),(449,359,3,72.2000),(450,360,5,36.3000),(451,361,2,75.0000),(452,361,1,123.0000),(453,362,4,76.0000),(454,363,3,72.3000),(455,364,5,36.5000),(456,365,2,77.0000),(457,365,1,127.0000),(458,366,4,80.0000),(459,367,3,72.4000),(460,368,5,36.7000),(461,369,2,79.0000),(462,369,1,131.0000),(463,370,4,84.0000),(464,371,3,72.6000),(465,372,5,36.8000),(466,373,2,72.0000),(467,373,1,117.0000),(468,374,4,96.0000),(469,375,3,72.2000),(470,376,5,36.3000),(471,377,2,74.0000),(472,377,1,121.0000),(473,378,4,74.0000),(474,379,3,72.3000),(475,380,5,36.4000),(476,381,2,76.0000),(477,381,1,125.0000),(478,382,4,78.0000),(479,383,3,72.5000),(480,384,5,36.6000),(481,385,2,78.0000),(482,385,1,129.0000),(483,386,4,82.0000),(484,387,3,72.6000),(485,388,5,36.7000),(486,389,2,82.0000),(487,389,1,134.0000),(488,390,4,68.0000),(489,391,3,72.3000),(490,392,5,36.2000),(491,393,2,73.0000),(492,393,1,119.0000),(493,394,4,72.0000),(494,395,3,72.4000),(495,396,5,36.3000),(496,397,2,75.0000),(497,397,1,123.0000),(498,398,4,76.0000),(499,399,3,72.5000),(500,400,5,36.5000),(501,401,2,77.0000),(502,401,1,127.0000),(503,402,4,80.0000),(504,403,3,72.7000),(505,404,5,36.7000),(506,405,2,79.0000),(507,405,1,131.0000),(508,406,4,84.0000),(509,407,3,72.8000),(510,408,5,37.9000),(511,409,2,72.0000),(512,409,1,117.0000),(513,410,4,70.0000),(514,411,3,72.4000),(515,412,5,36.3000),(516,413,2,74.0000),(517,413,1,121.0000),(518,414,4,74.0000),(519,415,3,72.6000),(520,416,5,36.4000),(521,417,2,76.0000),(522,417,1,125.0000),(523,418,4,78.0000),(524,419,3,72.7000),(525,420,5,36.6000),(526,421,2,80.0000),(527,421,1,134.0000),(528,422,4,86.0000),(529,423,3,76.5000),(530,424,5,36.8000),(531,425,2,73.0000),(532,425,1,120.0000),(533,426,4,72.0000),(534,427,3,76.1000),(535,428,5,36.3000),(536,429,2,75.0000),(537,429,1,124.0000),(538,430,4,76.0000),(539,431,3,76.2000),(540,432,5,36.4000),(541,433,2,77.0000),(542,433,1,128.0000),(543,434,4,80.0000),(544,435,3,76.4000),(545,436,5,36.6000),(546,437,2,79.0000),(547,437,1,132.0000),(548,438,4,84.0000),(549,439,3,76.5000),(550,440,5,36.7000),(551,441,2,72.0000),(552,441,1,118.0000),(553,442,4,70.0000),(554,443,3,76.2000),(555,444,5,36.2000),(556,445,2,74.0000),(557,445,1,122.0000),(558,446,4,74.0000),(559,447,3,76.3000),(560,448,5,36.3000),(561,449,2,76.0000),(562,449,1,126.0000),(563,450,4,78.0000),(564,451,3,76.4000),(565,452,5,36.5000),(566,453,2,78.0000),(567,453,1,130.0000),(568,454,4,82.0000),(569,455,3,76.6000),(570,456,5,36.7000),(571,457,2,80.0000),(572,457,1,134.0000),(573,458,4,112.0000),(574,459,3,76.7000),(575,460,5,36.8000),(576,461,2,73.0000),(577,461,1,120.0000),(578,462,4,72.0000),(579,463,3,76.3000),(580,464,5,36.3000),(581,465,2,75.0000),(582,465,1,124.0000),(583,466,4,76.0000),(584,467,3,76.5000),(585,468,5,36.4000),(586,469,2,77.0000),(587,469,1,128.0000),(588,470,4,80.0000),(589,471,3,76.6000),(590,472,5,36.6000),(591,473,2,90.0000),(592,473,1,151.0000),(593,474,4,84.0000),(594,475,3,76.7000),(595,476,5,36.7000),(596,477,2,72.0000),(597,477,1,118.0000),(598,478,4,70.0000),(599,479,3,76.4000),(600,480,5,36.2000),(601,481,2,74.0000),(602,481,1,122.0000),(603,482,4,74.0000),(604,483,3,76.5000),(605,484,5,36.3000),(606,485,2,76.0000),(607,485,1,126.0000),(608,486,4,78.0000),(609,487,3,76.7000),(610,488,5,36.5000),(611,489,2,78.0000),(612,489,1,130.0000),(613,490,4,82.0000),(614,491,3,76.8000),(615,492,5,37.8000),(616,493,2,80.0000),(617,493,1,134.0000),(618,494,4,86.0000),(619,495,3,76.9000),(620,496,5,36.8000),(621,497,2,73.0000),(622,497,1,120.0000),(623,498,4,72.0000),(624,499,3,76.6000),(625,500,5,36.3000),(626,501,2,75.0000),(627,501,1,124.0000),(628,502,4,76.0000),(629,503,3,76.7000),(630,504,5,36.4000),(631,505,2,70.0000),(632,505,1,110.0000);
/*!40000 ALTER TABLE `health_metric_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health_profiles`
--

DROP TABLE IF EXISTS `health_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_profiles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `person_id` bigint unsigned NOT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown') NOT NULL DEFAULT 'unknown',
  `general_note` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_health_profiles_person` (`person_id`),
  CONSTRAINT `fk_health_profiles_person` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health_profiles`
--

LOCK TABLES `health_profiles` WRITE;
/*!40000 ALTER TABLE `health_profiles` DISABLE KEYS */;
INSERT INTO `health_profiles` VALUES (1,1,'unknown',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,2,'unknown',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(3,3,'O+',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(4,4,'unknown',NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(5,5,'unknown',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(6,6,'unknown',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(7,7,'unknown',NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(8,8,'unknown',NULL,'2026-11-03 10:18:39','2026-11-03 10:18:39');
/*!40000 ALTER TABLE `health_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health_restrictions`
--

DROP TABLE IF EXISTS `health_restrictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_restrictions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `restriction_type` enum('allergy','dietary','other') NOT NULL,
  `name` varchar(180) NOT NULL,
  `note` text,
  `created_by_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_health_restrictions_creator` (`created_by_user_id`),
  KEY `idx_health_restrictions_profile_type` (`health_profile_id`,`restriction_type`),
  CONSTRAINT `fk_health_restrictions_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_health_restrictions_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health_restrictions`
--

LOCK TABLES `health_restrictions` WRITE;
/*!40000 ALTER TABLE `health_restrictions` DISABLE KEYS */;
INSERT INTO `health_restrictions` VALUES (1,3,'allergy','Dị ứng Amoxicillin','Phát ban khi dùng',2,'2026-10-31 14:37:12','2026-10-31 14:37:12');
/*!40000 ALTER TABLE `health_restrictions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visit_result_id` bigint unsigned NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `payment_status` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `issued_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` datetime DEFAULT NULL,
  `note` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoices_visit` (`visit_result_id`),
  UNIQUE KEY `uq_invoices_number` (`invoice_number`),
  CONSTRAINT `fk_invoices_visit` FOREIGN KEY (`visit_result_id`) REFERENCES `visit_results` (`id`),
  CONSTRAINT `chk_invoices_amount` CHECK ((`total_amount` >= 0)),
  CONSTRAINT `chk_invoices_payment` CHECK ((((`payment_status` = _utf8mb4'paid') and (`paid_at` is not null)) or ((`payment_status` = _utf8mb4'unpaid') and (`paid_at` is null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_conditions`
--

DROP TABLE IF EXISTS `medical_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_conditions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `condition_name` varchar(180) NOT NULL,
  `diagnosed_on` date DEFAULT NULL,
  `status` enum('active','resolved') NOT NULL DEFAULT 'active',
  `note` text,
  `source_type` enum('member','facility') NOT NULL DEFAULT 'member',
  `visit_result_id` bigint unsigned DEFAULT NULL,
  `created_by_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_medical_conditions_visit` (`visit_result_id`),
  KEY `fk_medical_conditions_creator` (`created_by_user_id`),
  KEY `idx_medical_conditions_profile_status` (`health_profile_id`,`status`),
  CONSTRAINT `fk_medical_conditions_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_medical_conditions_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`),
  CONSTRAINT `fk_medical_conditions_visit` FOREIGN KEY (`visit_result_id`) REFERENCES `visit_results` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_conditions`
--

LOCK TABLES `medical_conditions` WRITE;
/*!40000 ALTER TABLE `medical_conditions` DISABLE KEYS */;
INSERT INTO `medical_conditions` VALUES (1,1,'Tăng huyết áp nhẹ','2025-03-15','active','Theo dõi định kỳ','member',NULL,2,'2026-10-31 14:37:12','2026-10-31 14:37:12');
/*!40000 ALTER TABLE `medical_conditions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medication_schedules`
--

DROP TABLE IF EXISTS `medication_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medication_schedules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `medication_id` bigint unsigned NOT NULL,
  `time_of_day` time NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_medication_schedule_time` (`medication_id`,`time_of_day`),
  KEY `idx_medication_schedules_medication_active` (`medication_id`,`is_active`),
  CONSTRAINT `fk_medication_schedules_medication` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medication_schedules`
--

LOCK TABLES `medication_schedules` WRITE;
/*!40000 ALTER TABLE `medication_schedules` DISABLE KEYS */;
INSERT INTO `medication_schedules` VALUES (1,1,'08:00:00',1,'2026-10-31 14:37:12'),(2,2,'20:30:00',1,'2026-10-31 14:37:13'),(3,3,'20:30:00',1,'2026-10-31 14:37:14'),(4,4,'20:30:00',1,'2026-10-31 14:37:14'),(5,5,'20:30:00',1,'2026-10-31 14:37:15'),(6,6,'20:30:00',1,'2026-10-31 14:37:15'),(7,7,'19:00:00',1,'2026-11-03 11:59:14');
/*!40000 ALTER TABLE `medication_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medications`
--

DROP TABLE IF EXISTS `medications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `visit_result_id` bigint unsigned DEFAULT NULL,
  `created_by_user_id` bigint unsigned NOT NULL,
  `name` varchar(180) NOT NULL,
  `dosage` varchar(120) DEFAULT NULL,
  `instructions` text,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `source_type` enum('self_recorded','facility_prescribed') NOT NULL DEFAULT 'self_recorded',
  `status` enum('active','completed','stopped') NOT NULL DEFAULT 'active',
  `reminder_state` enum('none','draft','active') NOT NULL DEFAULT 'none',
  `reminder_confirmed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_medications_creator` (`created_by_user_id`),
  KEY `idx_medications_profile_status_dates` (`health_profile_id`,`status`,`start_date`,`end_date`),
  KEY `idx_medications_visit` (`visit_result_id`),
  CONSTRAINT `fk_medications_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_medications_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`),
  CONSTRAINT `fk_medications_visit` FOREIGN KEY (`visit_result_id`) REFERENCES `visit_results` (`id`),
  CONSTRAINT `chk_medications_dates` CHECK (((`end_date` is null) or (`end_date` >= `start_date`))),
  CONSTRAINT `chk_medications_reminder_confirmation` CHECK ((((`source_type` = _utf8mb4'facility_prescribed') and (`reminder_state` = _utf8mb4'active') and (`reminder_confirmed_at` is not null)) or ((`source_type` = _utf8mb4'facility_prescribed') and (`reminder_state` <> _utf8mb4'active')) or (`source_type` = _utf8mb4'self_recorded')))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medications`
--

LOCK TABLES `medications` WRITE;
/*!40000 ALTER TABLE `medications` DISABLE KEYS */;
INSERT INTO `medications` VALUES (1,1,NULL,2,'Vitamin D','1 viên','Sau ăn sáng','2026-10-31',NULL,'self_recorded','active','active',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,2,NULL,3,'Vitamin B1','1 viên','Dữ liệu thuốc mô phỏng, không phải chỉ định y tế.','2026-10-11',NULL,'self_recorded','active','active',NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(3,4,NULL,6,'Canxi','1 viên','Dữ liệu thuốc mô phỏng, không phải chỉ định y tế.','2026-10-11',NULL,'self_recorded','active','active',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(4,5,NULL,7,'Omega-3','1 viên','Dữ liệu thuốc mô phỏng, không phải chỉ định y tế.','2026-10-11',NULL,'self_recorded','active','active',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(5,6,NULL,8,'Vitamin C','1 viên','Dữ liệu thuốc mô phỏng, không phải chỉ định y tế.','2026-10-11',NULL,'self_recorded','active','active',NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(6,7,NULL,9,'Sắt','1 viên','Dữ liệu thuốc mô phỏng, không phải chỉ định y tế.','2026-10-11',NULL,'self_recorded','active','active',NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(7,4,NULL,6,'Vitamin A','1','uống trước ăn','2026-11-03','2026-11-10','self_recorded','active','active',NULL,'2026-11-03 11:59:14','2026-11-03 11:59:14');
/*!40000 ALTER TABLE `medications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metric_components`
--

DROP TABLE IF EXISTS `metric_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metric_components` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `metric_type_id` bigint unsigned NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(120) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `display_order` smallint unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_metric_component_code` (`metric_type_id`,`code`),
  CONSTRAINT `fk_metric_components_type` FOREIGN KEY (`metric_type_id`) REFERENCES `metric_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metric_components`
--

LOCK TABLES `metric_components` WRITE;
/*!40000 ALTER TABLE `metric_components` DISABLE KEYS */;
INSERT INTO `metric_components` VALUES (1,1,'systolic','Tâm thu','mmHg',1),(2,1,'diastolic','Tâm trương','mmHg',2),(3,2,'weight','Cân nặng','kg',1),(4,3,'heart_rate','Nhịp tim','bpm',1),(5,4,'temperature','Nhiệt độ','°C',1);
/*!40000 ALTER TABLE `metric_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metric_thresholds`
--

DROP TABLE IF EXISTS `metric_thresholds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metric_thresholds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `component_id` bigint unsigned NOT NULL,
  `min_value` decimal(12,4) DEFAULT NULL,
  `max_value` decimal(12,4) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `set_by_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_metric_threshold` (`health_profile_id`,`component_id`),
  KEY `fk_metric_thresholds_component` (`component_id`),
  KEY `fk_metric_thresholds_setter` (`set_by_user_id`),
  KEY `idx_metric_thresholds_profile_enabled` (`health_profile_id`,`enabled`),
  CONSTRAINT `fk_metric_thresholds_component` FOREIGN KEY (`component_id`) REFERENCES `metric_components` (`id`),
  CONSTRAINT `fk_metric_thresholds_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`),
  CONSTRAINT `fk_metric_thresholds_setter` FOREIGN KEY (`set_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_metric_threshold_bounds` CHECK ((((`min_value` is not null) or (`max_value` is not null)) and ((`min_value` is null) or (`max_value` is null) or (`min_value` <= `max_value`))))
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metric_thresholds`
--

LOCK TABLES `metric_thresholds` WRITE;
/*!40000 ALTER TABLE `metric_thresholds` DISABLE KEYS */;
INSERT INTO `metric_thresholds` VALUES (1,1,2,60.0000,95.0000,1,2,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,1,1,96.0000,145.0000,1,2,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(3,1,4,55.0000,106.0000,1,2,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(4,1,3,49.0000,65.0000,1,2,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(5,1,5,35.5000,37.8000,1,2,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(6,2,2,60.0000,95.0000,1,3,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(7,2,1,96.0000,145.0000,1,3,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(8,2,4,55.0000,106.0000,1,3,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(9,2,3,53.0000,69.0000,1,3,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(10,2,5,35.5000,37.8000,1,3,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(11,4,2,60.0000,95.0000,1,6,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(12,4,1,96.0000,145.0000,1,6,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(13,4,4,55.0000,106.0000,1,6,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(14,4,3,57.0000,73.0000,1,6,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(15,4,5,35.5000,37.8000,1,6,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(16,5,2,60.0000,95.0000,1,7,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(17,5,1,96.0000,145.0000,1,7,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(18,5,4,55.0000,106.0000,1,7,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(19,5,3,61.0000,77.0000,1,7,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(20,5,5,35.5000,37.8000,1,7,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(21,6,2,60.0000,95.0000,1,8,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(22,6,1,96.0000,145.0000,1,8,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(23,6,4,55.0000,106.0000,1,8,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(24,6,3,65.0000,81.0000,1,8,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(25,6,5,35.5000,37.8000,1,8,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(26,7,2,60.0000,95.0000,1,9,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(27,7,1,96.0000,145.0000,1,9,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(28,7,4,55.0000,106.0000,1,9,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(29,7,3,69.0000,85.0000,1,9,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(30,7,5,35.5000,37.8000,1,9,'2026-10-31 14:37:15','2026-10-31 14:37:15');
/*!40000 ALTER TABLE `metric_thresholds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metric_types`
--

DROP TABLE IF EXISTS `metric_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metric_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_metric_types_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metric_types`
--

LOCK TABLES `metric_types` WRITE;
/*!40000 ALTER TABLE `metric_types` DISABLE KEYS */;
INSERT INTO `metric_types` VALUES (1,'blood_pressure','Huyết áp','Huyết áp tâm thu/tâm trương'),(2,'weight','Cân nặng','Khối lượng cơ thể'),(3,'heart_rate','Nhịp tim','Số nhịp tim mỗi phút'),(4,'body_temperature','Nhiệt độ cơ thể','Nhiệt độ cơ thể');
/*!40000 ALTER TABLE `metric_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_password_reset_token_hash` (`token_hash`),
  KEY `idx_password_reset_tokens_user_expiry` (`user_id`,`expires_at`,`used_at`),
  CONSTRAINT `fk_password_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `people`
--

DROP TABLE IF EXISTS `people`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `people` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `family_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `person_type` enum('member','dependent') NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other','unspecified') NOT NULL DEFAULT 'unspecified',
  `relationship_to_manager` varchar(50) DEFAULT NULL,
  `manager_user_id` bigint unsigned DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_people_user` (`user_id`),
  KEY `idx_people_family_status` (`family_id`,`status`),
  KEY `idx_people_manager` (`manager_user_id`),
  CONSTRAINT `fk_people_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`),
  CONSTRAINT `fk_people_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_people_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `people`
--

LOCK TABLES `people` WRITE;
/*!40000 ALTER TABLE `people` DISABLE KEYS */;
INSERT INTO `people` VALUES (1,1,2,'member','Nguyễn Minh An',NULL,'unspecified',NULL,NULL,'active','2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,1,3,'member','Trần Ngọc Mai',NULL,'unspecified',NULL,NULL,'active','2026-10-31 14:37:12','2026-10-31 14:37:12'),(3,1,NULL,'dependent','Bé An','2018-06-15','female','Con',2,'active','2026-10-31 14:37:12','2026-10-31 14:37:12'),(4,1,6,'member','Nguyễn Đức Long',NULL,'unspecified',NULL,NULL,'active','2026-10-31 14:37:13','2026-10-31 14:37:13'),(5,1,7,'member','Nguyễn Thu Hà',NULL,'unspecified',NULL,NULL,'active','2026-10-31 14:37:14','2026-10-31 14:37:14'),(6,1,8,'member','Nguyễn Hoàng Nam',NULL,'unspecified',NULL,NULL,'active','2026-10-31 14:37:14','2026-10-31 14:37:14'),(7,1,9,'member','Nguyễn Minh Phương',NULL,'unspecified',NULL,NULL,'active','2026-10-31 14:37:15','2026-10-31 14:37:15'),(8,2,15,'member','Thành viên Demo 7','2000-01-01','unspecified',NULL,NULL,'active','2026-11-03 10:15:15','2026-11-03 10:15:49');
/*!40000 ALTER TABLE `people` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_appointments`
--

DROP TABLE IF EXISTS `personal_appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_appointments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `created_by_user_id` bigint unsigned NOT NULL,
  `title` varchar(180) NOT NULL,
  `facility_name` varchar(180) DEFAULT NULL,
  `doctor_name` varchar(120) DEFAULT NULL,
  `scheduled_at` datetime NOT NULL,
  `reminder_at` datetime DEFAULT NULL,
  `status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `note` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_personal_appointments_creator` (`created_by_user_id`),
  KEY `idx_personal_appointments_profile_time` (`health_profile_id`,`scheduled_at`),
  CONSTRAINT `fk_personal_appointments_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_personal_appointments_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`),
  CONSTRAINT `chk_personal_appointments_reminder` CHECK (((`reminder_at` is null) or (`reminder_at` <= `scheduled_at`)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_appointments`
--

LOCK TABLES `personal_appointments` WRITE;
/*!40000 ALTER TABLE `personal_appointments` DISABLE KEYS */;
INSERT INTO `personal_appointments` VALUES (1,1,2,'Tái khám mắt','Phòng khám Mắt Demo',NULL,'2026-11-04 21:37:12','2026-11-03 21:37:12','scheduled',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,1,2,'Tái khám mắt','Bệnh Viện mắt','Duy','2026-11-06 14:30:00','2026-11-06 06:30:00','scheduled','mang theo giấy hẹn','2026-11-04 17:30:28','2026-11-04 17:30:28');
/*!40000 ALTER TABLE `personal_appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profile_permissions`
--

DROP TABLE IF EXISTS `profile_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `health_profile_id` bigint unsigned NOT NULL,
  `grantee_user_id` bigint unsigned NOT NULL,
  `access_level` enum('view','full') NOT NULL,
  `granted_by_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profile_permission` (`health_profile_id`,`grantee_user_id`),
  KEY `fk_profile_permissions_granter` (`granted_by_user_id`),
  KEY `idx_profile_permissions_grantee` (`grantee_user_id`),
  CONSTRAINT `fk_profile_permissions_grantee` FOREIGN KEY (`grantee_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_profile_permissions_granter` FOREIGN KEY (`granted_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_profile_permissions_profile` FOREIGN KEY (`health_profile_id`) REFERENCES `health_profiles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profile_permissions`
--

LOCK TABLES `profile_permissions` WRITE;
/*!40000 ALTER TABLE `profile_permissions` DISABLE KEYS */;
INSERT INTO `profile_permissions` VALUES (1,2,2,'view',3,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,3,3,'view',2,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(3,4,2,'view',6,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(4,5,2,'view',7,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(5,6,2,'view',8,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(6,7,2,'view',9,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(7,4,3,'view',6,'2026-11-03 11:53:13','2026-11-03 11:53:13'),(8,4,7,'view',6,'2026-11-03 11:53:16','2026-11-03 11:53:16'),(9,4,8,'view',6,'2026-11-03 11:53:22','2026-11-03 11:53:22'),(10,4,9,'view',6,'2026-11-03 11:53:26','2026-11-03 11:53:26');
/*!40000 ALTER TABLE `profile_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_consents`
--

DROP TABLE IF EXISTS `user_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_consents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `subject_person_id` bigint unsigned DEFAULT NULL,
  `consent_type` enum('terms','privacy','health_data','dependent_health_data') NOT NULL,
  `document_version` varchar(30) NOT NULL,
  `status` enum('granted','revoked') NOT NULL DEFAULT 'granted',
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_consents_user_type` (`user_id`,`consent_type`,`status`),
  KEY `idx_user_consents_subject_type` (`subject_person_id`,`consent_type`,`status`),
  CONSTRAINT `fk_user_consents_subject` FOREIGN KEY (`subject_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `fk_user_consents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_user_consents_revocation` CHECK ((((`status` = _utf8mb4'granted') and (`revoked_at` is null)) or ((`status` = _utf8mb4'revoked') and (`revoked_at` is not null))))
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_consents`
--

LOCK TABLES `user_consents` WRITE;
/*!40000 ALTER TABLE `user_consents` DISABLE KEYS */;
INSERT INTO `user_consents` VALUES (1,1,NULL,'terms','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(2,1,NULL,'privacy','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(3,4,NULL,'terms','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(4,4,NULL,'privacy','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(5,5,NULL,'terms','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(6,5,NULL,'privacy','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(7,2,NULL,'terms','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(8,2,NULL,'privacy','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(9,2,1,'health_data','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(10,3,NULL,'terms','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(11,3,NULL,'privacy','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(12,3,2,'health_data','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(13,2,3,'dependent_health_data','1.0','granted','2026-10-31 21:37:12',NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(14,6,NULL,'terms','1.0','granted','2026-10-31 21:37:13',NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(15,6,NULL,'privacy','1.0','granted','2026-10-31 21:37:13',NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(16,6,4,'health_data','1.0','granted','2026-10-31 21:37:13',NULL,'2026-10-31 14:37:13','2026-10-31 14:37:13'),(17,7,NULL,'terms','1.0','granted','2026-10-31 21:37:14',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(18,7,NULL,'privacy','1.0','granted','2026-10-31 21:37:14',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(19,7,5,'health_data','1.0','granted','2026-10-31 21:37:14',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(20,8,NULL,'terms','1.0','granted','2026-10-31 21:37:14',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(21,8,NULL,'privacy','1.0','granted','2026-10-31 21:37:14',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(22,8,6,'health_data','1.0','granted','2026-10-31 21:37:14',NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(23,9,NULL,'terms','1.0','granted','2026-10-31 21:37:15',NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(24,9,NULL,'privacy','1.0','granted','2026-10-31 21:37:15',NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(25,9,7,'health_data','1.0','granted','2026-10-31 21:37:15',NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(26,10,NULL,'terms','1.0','granted','2026-10-31 21:37:15',NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(27,10,NULL,'privacy','1.0','granted','2026-10-31 21:37:15',NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(28,11,NULL,'terms','1.0','granted','2026-10-31 21:37:16',NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(29,11,NULL,'privacy','1.0','granted','2026-10-31 21:37:16',NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(30,12,NULL,'terms','1.0','granted','2026-10-31 21:37:16',NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(31,12,NULL,'privacy','1.0','granted','2026-10-31 21:37:16',NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(32,13,NULL,'terms','1.0','granted','2026-10-31 21:37:16',NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(33,13,NULL,'privacy','1.0','granted','2026-10-31 21:37:16',NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(34,14,NULL,'terms','1.0','granted','2026-10-31 21:37:16',NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(35,14,NULL,'privacy','1.0','granted','2026-10-31 21:37:16',NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(36,15,NULL,'terms','1.0','granted','2026-11-03 17:15:15',NULL,'2026-11-03 10:15:15','2026-11-03 10:15:15'),(37,15,NULL,'privacy','1.0','granted','2026-11-03 17:15:15',NULL,'2026-11-03 10:15:15','2026-11-03 10:15:15'),(38,15,8,'health_data','1.0','granted','2026-11-03 17:18:39',NULL,'2026-11-03 10:18:39','2026-11-03 10:18:39');
/*!40000 ALTER TABLE `user_consents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `display_name` varchar(120) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `account_type` enum('member','facility','admin') NOT NULL,
  `status` enum('active','locked') NOT NULL DEFAULT 'active',
  `auth_version` int unsigned NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@carely.local','$2b$12$Z50zIwUAIgMPGET9VUwvEeda2I5fZkzg7eJIorUr6y/3HbqFxzWOq','Carely Admin',NULL,'admin','active',1,'2026-11-07 14:27:16','2026-10-31 14:37:11','2026-11-07 07:27:16'),(2,'member@carely.local','$2b$12$uJoVeNgatxXiLvpa8nWjOeS8eicQlrlMEOl9NwBlaCyaxj7.iMRAu','Nguyễn Minh An',NULL,'member','active',1,'2026-11-07 14:20:19','2026-10-31 14:37:11','2026-11-07 07:20:19'),(3,'member2@carely.local','$2b$12$GbcsYJEcTSXowea9ijypFOGKN.vT6SYl56Pn/2ySGX3j1DBS.3Fke','Trần Ngọc Mai',NULL,'member','active',1,NULL,'2026-10-31 14:37:11','2026-10-31 14:37:11'),(4,'facility@carely.local','$2b$12$h9fEt4wwSnpaaqwXrFLT8udmuw1Xi4XdiRZKtu6KTtpxzT8ak0WJu','Phòng khám Nhi Hòa Bình',NULL,'facility','active',1,'2026-11-07 14:28:24','2026-10-31 14:37:11','2026-11-07 07:28:24'),(5,'pending@carely.local','$2b$12$W/kGVLnnGiusR117dp6uUuRUfXQSro7fpWeikPQo4uREzBaeMp6xu','Phòng khám An Khang',NULL,'facility','active',1,NULL,'2026-10-31 14:37:12','2026-10-31 14:37:12'),(6,'member3@carely.local','$2b$12$YKql3E8B9UB3xYD1vcHYyO/NKlOCKU1KZF5l2svCr4GJ/ttMGO03u','Nguyễn Đức Long',NULL,'member','active',1,'2026-11-06 22:41:46','2026-10-31 14:37:13','2026-11-06 15:41:46'),(7,'member4@carely.local','$2b$12$YWUMW6BrQYynfMwTk4Gy8.jF5yQOn5jhQtqwEn1v4rLDZtpqsRNhK','Nguyễn Thu Hà',NULL,'member','active',1,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(8,'member5@carely.local','$2b$12$jv6KOgflOFxPdxPJjZ0xXeMubDZcnawMqesphaKXCO7b582.zQ/Gu','Nguyễn Hoàng Nam',NULL,'member','active',1,NULL,'2026-10-31 14:37:14','2026-10-31 14:37:14'),(9,'member6@carely.local','$2b$12$m1NfTX9gTzYobdIp/nKXbuSfMwmo6HDvbJa3Zj8hUHdB2uwGPR/OS','Nguyễn Minh Phương',NULL,'member','active',1,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(10,'facility2@carely.local','$2b$12$lWen1MFimKMhUsnzC9EZP.hb4CQ7dxUjyqinBCrhjAAxliB2XqgkS','Phòng khám Gia Đình Sông Hồng',NULL,'facility','active',1,NULL,'2026-10-31 14:37:15','2026-10-31 14:37:15'),(11,'facility3@carely.local','$2b$12$6UVsye0vANCU0Vysraw/mOgnfoJuwJpjW4U97DQZDjjoWk0NlzyU.','Phòng khám Đa khoa Bình An',NULL,'facility','active',1,NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(12,'facility4@carely.local','$2b$12$IxXBOPIemELYFDIF9d50TuVfmOHNe.oArDLZnyhLx1KGf9m3.YuBi','Trung tâm Chăm sóc Sức khỏe Minh Tâm',NULL,'facility','active',1,NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(13,'facility5@carely.local','$2b$12$iFX/EiO7JWhsPTHyBkuq3eQdEpx2mKS0gEaBseyN1Y2c792z0wXTO','Phòng khám Nội khoa Ánh Dương',NULL,'facility','active',1,NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(14,'pending2@carely.local','$2b$12$NKumxlBSX1jAuNhCYnYKnOj7qfYPmA7DHGbhgeQEgDjzkmo4sU5IC','Phòng khám Phú Thịnh',NULL,'facility','active',1,NULL,'2026-10-31 14:37:16','2026-10-31 14:37:16'),(15,'member7@carely.local','$2b$12$m1NfTX9gTzYobdIp/nKXbuSfMwmo6HDvbJa3Zj8hUHdB2uwGPR/OS','Thành viên Demo 7',NULL,'member','active',1,'2026-11-04 17:51:18','2026-11-03 10:15:15','2026-11-04 10:51:18');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visit_results`
--

DROP TABLE IF EXISTS `visit_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visit_results` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `appointment_id` bigint unsigned NOT NULL,
  `recorded_by_user_id` bigint unsigned NOT NULL,
  `doctor_name` varchar(120) DEFAULT NULL,
  `examined_at` datetime NOT NULL,
  `diagnosis` text,
  `conclusion` text,
  `instructions` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_visit_results_appointment` (`appointment_id`),
  KEY `fk_visit_results_recorder` (`recorded_by_user_id`),
  CONSTRAINT `fk_visit_results_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`),
  CONSTRAINT `fk_visit_results_recorder` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visit_results`
--

LOCK TABLES `visit_results` WRITE;
/*!40000 ALTER TABLE `visit_results` DISABLE KEYS */;
INSERT INTO `visit_results` VALUES (1,4,4,'Duy','2026-11-06 14:30:00','Không vấn đề','Bình thường','Uống đủ nước','2026-11-06 15:41:29','2026-11-06 15:41:29');
/*!40000 ALTER TABLE `visit_results` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-09 14:48:40
