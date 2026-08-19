# Software Testing & Quality Assurance

O projeto usa o executor nativo `node:test`, evitando dependências adicionais. O repositório em memória isola testes de domínio e API; a validação final também deve testar MySQL real localmente.

Cobertura principal:

- health e endpoints;
- validação de payload e telemetria;
- motor de alertas e cooldown;
- normalização, pesos, score, inviabilidade, empate e ausência de rota válida;
- ΔT, taxa térmica, Q, aceleração, potência e energia;
- progresso, finalização e resumo;
- sintaxe de todos os arquivos JavaScript.

Casos adicionais recomendados: banco indisponível, leituras extremas, perda prolongada de sinal, concorrência de dispositivos e teste visual responsivo. O GitHub Actions executa `npm ci`, `npm run check` e `npm test` sem credenciais MySQL.

