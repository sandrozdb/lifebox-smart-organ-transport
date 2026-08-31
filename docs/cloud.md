# Cloud e infraestrutura — concluída

## Arquitetura publicada

```text
ESP32/Wokwi / Dashboard
          ↓ HTTPS
Render Web Service (Node.js + Express)
          ↓ MySQL/TLS
Aiven for MySQL
```

**Status: CONCLUÍDA E VALIDADA.** O backend atualmente usado pelo firmware IoT está publicado em:

- aplicação: https://lifebox-expotech-iot-test.onrender.com
- health check: https://lifebox-expotech-iot-test.onrender.com/api/health

O serviço está conectado ao Aiven for MySQL, com persistência por execução, TLS com validação de CA e Auto Deploy do Render a partir da branch `main`.

A documentação antiga usava `https://lifebox-expotech.onrender.com` durante a primeira etapa Cloud. O fluxo IoT oficial e o firmware atual usam `https://lifebox-expotech-iot-test.onrender.com`; por isso esta é a referência pública adotada na documentação final.

## Implementado e validado

- backend Node.js/Express publicado no Render;
- frontend servido pelo mesmo Express em HTTPS;
- Web Service construído a partir do `Dockerfile`;
- uso de `process.env.PORT` no ambiente Render;
- health check público em `/api/health`;
- MySQL gerenciado no Aiven conectado ao backend;
- conexão Render → Aiven protegida por TLS e certificado CA;
- variáveis de ambiente e credenciais fora do repositório;
- `.env` ignorado e `.env.example` sem credenciais reais;
- banco `lifebox_db` com schema aplicado via `npm run setup-db`;
- persistência confirmada após redeploy;
- `SEED_DEMO_DATA=false` mantido no ambiente publicado após criação inicial controlada;
- CI no GitHub Actions com check, lint, formatação, testes, cobertura, E2E, integração MySQL e build Docker;
- Auto Deploy do Render validado em commits reais da `main`;
- fluxo ESP32/Wokwi → Render → Aiven → Dashboard validado;
- gráficos, Física e resumo final alimentados por telemetria IoT persistida;
- condições logísticas e reotimização validadas durante execução em modo IOT.

## Render

Configuração do Web Service:

- runtime: Docker;
- branch: `main`;
- plano: Free;
- build: `Dockerfile` com instalação das dependências de produção;
- start: `npm start`;
- health check path: `/api/health`;
- Auto Deploy: `On Commit`;
- serviço público atual: https://lifebox-expotech-iot-test.onrender.com.

O plano gratuito pode entrar em inatividade. A primeira requisição após um período ocioso pode sofrer cold start. Isso não apaga os dados persistidos no Aiven.

## Aiven for MySQL

A produção acadêmica usa **Aiven for MySQL** com o banco `lifebox_db`.

O schema é aplicado de forma aditiva com `npm run setup-db`; o script não executa `DROP`. O seed demonstrativo só é executado quando `SEED_DEMO_DATA=true`.

A conexão usa:

- `DB_DRIVER=mysql`;
- `DB_SSL=true`;
- `DB_SSL_REJECT_UNAUTHORIZED=true`;
- `DB_SSL_CA` com o certificado CA fornecido pelo Aiven;
- demais credenciais configuradas exclusivamente no ambiente do Render.

O repositório não documenta senha, string de conexão privada ou conteúdo do certificado.

## Persistência por execução

As leituras IoT são associadas server-side ao `execucao_atual_id` do transporte antes da gravação. Isso permite que gráficos, Física e resumo final consultem somente a telemetria da viagem atual.

A arquitetura de persistência mantém no MySQL:

- transportes;
- leituras/telemetria;
- alertas;
- eventos de rastreabilidade;
- resumos de execução;
- estruturas de planejamento e fontes acadêmicas.

Mais detalhes em [`database.md`](database.md) e [`iot.md`](iot.md).

## CI/CD validado

A CI #84 foi concluída com sucesso em 31/08/2026 após a integração das Condições Logísticas ao modo IOT. O workflow validou formatação, suíte Node, cobertura, 5 fluxos Playwright E2E, integração MySQL e build Docker.

O Render permanece configurado com Auto Deploy `On Commit`. CI e deploy são disparados pelo mesmo push; o deploy não aguarda obrigatoriamente a CI terminar. Essa limitação está documentada em [`ci-cd.md`](ci-cd.md).

## Evidências visuais

A pasta [`evidencias/cloud`](evidencias/cloud/README.md) está preparada para receber as capturas finais de Render, Aiven, health check, CI e dashboard público sem expor segredos.

## Melhorias operacionais futuras

- usuário MySQL dedicado de menor privilégio;
- restrição de rede/IP quando compatível com o provedor;
- política formal de rotação de credenciais;
- estratégia dedicada de backup;
- observabilidade e alertas externos;
- gate explícito de CI antes do deploy.

Esses itens são hardening para um cenário além da demonstração acadêmica e não impedem a conclusão da etapa atual de Cloud Computing.
