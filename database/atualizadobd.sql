-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           10.4.32-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para dashboard_db
CREATE DATABASE IF NOT EXISTS `dashboard_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `dashboard_db`;

-- Copiando estrutura para tabela dashboard_db.alternative
CREATE TABLE IF NOT EXISTS `alternative` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_pergunta` bigint(20) NOT NULL,
  `texto` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_pergunta` (`id_pergunta`),
  CONSTRAINT `alternative_ibfk_1` FOREIGN KEY (`id_pergunta`) REFERENCES `question` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=230 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.alternative: ~6 rows (aproximadamente)
DELETE FROM `alternative`;
INSERT INTO `alternative` (`id`, `id_pergunta`, `texto`) VALUES
	(217, 5, 'Front-End'),
	(218, 5, 'Back-End'),
	(219, 6, 'Laravel'),
	(220, 6, 'Flutter'),
	(221, 6, 'React'),
	(222, 6, 'Angular');

-- Copiando estrutura para tabela dashboard_db.companies
CREATE TABLE IF NOT EXISTS `companies` (
  `id` bigint(20) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `cnpj` varchar(20) NOT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `coordinates` varchar(100) DEFAULT NULL,
  `parent_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.companies: ~4 rows (aproximadamente)
DELETE FROM `companies`;
INSERT INTO `companies` (`id`, `nome`, `cnpj`, `endereco`, `telefone`, `coordinates`, `parent_id`, `created_at`) VALUES
	(1749471270754, 'TicBox Sistemas', '3283293281823', 'Avenida Nossa Senhora de Fátima', '86995591579', '-41.7734,-2.9055', NULL, '2025-06-09 15:14:30'),
	(1749471447370, 'Elizeu Martins', '28329328429382', 'Avenida Dr João Silva Filho', '86995591579', '-41.7734,-2.9055', NULL, '2025-06-09 15:17:27'),
	(1749727759832, 'Mateus Atacadista', '82394829382939', 'Av. São Sebastião', '86998763536', '-41.7734,-2.9055', NULL, '2025-06-12 14:29:19'),
	(1749727820169, 'Pizza Quadrada', '8238329383929', 'Av. São Sebastião', '86996762827', '-41.7734,-2.9055', NULL, '2025-06-12 14:30:20'),
	(1749728902107, 'Pizza Quadrada', '9238239293990', 'Beira Rio', '86988786723', '-41.7734,-2.9055', 1749727820169, '2025-06-12 14:48:22'),
	(1749815571186, 'Panda Sushi', '889799997878797', 'Bairro Pindorama', '86998898767', '-41.7734,-2.9055', NULL, '2025-06-13 14:52:51');

-- Copiando estrutura para tabela dashboard_db.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` bigint(20) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.employees: ~4 rows (aproximadamente)
DELETE FROM `employees`;
INSERT INTO `employees` (`id`, `nome`, `cargo`, `telefone`, `created_at`) VALUES
	(1749471474014, 'Iago', 'Analista de Implantação', '86995591579', '2025-06-09 15:17:54'),
	(1749652085931, 'Laercio Souza', 'Desenvolvedor web', '86995591579', '2025-06-11 17:28:05'),
	(1749652284892, 'Juninho', 'Desenvolvedor web', '86995591579', '2025-06-11 17:31:24'),
	(1749738200409, 'João', 'Analista de suporte', '86998765625', '2025-06-12 17:23:20');

-- Copiando estrutura para tabela dashboard_db.form
CREATE TABLE IF NOT EXISTS `form` (
  `id` bigint(20) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.form: ~2 rows (aproximadamente)
DELETE FROM `form`;
INSERT INTO `form` (`id`, `titulo`, `descricao`, `criado_em`) VALUES
	(1749651772345, 'Formulário de dev', 'nenhuma', '2025-06-11 17:22:52'),
	(1750079659197, 'jkj', 'jkj', '2025-06-16 16:14:19');

-- Copiando estrutura para tabela dashboard_db.form_response
CREATE TABLE IF NOT EXISTS `form_response` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_formulario` bigint(20) NOT NULL,
  `respondido_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `task_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_form_response_id_formulario` (`id_formulario`),
  KEY `fk_task_id` (`task_id`),
  CONSTRAINT `fk_form_response_form` FOREIGN KEY (`id_formulario`) REFERENCES `form` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_id` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_response_ibfk_1` FOREIGN KEY (`id_formulario`) REFERENCES `form` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.form_response: ~1 rows (aproximadamente)
DELETE FROM `form_response`;
INSERT INTO `form_response` (`id`, `id_formulario`, `respondido_em`, `task_id`) VALUES
	(27, 1749651772345, '2025-08-12 14:47:08', 1755009964041);

-- Copiando estrutura para tabela dashboard_db.question
CREATE TABLE IF NOT EXISTS `question` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_formulario` bigint(20) NOT NULL,
  `texto` text NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `obrigatoria` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `id_formulario` (`id_formulario`),
  CONSTRAINT `question_ibfk_1` FOREIGN KEY (`id_formulario`) REFERENCES `form` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.question: ~3 rows (aproximadamente)
