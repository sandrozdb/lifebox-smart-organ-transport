# Testing and QA

## Automação atual

`npm run check` valida a sintaxe JavaScript. `npm test` executa os testes com `node:test`. O CI executa `npm ci`, `npm run check` e `npm test` em push e pull request.

A suíte cobre: perfis de órgãos e preservação, PO, rotas terrestres, helicóptero, planos multimodais e avião, segmentos e mapa, tempo/isquemia, alertas, atuadores digitais, Física, reotimização, resumo por execução, API e repositórios em memória.

Última validação local da versão final: **77 testes aprovados, 0 falhas**.

## Caso real de bug de interface

A API e os testes estavam funcionando, mas o dashboard congelava porque `renderOptimization()` tentou usar `#optimization-weights`, elemento removido. O erro `Cannot set properties of null` interrompia `refresh()`. O caso reforça que testes unitários e de integração não substituem inspeção do navegador; o fluxo atual removeu essa renderização legada e inclui validação estrutural de seletores relevantes.

## Checklist E2E manual concluído

- [x] Reiniciar; selecionar órgão; calcular plano; iniciar.
- [x] Confirmar tempo simulado, isquemia, margem e mapa.
- [x] Testar temperatura crítica e LED/buzzer; retornar a Normal.
- [x] Testar impacto, atraso, reotimização e aplicação manual.
- [x] Finalizar e conferir resumo da execução atual.

O painel técnico apresenta o resultado real desta execução no navegador integrado; as capturas correspondentes estão em `docs/evidencias/dashboard`.
