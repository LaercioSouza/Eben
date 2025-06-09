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
  CONSTRAINT `alternative_ibfk_1` FOREIGN KEY (`id_pergunta`) REFERENCES `question` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.alternative: ~5 rows (aproximadamente)
INSERT INTO `alternative` (`id`, `id_pergunta`, `texto`) VALUES
	(10, 11, 'PYTHON'),
	(11, 11, 'PHP'),
	(12, 12, 'WEB'),
	(13, 12, 'MOBILE'),
	(14, 12, 'DESKTOP');

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

-- Copiando dados para a tabela dashboard_db.companies: ~2 rows (aproximadamente)
INSERT INTO `companies` (`id`, `nome`, `cnpj`, `endereco`, `telefone`, `coordinates`, `parent_id`, `created_at`) VALUES
	(1749471270754, 'TicBox Sistemas', '3283293281823', 'Avenida Nossa Senhora de Fátima', '86995591579', '-41.7734,-2.9055', NULL, '2025-06-09 15:14:30'),
	(1749471447370, 'Elizeu Martins', '28329328429382', 'Avenida Dr João Silva Filho', '86995591579', '-41.7734,-2.9055', NULL, '2025-06-09 15:17:27');

-- Copiando estrutura para tabela dashboard_db.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` bigint(20) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.employees: ~2 rows (aproximadamente)
INSERT INTO `employees` (`id`, `nome`, `cargo`, `telefone`, `created_at`) VALUES
	(1749471474014, 'Iago', 'Analista de Implantação', '86995591579', '2025-06-09 15:17:54'),
	(1749471517157, 'Laercio Souza', 'Suporte', '86995591579', '2025-06-09 15:18:37');

-- Copiando estrutura para tabela dashboard_db.form
CREATE TABLE IF NOT EXISTS `form` (
  `id` bigint(20) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.form: ~1 rows (aproximadamente)
INSERT INTO `form` (`id`, `titulo`, `descricao`, `criado_em`) VALUES
	(1749474992475, 'Formulário para teste', 'nenhuma', '2025-06-09 16:16:32');

-- Copiando estrutura para tabela dashboard_db.question
CREATE TABLE IF NOT EXISTS `question` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_formulario` bigint(20) NOT NULL,
  `texto` text NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `obrigatoria` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `id_formulario` (`id_formulario`),
  CONSTRAINT `question_ibfk_1` FOREIGN KEY (`id_formulario`) REFERENCES `form` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.question: ~3 rows (aproximadamente)
INSERT INTO `question` (`id`, `id_formulario`, `texto`, `tipo`, `obrigatoria`) VALUES
	(11, 1749474992475, 'Escolha uma linguagem de programação', 'checkbox', 0),
	(12, 1749474992475, 'Escolha suas melhores plataformas de desenvolvimento', 'checkbox', 0),
	(13, 1749474992475, 'Qual sua opinião sobre Back-End?', 'text', 0);

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
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `colaborador_id` (`colaborador_id`),
  KEY `formulario_id` (`formulario_id`),
  CONSTRAINT `task_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `task_ibfk_2` FOREIGN KEY (`colaborador_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `task_ibfk_3` FOREIGN KEY (`formulario_id`) REFERENCES `form` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela dashboard_db.task: ~2 rows (aproximadamente)
INSERT INTO `task` (`id`, `empresa_id`, `colaborador_id`, `responsavel`, `tempo_sugerido`, `data_tarefa`, `hora_tarefa`, `descricao`, `coordenadas`, `formulario_id`, `status`, `criado_em`) VALUES
	(1749471552796, 1749471270754, 1749471517157, 'James', '00:00:02', '2025-06-09', '15:00:00', 'Nenhuma', '-41.7734,-2.9055', NULL, 'pendente', '2025-06-09 15:19:12'),
	(1749471609671, 1749471447370, 1749471474014, 'Pedro', '00:00:02', '2025-06-09', '00:00:00', 'nenhuma descrição', '-41.7734,-2.9055', NULL, 'pendente', '2025-06-09 15:20:09');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
