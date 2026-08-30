# Requisitos acadêmicos — LifeBox

| Disciplina  | Requisito                  | Implementação                                  | Dashboard / operação     | Evidência                   | Status    |
| ----------- | -------------------------- | ---------------------------------------------- | ------------------------ | --------------------------- | --------- |
| Eletrônica  | Lógica digital             | `digitalAlertLogic` e Logisim                  | Atuadores e entradas 0/1 | circuito e capturas         | CONCLUÍDO |
| Física      | Cálculos dinâmicos         | `physicsService`                               | análise por execução     | testes de Física            | CONCLUÍDO |
| Arquitetura | GoF, SOLID e componentes   | Strategy, Observer e serviços                  | painel técnico compacto  | `docs/architecture.md`      | CONCLUÍDO |
| PO          | Otimização multimodal      | planos, segmentos e reotimização               | painel de planejamento   | testes e dashboard          | CONCLUÍDO |
| QA          | Testes, CI e E2E           | `node:test`, c8, Playwright e MySQL no CI      | validações automatizadas | CI/local + evidências       | CONCLUÍDO |
| Cloud       | Publicação e DB gerenciado | Render + Aiven MySQL + TLS + variáveis seguras | deploy público e health  | `docs/cloud.md` + checklist | CONCLUÍDO |

## Cloud validada

O backend está publicado em `https://lifebox-expotech.onrender.com`, com banco Aiven for MySQL gerenciado, conexão TLS com CA, variáveis de ambiente fora do repositório, persistência validada após redeploy e Auto Deploy do Render a partir da branch `main`.

O GitHub Actions permanece responsável pela CI. No modo atual `On Commit`, CI e deploy são disparados pelo mesmo push e não formam um gate sequencial obrigatório; essa limitação está documentada em `docs/ci-cd.md`.

## Checagem de consistência

Para órgão, faixa, isquemia, alerta, tempo, Física e plano, verificar `config → serviço → API → dashboard → documentação`. Valores divergentes exigem justificativa explícita; os dados são acadêmicos e simulados quando não houver hardware ou infraestrutura real.
