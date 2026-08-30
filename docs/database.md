# Banco de dados

O schema MySQL é idempotente e não executa `DROP`. O setup aplica apenas criação e migrações aditivas.

## Produção atual

A produção usa Aiven for MySQL com o banco `lifebox_db`. O schema já foi aplicado com `npm run setup-db`, a aplicação no Render conecta via TLS com validação de CA e a persistência foi validada após redeploy do serviço.

`SEED_DEMO_DATA=false` é mantido em produção. O seed foi ativado temporariamente apenas para criar o transporte demonstrativo inicial; depois foi desativado novamente e os dados permaneceram no Aiven após novo deploy.

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

## Setup local ou de um novo ambiente

Execute `npm run setup-db` depois de configurar as variáveis de banco. O seed demonstrativo depende de `SEED_DEMO_DATA=true` e não é obrigatório para produção.

Para Aiven, o banco definido em `DB_NAME` deve existir previamente. Configure credenciais e TLS (`DB_SSL=true`, validação ativa e `DB_SSL_CA` com o CA em PEM) e então execute `npm run setup-db` uma vez. O nome do banco aceita apenas letras, números e sublinhado.

O serviço não cria dados demonstrativos durante a inicialização quando `SEED_DEMO_DATA=false`.

## Limites atuais

O Aiven está acessível pela internet pública com TLS. Restrição de rede/IP, usuário MySQL dedicado de menor privilégio, política formal de rotação de senha e estratégia de backup são melhorias de hardening futuras e devem ser aplicadas antes de qualquer uso além da demonstração acadêmica.
