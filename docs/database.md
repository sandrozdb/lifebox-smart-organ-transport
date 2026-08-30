# Banco de dados

O schema MySQL é idempotente e não executa `DROP`. O setup aplica apenas criação e migrações aditivas.

## Tabelas principais

- `transportes`: dados do transporte, status, início/fim e `execucao_atual_id`;
- `leituras`: telemetria, eixos de aceleração e `execucao_id`;
- `alertas`: ocorrências e resolução por execução;
- `eventos_rastreabilidade`: timeline, incluindo reotimização aplicada;
- `execution_summaries`: resumo persistido de cada execução concluída;
- `otimizacoes_rota`: histórico legado de otimizações ponderadas, preservado para compatibilidade;
- `organ_profiles`, `transport_plans`, `transport_plan_segments` e tabelas de `optimization_*`: estruturas do planejamento logístico atual;
- `scientific_sources`: referências catalogadas.

O resumo final consulta a execução atual pelo identificador de execução para não misturar leituras, alertas ou impactos de execuções anteriores do mesmo transporte.

Execute `npm run setup-db` depois de configurar o `.env` local. O seed demonstrativo depende de `SEED_DEMO_DATA=true`; não é obrigatório para produção.

Para o Aiven, crie previamente o banco definido em `DB_NAME`, configure as
credenciais e o TLS (`DB_SSL=true`, validação ativa e `DB_SSL_CA` com o CA em
PEM) e então execute `npm run setup-db` uma vez. O nome do banco aceita apenas
letras, números e sublinhado. O serviço não cria dados demonstrativos durante a
inicialização quando `SEED_DEMO_DATA=false`.