DELETE FROM `question`;
INSERT INTO `question` (`id`, `id_formulario`, `texto`, `tipo`, `obrigatoria`) VALUES
	(5, 1749651772345, 'Qual sua stack?', 'radio', 1),
	(6, 1749651772345, 'Quais seus frameworks?', 'checkbox', 1),
	(7, 1749651772345, 'O que acha de desenvolvimento web?', 'text', 0),
	(13, 1750079659197, 'kmk', 'text', 0);

-- Copiando estrutura para tabela dashboard_db.question_response
CREATE TABLE IF NOT EXISTS `question_response` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_form_response` bigint(20) NOT NULL,
  `id_pergunta` bigint(20) NOT NULL,
  `resposta_texto` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_form_response` (`id_form_response`),
  KEY `id_pergunta` (`id_pergunta`),
  CONSTRAINT `question_response_ibfk_1` FOREIGN KEY (`id_form_response`) REFERENCES `form_response` (`id`) ON DELETE CASCADE,
  CONSTRAINT `question_response_ibfk_2` FOREIGN KEY (`id_pergunta`) REFERENCES `question` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.question_response: ~3 rows (aproximadamente)
DELETE FROM `question_response`;
INSERT INTO `question_response` (`id`, `id_form_response`, `id_pergunta`, `resposta_texto`) VALUES
	(65, 27, 5, 'Front-End'),
	(66, 27, 6, ''),
	(67, 27, 7, 'bacana');

-- Copiando estrutura para tabela dashboard_db.question_response_alternative
CREATE TABLE IF NOT EXISTS `question_response_alternative` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_question_response` bigint(20) NOT NULL,
  `id_alternativa` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_question_response` (`id_question_response`),
  KEY `id_alternativa` (`id_alternativa`),
  CONSTRAINT `question_response_alternative_ibfk_1` FOREIGN KEY (`id_question_response`) REFERENCES `question_response` (`id`) ON DELETE CASCADE,
  CONSTRAINT `question_response_alternative_ibfk_2` FOREIGN KEY (`id_alternativa`) REFERENCES `alternative` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.question_response_alternative: ~3 rows (aproximadamente)
DELETE FROM `question_response_alternative`;
INSERT INTO `question_response_alternative` (`id`, `id_question_response`, `id_alternativa`) VALUES
	(60, 65, 217),
	(61, 66, 220),
	(62, 66, 221);

