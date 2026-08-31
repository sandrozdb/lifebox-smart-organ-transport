# Banco de dados

O schema MySQL é idempotente e não executa `DROP`. O setup aplica criação e migrações aditivas.

## Produção acadêmica atual

A aplicação pública usa **Aiven for MySQL** com o banco `lifebox_db`. O schema foi aplicado com `npm run setup-db`, o backend no Render conecta via TLS com validação de CA e a persistência foi validada após redeploy.

`SEED_DEMO_DATA=false` é mantido no ambiente publicado. O seed foi ativado temporariamente apenas para criar o transporte demonstrativo inicial; depois foi desativado novamente e os dados permaneceram no Aiven.

## Telemetria IoT e execução

Cada transporte mantém `execucao_atual_id`. Quando uma leitura física do ESP32/Wokwi chega ao backend, `telemetryService` associa a leitura ao identificador da execução ativa antes de chamar o repository.

O dispositivo não é autoridade sobre esse vínculo. Mesmo que um cliente envie `executionId`, o backend usa o valor obtido a partir do transporte.

Isso permite que:

- `GET /transportes/:id/leituras` filtre a execução atual;
- a Análise Física use somente as leituras da viagem corrente;
- o resumo final agregue a telemetria da execução concluída;
- viagens anteriores do mesmo transporte não contaminem a análise atual.

## Tabelas principais

- `transportes`: dados do transporte, status, início/fim e `execucao_atual_id`;
- `leituras`: telemetria, eixos de aceleração e `execucao_id`;
- `alertas`: ocorrências e resolução por execução;
- `eventos_rastreabilidade`: timeline, incluindo reotimização aplicada;
- `execution_summaries`: resumo persistido de cada execução concluída;
- `otimizacoes_rota`: histórico legado de otimizações ponderadas, preservado para compatibilidade;
- `organ_profiles`, `transport_plans`, `transport_plan_segments` e tabelas de `optimization_*`: estruturas do planejamento logístico atual;
- `scientific_sources`: referências catalogadas.

## Setup local ou de um novo ambiente

Execute `npm run setup-db` depois de configurar as variáveis de banco. O seed demonstrativo depende de `SEED_DEMO_DATA=true` e não é obrigatório para produção.

Para Aiven, o banco definido em `DB_NAME` deve existir previamente. Configure credenciais e TLS (`DB_SSL=true`, validação ativa e `DB_SSL_CA` com o CA em PEM) e execute `npm run setup-db` uma vez. O nome do banco aceita apenas letras, números e sublinhado.

O serviço não cria dados demonstrativos durante a inicialização quando `SEED_DEMO_DATA=false`.

## Segurança

Credenciais, senha e certificado CA não são versionados. O Render injeta os valores de conexão em runtime.

## Limites atuais

O Aiven está acessível pela infraestrutura configurada para a demonstração com TLS. Restrição de rede/IP, usuário MySQL dedicado de menor privilégio, política formal de rotação de senha e estratégia de backup são melhorias de hardening futuras e devem ser aplicadas antes de qualquer uso além da demonstração acadêmica.

Detalhes complementares: [`cloud.md`](cloud.md), [`cloud-secrets.md`](cloud-secrets.md) e [`iot.md`](iot.md).
