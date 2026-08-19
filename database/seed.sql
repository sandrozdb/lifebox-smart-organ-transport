USE lifebox_db;

INSERT INTO transportes (
  codigo_transporte, identificador_caixa, tipo_orgao, hospital_origem, hospital_destino,
  latitude_origem, longitude_origem, latitude_destino, longitude_destino,
  inicio_transporte, status
) VALUES (
  'DEMO-SP-001', 'LIFEBOX-001', 'Órgão demonstrativo',
  'Hospital Acadêmico Aurora (fictício)', 'Centro Médico Horizonte (fictício)',
  -23.5616840, -46.6559810, -23.5983930, -46.6769420,
  NOW(), 'EM_ANDAMENTO'
) ON DUPLICATE KEY UPDATE identificador_caixa = VALUES(identificador_caixa);

SET @transporte_id = (SELECT id FROM transportes WHERE codigo_transporte = 'DEMO-SP-001');
INSERT INTO eventos_rastreabilidade (transporte_id, tipo_evento, descricao, latitude, longitude)
SELECT @transporte_id, 'TRANSPORTE_INICIADO', 'Transporte demonstrativo preparado para simulação.', -23.5616840, -46.6559810
WHERE NOT EXISTS (SELECT 1 FROM eventos_rastreabilidade WHERE transporte_id=@transporte_id);