-- Copiando estrutura para tabela dashboard_db.task
CREATE TABLE IF NOT EXISTS `task` (
  `id` bigint(20) NOT NULL,
  `empresa_id` bigint(20) NOT NULL,
  `colaborador_id` bigint(20) NOT NULL,
  `responsavel` varchar(255) DEFAULT NULL,
  `tempo_sugerido` time DEFAULT NULL,
  `data_tarefa` date DEFAULT NULL,
  `hora_tarefa` time DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `coordenadas` varchar(100) DEFAULT NULL,
  `formulario_id` bigint(20) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `transitStartedAt` timestamp NULL DEFAULT NULL,
  `transitEndLocation` varchar(100) DEFAULT NULL,
  `transitTime` time DEFAULT NULL,
  `taskStartedAt` timestamp NULL DEFAULT NULL,
  `startLocation` varchar(100) DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `completionObservations` text DEFAULT NULL,
  `workTime` time DEFAULT NULL,
  `pauseTime` time DEFAULT NULL,
  `returnStartLocation` varchar(100) DEFAULT NULL,
  `returnStartedAt` datetime DEFAULT NULL,
  `returnEndLocation` varchar(100) DEFAULT NULL,
  `returnTransitTime` time DEFAULT NULL,
  `finalizedAt` datetime DEFAULT NULL,
  `finalObservations` text DEFAULT NULL,
  `totalTime` time DEFAULT NULL,
  `cancellation_timestamp` datetime DEFAULT NULL,
  `cancellation_reason` varchar(100) DEFAULT NULL,
  `cancellation_coordinates` varchar(100) DEFAULT NULL,
  `cancellation_photo` varchar(100) DEFAULT NULL,
  `transitStartLocation` varchar(100) DEFAULT NULL,
  `transitEndAt` timestamp NULL DEFAULT NULL,
  `ReturnEndAt` timestamp NULL DEFAULT NULL,
  `locationEndTask` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `colaborador_id` (`colaborador_id`),
  KEY `formulario_id` (`formulario_id`),
  CONSTRAINT `task_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_ibfk_2` FOREIGN KEY (`colaborador_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_ibfk_3` FOREIGN KEY (`formulario_id`) REFERENCES `form` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.task: ~2 rows (aproximadamente)
DELETE FROM `task`;
INSERT INTO `task` (`id`, `empresa_id`, `colaborador_id`, `responsavel`, `tempo_sugerido`, `data_tarefa`, `hora_tarefa`, `descricao`, `coordenadas`, `formulario_id`, `status`, `criado_em`, `transitStartedAt`, `transitEndLocation`, `transitTime`, `taskStartedAt`, `startLocation`, `completedAt`, `observations`, `completionObservations`, `workTime`, `pauseTime`, `returnStartLocation`, `returnStartedAt`, `returnEndLocation`, `returnTransitTime`, `finalizedAt`, `finalObservations`, `totalTime`, `cancellation_timestamp`, `cancellation_reason`, `cancellation_coordinates`, `cancellation_photo`, `transitStartLocation`, `transitEndAt`, `ReturnEndAt`, `locationEndTask`) VALUES
	(1754999200465, 1749471270754, 1749652085931, 'Pedro', '02:00:00', '2025-08-12', '14:00:00', 'nenhuma', '-41.7734,-2.9055', NULL, 'cancelada', '2025-08-12 14:46:40', '2025-08-12 11:47:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-12 09:27:55', 'ç', '-41.7668683,-2.9038268', 'cancel_1754999200465_1755001675.jpg', '-41.7668649,-2.9038504', NULL, NULL, NULL),
	(1755009964041, 1749471447370, 1749471474014, 'Josué', '02:00:00', '2025-08-12', '11:02:00', 'nenhuma', '-41.7734,-2.9055', 1749651772345, 'concluida', '2025-08-12 17:46:04', '2025-08-12 14:46:50', '-41.7506844,-2.9092734', '00:00:03', '2025-08-12 14:46:57', '-41.7506844,-2.9092734', '2025-08-12 11:47:10', '', '', '00:00:13', '00:00:00', '-41.7506844,-2.9092734', '2025-08-12 11:47:14', '-41.7506844,-2.9092734', '00:00:04', '2025-08-12 11:47:24', '', '00:00:34', NULL, NULL, NULL, NULL, '-41.7506844,-2.9092734', '2025-08-12 14:46:53', '2025-08-12 14:47:18', '-41.7506844,-2.9092734');

-- Copiando estrutura para tabela dashboard_db.task_pauses
CREATE TABLE IF NOT EXISTS `task_pauses` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `task_id` bigint(20) NOT NULL,
  `started_at` datetime NOT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration` time DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `endLocation` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `task_pauses_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.task_pauses: ~0 rows (aproximadamente)
DELETE FROM `task_pauses`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
