# Hardware planejado

## ESP32
Microcontrolador responsável pela leitura dos sensores e comunicação com o sistema.

## Temperatura e umidade
Sensor DHT22 ou equivalente para monitoramento das condições internas da caixa térmica.

## Impactos e movimentação
MPU6050 para identificar movimentações bruscas, inclinação e possíveis impactos durante o transporte.

## Localização
Módulo GPS NEO-6M para obtenção de latitude e longitude durante o trajeto.

## Conectividade
No protótipo inicial, os dados poderão ser enviados via Wi-Fi. Em uma evolução futura, a conectividade móvel poderá tornar o sistema independente de redes Wi-Fi durante o transporte.

> Os componentes poderão ser ajustados ao longo do desenvolvimento conforme testes, disponibilidade e requisitos do protótipo.

---

## Estado atual do MVP

# Hardware futuro

O MVP atual não usa hardware físico. A substituição planejada é:

- temperatura/umidade: DHT22 ou equivalente adequado;
- movimento/impacto: MPU6050;
- localização: GPS NEO-6M;
- conectividade e processamento: ESP32.

Pendente: montagem, escolha elétrica, firmware definitivo, calibração, ensaios na caixa térmica, segurança do dispositivo e definição de limites por orientação técnica/médica.

