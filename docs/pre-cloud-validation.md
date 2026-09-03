# Fechamento pré-cloud — validação de 29/08/2026

> **Registro histórico.** Este documento descreve o estado do projeto em 29/08/2026. As referências a Cloud e Wokwi pendentes são históricas. Para o estado atual, consulte [IoT](iot.md), [Cloud](cloud.md) e o [README do firmware](../firmware/README.md).

## Escopo e base de publicação

O dashboard permaneceu visualmente congelado. A única mudança funcional desta etapa foi a correção do fluxo de `recommendationId` em `public/js/planning.js`; os demais ajustes nos cinco arquivos apontados pelo Prettier foram exclusivamente de formatação automática.

HEAD local inicial: `cb3471de3310c72fca0a1662d3ab9366babca7d2`. HEAD remoto usado como base limpa: `7c8faa8fa27033eb175db66f7b7205c71dbf2430`. A publicação final deve ser fast-forward, com `force=false`.

Cloud e Wokwi continuam **PENDENTES** e não foram implementados.

## Resultado local

| Gate                   | Resultado                                                  |
| ---------------------- | ---------------------------------------------------------- |
| `npm ci`               | aprovado com cache isolado em `work/`                      |
| `npm run check`        | aprovado                                                   |
| `npm run lint`         | aprovado                                                   |
| `npm run format:check` | aprovado                                                   |
| `npm test`             | 95 descobertos; 94 aprovados; 0 falhas; 1 ignorado         |
| `npm run coverage`     | 87,59% lines/statements; 80,82% branches; 93,16% functions |
| `npm run e2e`          | 4/4 cenários aprovados                                     |
| MySQL local            | serviço ativo, mas autenticação não configurada            |
| Docker local           | CLI não instalada                                          |
| `npm audit`            | 0 vulnerabilidades                                         |

## Correção funcional e segurança

A causa do HTTP 422 era uma condição de corrida: a condição logística podia ser acionada enquanto o início assíncrono da execução terminava, e `render()` criava uma recomendação apenas no cliente, sem o `recommendationId` retornado pela API. O frontend agora mantém somente a recomendação server-side ativa, armazena seu ID e validade, envia exclusivamente `{ transporteId, recommendationId }` e limpa o estado após aplicação, expiração, invalidação ou reinício.

O backend não foi enfraquecido. Ele continua localizando a recomendação server-side, verificando transporte, execução, plano atual e expiração, rejeitando replay e revalidando o plano antes da aplicação. IDs ausentes, inválidos ou pertencentes a outro contexto continuam rejeitados.

Na prova manual em navegador real, a API gerou um UUID, a aplicação respondeu HTTP 200, o plano ativo mudou, a recomendação desapareceu e posição, caminho e isquemia foram preservados. Nenhum erro de página foi registrado e não houve novo HTTP 422.

## Validação visual e responsiva

- As 20 evidências do dashboard foram abertas e verificadas individualmente.
- As evidências 11, 12 e 18 foram recapturadas após a correção.
- Os mapas usam Leaflet e tiles OpenStreetMap completos de 256 px.
- Não houve overflow horizontal em 1920×1080, 1600×900, 1366×768, 1280×720 ou 768×900.
- Mapa, planejamento, apresentação, lógica digital e atuadores permaneceram visíveis nos cinco tamanhos.
- Nenhum `pageerror` ou erro de console foi observado na auditoria responsiva.
- As quatro evidências do Logisim continuam coerentes: normal 1,0,0 → 0; temperatura crítica → 1; impacto crítico → 1; transporte inativo → 0.

## Limitações locais e validação remota

Nenhuma credencial foi adicionada. A integração MySQL não pôde ser executada localmente com segurança e o Docker não está instalado. O [GitHub Actions do commit funcional](https://github.com/sandrozdb/lifebox-smart-organ-transport/actions/runs/33267415277) supriu esses dois gates e terminou com sucesso:

- MySQL 8.4 saudável, schema aplicado e teste de persistência/isolamento por execução aprovado;
- Chromium instalado e 4/4 cenários Playwright aprovados;
- imagem Docker construída com digest `sha256:fc35b62a370475d59941b844468fcc5b252c55a8bef78fecd797ad13f25bd1cc`.

## Veredito

O pré-cloud está fechado: gates locais aprovados, `main` atualizada por fast-forward, CI remoto verde, evidências coerentes e bloqueio de reotimização resolvido sem mudança visual. Cloud e Wokwi permanecem pendentes por decisão de escopo.
