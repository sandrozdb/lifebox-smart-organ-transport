# Requisitos acadêmicos — LifeBox

| Disciplina  | Requisito                  | Implementação                             | Dashboard                | Evidência              | Status    |
| ----------- | -------------------------- | ----------------------------------------- | ------------------------ | ---------------------- | --------- |
| Eletrônica  | Lógica digital             | `digitalAlertLogic` e Logisim             | Atuadores e entradas 0/1 | circuito e capturas    | CONCLUÍDO |
| Física      | Cálculos dinâmicos         | `physicsService`                          | análise por execução     | testes de Física       | CONCLUÍDO |
| Arquitetura | GoF, SOLID e componentes   | Strategy, Observer e serviços             | painel técnico compacto  | `docs/architecture.md` | CONCLUÍDO |
| PO          | Otimização multimodal      | planos, segmentos e reotimização          | painel de planejamento   | testes e dashboard     | CONCLUÍDO |
| QA          | Testes, CI e E2E           | `node:test`, c8, Playwright e MySQL no CI | 83 testes + 4 E2E        | CI/local + evidências  | CONCLUÍDO |
| Cloud       | Publicação e DB gerenciado | estrutura cloud-ready                     | status pendente          | checklist de deploy    | PENDENTE  |

## Checagem de consistência

Para órgão, faixa, isquemia, alerta, tempo, Física e plano, verificar `config → serviço → API → dashboard → documentação`. Valores divergentes exigem justificativa explícita; os dados são acadêmicos e simulados quando não houver hardware ou infraestrutura real.
