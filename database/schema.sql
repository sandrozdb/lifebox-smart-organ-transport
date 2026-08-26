CREATE DATABASE IF NOT EXISTS lifebox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lifebox_db;

CREATE TABLE IF NOT EXISTS transportes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo_transporte VARCHAR(40) NOT NULL UNIQUE,
  identificador_caixa VARCHAR(40) NOT NULL,
  tipo_orgao VARCHAR(80) NOT NULL,
  hospital_origem VARCHAR(160) NOT NULL,
  hospital_destino VARCHAR(160) NOT NULL,
  latitude_origem DECIMAL(10,7) NOT NULL,
  longitude_origem DECIMAL(10,7) NOT NULL,
  latitude_destino DECIMAL(10,7) NOT NULL,
  longitude_destino DECIMAL(10,7) NOT NULL,
  inicio_transporte DATETIME NULL,
  fim_transporte DATETIME NULL,
  execucao_atual_id VARCHAR(80) NULL,
  status ENUM('PREPARADO','EM_ANDAMENTO','ATENCAO','CRITICO','CONCLUIDO') NOT NULL DEFAULT 'PREPARADO',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leituras (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transporte_id BIGINT UNSIGNED NOT NULL,
  execucao_id VARCHAR(80) NULL,
  temperatura DECIMAL(5,2) NOT NULL,
  umidade DECIMAL(5,2) NOT NULL,
  aceleracao DECIMAL(7,3) NOT NULL,
  aceleracao_x DECIMAL(7,3) NOT NULL DEFAULT 0,
  aceleracao_y DECIMAL(7,3) NOT NULL DEFAULT 0,
  aceleracao_z DECIMAL(7,3) NOT NULL DEFAULT 0,
  impacto DECIMAL(7,3) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  velocidade DECIMAL(6,2) NOT NULL,
  bateria DECIMAL(5,2) NOT NULL,
  sinal DECIMAL(5,2) NOT NULL,
  device_id VARCHAR(40) NOT NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_leitura_transporte FOREIGN KEY (transporte_id) REFERENCES transportes(id),
  INDEX idx_leituras_transporte_data (transporte_id, registrado_em)
);

CREATE TABLE IF NOT EXISTS otimizacoes_rota (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transporte_id BIGINT UNSIGNED NOT NULL,
  rota VARCHAR(30) NOT NULL,
  nome_rota VARCHAR(120) NOT NULL,
  distancia DECIMAL(7,2) NOT NULL,
  tempo_estimado DECIMAL(7,2) NOT NULL,
  risco DECIMAL(6,4) NOT NULL,
  custo DECIMAL(9,2) NOT NULL,
  score DECIMAL(9,6) NOT NULL,
  viavel BOOLEAN NOT NULL,
  selecionada BOOLEAN NOT NULL,
  pesos_utilizados JSON NOT NULL,
  restricoes_aplicadas JSON NOT NULL,
  detalhes_calculo JSON NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_otimizacao_transporte FOREIGN KEY (transporte_id) REFERENCES transportes(id),
  INDEX idx_otimizacao_transporte_data (transporte_id, criado_em)
);

CREATE TABLE IF NOT EXISTS alertas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transporte_id BIGINT UNSIGNED NOT NULL,
  execucao_id VARCHAR(80) NULL,
  leitura_id BIGINT UNSIGNED NULL,
  tipo VARCHAR(50) NOT NULL,
  severidade ENUM('ATENCAO','CRITICO') NOT NULL,
  mensagem VARCHAR(255) NOT NULL,
  valor DECIMAL(10,3) NULL,
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alerta_transporte FOREIGN KEY (transporte_id) REFERENCES transportes(id),
  CONSTRAINT fk_alerta_leitura FOREIGN KEY (leitura_id) REFERENCES leituras(id),
  INDEX idx_alertas_transporte_data (transporte_id, criado_em)
);

CREATE TABLE IF NOT EXISTS eventos_rastreabilidade (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transporte_id BIGINT UNSIGNED NOT NULL,
  execucao_id VARCHAR(80) NULL,
  tipo_evento VARCHAR(60) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evento_transporte FOREIGN KEY (transporte_id) REFERENCES transportes(id),
  INDEX idx_eventos_transporte_data (transporte_id, registrado_em)
);

-- Pesquisa Operacional logística V1. Estruturas adicionais, sem DROP e idempotentes.
CREATE TABLE IF NOT EXISTS organ_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  profile_json JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transport_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transporte_id BIGINT UNSIGNED NULL,
  organ_code VARCHAR(30) NOT NULL,
  origin_json JSON NOT NULL,
  destination_json JSON NOT NULL,
  status VARCHAR(40) NOT NULL,
  selected_alternative_id VARCHAR(60) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transport_plans_transport (transporte_id)
);
CREATE TABLE IF NOT EXISTS transport_plan_segments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transport_plan_id BIGINT UNSIGNED NOT NULL,
  alternative_id VARCHAR(60) NOT NULL,
  sequence_number INT NOT NULL,
  segment_json JSON NOT NULL,
  CONSTRAINT fk_plan_segment_plan FOREIGN KEY (transport_plan_id) REFERENCES transport_plans(id),
  INDEX idx_plan_segments_plan (transport_plan_id)
);
CREATE TABLE IF NOT EXISTS optimization_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transport_plan_id BIGINT UNSIGNED NULL,
  input_json JSON NOT NULL,
  result_status VARCHAR(40) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_optimization_runs_plan (transport_plan_id)
);
CREATE TABLE IF NOT EXISTS optimization_alternatives (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  optimization_run_id BIGINT UNSIGNED NOT NULL,
  alternative_id VARCHAR(60) NOT NULL,
  result_json JSON NOT NULL,
  CONSTRAINT fk_optimization_alternative_run FOREIGN KEY (optimization_run_id) REFERENCES optimization_runs(id),
  INDEX idx_optimization_alternatives_run (optimization_run_id)
);
CREATE TABLE IF NOT EXISTS optimization_constraints (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  optimization_run_id BIGINT UNSIGNED NOT NULL,
  constraint_name VARCHAR(120) NOT NULL,
  passed BOOLEAN NOT NULL,
  detail VARCHAR(255) NOT NULL,
  CONSTRAINT fk_optimization_constraint_run FOREIGN KEY (optimization_run_id) REFERENCES optimization_runs(id),
  INDEX idx_optimization_constraints_run (optimization_run_id)
);
CREATE TABLE IF NOT EXISTS scientific_sources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organ_code VARCHAR(30) NULL,
  source_type VARCHAR(40) NOT NULL,
  title VARCHAR(255) NOT NULL,
  source_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scientific_sources_organ (organ_code)
);
CREATE TABLE IF NOT EXISTS execution_summaries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transporte_id BIGINT UNSIGNED NOT NULL,
  execucao_id VARCHAR(80) NOT NULL,
  resumo_json JSON NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_execution_summary_transport FOREIGN KEY (transporte_id) REFERENCES transportes(id),
  UNIQUE KEY uq_execution_summary (transporte_id, execucao_id)
);