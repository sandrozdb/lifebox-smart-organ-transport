# Evidências — Eletrônica Digital LifeBox

As quatro capturas abaixo foram validadas manualmente no Logisim Evolution 4.1.0. Elas demonstram a extensão sequencial acadêmica do circuito: a detecção `EVENTO_CRITICO` continua combinacional, mas um D Flip-Flop memoriza `Q` até o reset assíncrono.

- `01-estado-normal-flipflop.png`: estado inicial, com `Q = 0` e ALERTA, LED e BUZZER desligados.
- `02-evento-critico-memorizado.png`: transporte ativo e temperatura crítica geram `EVENTO_CRITICO = 1`; após a borda de subida do CLOCK, `Q = 1`.
- `03-alerta-mantido-apos-normalizacao.png`: a condição crítica normaliza, mas `Q`, ALERTA, LED e BUZZER permanecem em `1`.
- `04-reset-flipflop.png`: `RESET = 1` limpa `Q` imediatamente, sem novo CLOCK.

O backend/Wokwi não utiliza a memória do Flip-Flop: continua aplicando a regra combinacional atual. A documentação completa e as imagens renderizadas estão em [`../../electronics-evidence.md`](../../electronics-evidence.md).
