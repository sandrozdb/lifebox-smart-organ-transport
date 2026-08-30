# CI/CD

## CI implementada

O workflow em `.github/workflows/ci.yml` é executado em push e pull request. Ele executa, nesta ordem:

1. npm ci;
2. instalação do Chromium;
3. check, lint e verificação de formatação;
4. testes e cobertura;
5. testes E2E;
6. aplicação do schema em um MySQL isolado da CI;
7. teste de integração MySQL;
8. build do Dockerfile.

Assim, mudanças só chegam ao repositório depois de uma validação automatizada básica de instalação, sintaxe e testes.

## CD planejado no Render

O arquivo `.github/workflows/cd-template.yml` permanece desabilitado e não
aciona deploy. O CD escolhido será o auto deploy nativo do Render a partir da
branch `main`, sem credenciais do Aiven nos workflows públicos.

O fluxo previsto será:

1. CI aprovada;
2. build da imagem ou aplicação;
3. Render inicia o deploy conectado ao repositório;
4. variáveis e secrets são injetados pelo painel do Render;
5. verificação de GET /api/health;
6. registro do resultado e monitoramento.

A ativação depende de criar o serviço Render, conectar o Aiven, configurar as
variáveis e validar a URL pública. **Status: PENDENTE DE DEPLOY.**
