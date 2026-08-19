# Roteiro acadêmico de demonstração (5–8 minutos)

1. Apresente o problema e deixe claro que sensores, instituições, rota e limites são simulados.
2. Mostre o diagrama em `docs/architecture.md` e as camadas do software.
3. Explique ESP32, sensor térmico, MPU6050/I2C e GPS/UART usando `docs/electronics.md`.
4. No dashboard, abra **Pesquisa Operacional** e compare as três alternativas.
5. Mostre pesos, restrições e a variável binária `xᵢ`; clique em **Calcular rota ótima**.
6. Abra **Ver cálculo** e explique normalização, parcelas ponderadas, score e inviabilidade.
7. Observe no mapa a rota recomendada destacada e as alternativas secundárias.
8. Clique em **Reiniciar** e **Iniciar**; o GPS percorrerá a rota escolhida.
9. Mostre cards, gráficos, coordenadas, progresso e dados persistidos.
10. Abra **Análise Física**: ΔT, taxa térmica, `Q=mcΔT`, aceleração resultante, `P=VI` e `E=Pt`.
11. Ative **Temperatura crítica**, aguarde o alerta e mostre a timeline.
12. Ative **Normal** e depois **Impacto**; explique os eixos simulados do MPU6050.
13. Explique que Repository e Service Layer separam banco, regras e interface.
14. Mostre `docs/cloud.md`, Docker, health check e configuração por ambiente.
15. Mostre `docs/testing.md` e o resultado de `npm test`.
16. Clique em **Finalizar transporte** e apresente o resumo como condições monitoradas, sem afirmação clínica.

Sem internet, o mapa-base pode não aparecer, mas API, MySQL, coordenadas, otimização, Física, alertas e timeline continuam funcionando.
