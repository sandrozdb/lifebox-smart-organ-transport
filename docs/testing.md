# Software Testing & Quality Assurance

A referência atual de comandos, resultados, cobertura, E2E e MySQL está em [Testing and QA](testing-and-qa.md).

O projeto usa `node:test` para domínio/API, c8 para cobertura, ESLint/Prettier para qualidade estática e Playwright para interface real. O repositório em memória mantém os testes determinísticos; a integração MySQL roda de forma condicional localmente e obrigatória no CI.

Cobertura principal:

- health e endpoints;
- validação de payload e telemetria;
- motor de alertas e cooldown;
- normalização, pesos, score, inviabilidade, empate e ausência de rota válida;
- ΔT, taxa térmica, Q, aceleração, potência e energia;
- progresso, finalização e resumo;
- sintaxe de todos os arquivos JavaScript.

Casos futuros recomendados: concorrência entre múltiplos dispositivos, testes prolongados e testes visuais por comparação de pixels. Eles são evolução de QA, não funcionalidades Cloud.
