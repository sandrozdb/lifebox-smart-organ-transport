# CI/CD

## CI implementada

O workflow em .github/workflows/ci.yml é executado em push e pull request. Ele executa, nesta ordem:

1. npm ci;
2. npm run check;
3. npm test.

Assim, mudanças só chegam ao repositório depois de uma validação automatizada básica de instalação, sintaxe e testes.

## CD futuro

O arquivo .github/workflows/cd-template.yml é apenas um modelo desabilitado. Nenhum deploy é acionado por ele.

Quando houver escolha de provedor, o fluxo previsto será:

1. CI aprovada;
2. build da imagem ou aplicação;
3. autenticação segura por secrets;
4. deploy no ambiente escolhido;
5. verificação de GET /api/health;
6. registro do resultado e monitoramento.

A ativação depende de configurar a autenticação, a URL pública, o banco gerenciado e os secrets reais. Não há deploy de produção realizado neste repositório.
