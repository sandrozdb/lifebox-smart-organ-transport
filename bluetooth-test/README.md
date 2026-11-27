# LifeBox — teste experimental por Bluetooth BLE

**Prova de conceito separada.** O firmware de apresentação validado permanece em `firmware-real/sketch.ino`. O Wokwi e a API foram preservados; o dashboard recebeu uma fonte BLE local opcional, descrita mais abaixo.

## Objetivo

Verificar se o **ESP32 Dev Module** consegue transmitir **temperatura e impacto simulados** pelos dois potenciômetros B10K, **sem Wi-Fi**.

- GPIO34 → temperatura simulada de -2 °C a 14 °C
- GPIO35 → impacto simulado de 0 a 6 g
- Inversão dos controles mantida (`true`): valores aumentam ao girar para a direita na montagem anterior
- Transmissão BLE a cada 500 ms para o notebook, como CSV: `6.2,1.40`
- Serviço BLE: `2d514649-4c65-426f-7820-202600000001`
- Característica READ/NOTIFY: `2d514649-4c65-426f-7820-202600000002`

## Passo a passo do teste

1. Preserve uma cópia do firmware físico que funciona. Abra `bluetooth-test/bluetooth-test.ino` na Arduino IDE, usando **ESP32 by Espressif Systems core 3.x**, placa **ESP32 Dev Module**.
2. Carregue o sketch na placa, conectada por USB a uma **fonte estável**. Desconecte a alimentação antes de alterar cabos. As ligações dos dois potenciômetros permanecem as mesmas.
3. No Monitor Serial 115200, procure `LifeBox BLE anunciado` e valores como `6.2,1.40`. Se reiniciar aqui, investigue alimentação, cabo USB, placa e versão do core.
4. No **notebook com Bluetooth ligado**, abra a página de teste: `https://lifebox-expotech.onrender.com/ble-test.html` em **Chrome ou Edge**.
5. Clique **Conectar ESP32 físico**, selecione **LifeBox BLE**, e gire cada potenciômetro.
6. Os valores devem variar na página mesmo com **Wi-Fi do ESP32 desativado**. Internet pode ser necessária apenas para carregar a página do Render, não para a transmissão BLE.

**Observações:** Web Bluetooth requer HTTPS ou localhost e um navegador compatível. Não é suportado nativamente no Safari do iPhone. Se a placa tiver Arduino-ESP32 core 4.x, a API BLE mudou: use 3.x para este código de teste. Os valores simulados não são medições clínicas.

**Limite:** os dados ficam **apenas no navegador**, sem envio ao Render, MySQL ou dashboard principal. Se o BLE funcionar, a integração poderá ser planejada numa etapa posterior. Ao encerrar o teste, regrave `firmware-real/sketch.ino` na placa para restaurar OLED, LEDs, buzzer e funcionamento offline.


## NOVO: firmware completo + Bluetooth, integrado ao dashboard (EXPERIMENTAL)

O firmware de teste inicial acima continua disponível em `bluetooth-test/bluetooth-test.ino`. Para o teste completo, agora com seleção remota de órgão, use **[`lifebox-ble-full/lifebox-ble-full.ino`](lifebox-ble-full/lifebox-ble-full.ino)**.

Esse novo sketch parte da **versão offline testada** e mantém:
- OLED e a tela de abertura, seis órgãos selecionáveis pelo dashboard, temperatura, impacto, faixa térmica por órgão e acento de CENÁRIO.
- Potenciômetros no GPIO34 e GPIO35, ambos aumentando no sentido usado na montagem.
- LED verde GPIO25 e vermelho GPIO26, buzzer passivo 2 kHz no GPIO27 (sem reiniciar PWM a cada loop).
- Botão BOOT no GPIO0: 2 segundos para pausar/retomar.
- Bluetooth BLE com o **mesmo serviço/característica** já testados anteriormente, notificações a cada 500 ms.

**Novo firmware BLE v2 (necessário regravar na placa):** inicia com transporte **PAUSADO**, sem alarme. O formato agora é `temperatura,impacto,ativo,indiceOrgao,versao`, exemplo `6.2,1.40,0,0,2`. O terceiro campo indica o estado **real da caixa física**, o quarto confirma o órgão no OLED e o quinto identifica o firmware v2. O dashboard alerta quando recebe telemetria de firmware antigo, que não permite iniciar/pausar pelo navegador. A característica de comando BLE (`2d514649-4c65-426f-7820-202600000003`) recebe `START` e `PAUSE` (estado do transporte), além de HEART, LUNG, KIDNEY, LIVER, PANCREAS ou INTESTINE (órgão), com propriedade WRITE. Não usa Wi-Fi. Se ocorrer reinício com rádio BLE + OLED, volte ao sketch original e confira a alimentação; a versão ainda não foi validada na caixa completa.

### Como testar no dashboard principal

1. Na Arduino IDE, abra o novo sketch na pasta `lifebox-ble-full`, selecione **ESP32 Dev Module**, core **3.x**, e envie para a placa.
2. Com a placa alimentada, confirme que o OLED aparece e que os potenciômetros, LEDs e buzzer continuam respondendo localmente.
3. No notebook com Chrome ou Edge e Bluetooth ativo, abra `https://lifebox-expotech.onrender.com` depois do deploy.
4. Em **FONTE**, selecione **ESP32 FÍSICO**, ao lado de **SIMULADOR** e **ESP32 / WOKWI**. Essa seleção apenas revela o botão de conexão no planejamento; não abre o Bluetooth automaticamente.
5. No bloco **Planejamento Inteligente do Transporte**, escolha o órgão no seletor **ÓRGÃO** (ao lado do **CENÁRIO DE DEMONSTRAÇÃO**).
6. Clique em **Conectar ESP32 físico** (visível apenas quando a fonte ESP32 FÍSICO estiver selecionada), escolha **LifeBox BLE** na janela do navegador e conecte.
7. O OLED deve mostrar o órgão escolhido e a faixa correspondente; o dashboard confirma quando a leitura BLE confirma a alteração. A escolha continua usando o seletor de órgãos do planejamento, sem segundo seletor.
8. O ESP32 v2 começa pausado. Em **Controle do transporte**, pressione **INICIAR CAIXA FÍSICA**; isso envia `START` via BLE, sem chamar a API. O painel só mostra ATIVO quando recebe a confirmação na telemetria. Pressione **PAUSAR CAIXA FÍSICA** para enviar `PAUSE`, ou segure BOOT por 2 s para pausar/retomar localmente.
9. Gire os potenciômetros. **Temperatura** e **impacto** vêm do ESP32; **umidade, bateria e sinal são valores visuais simulados**, rotulados SIMULADO, e não medições reais. Com transporte ATIVO, temperatura fora da faixa do órgão **OU** impacto a partir de 3,5 g aciona LED vermelho e buzzer. Quando estiver pausado, nenhum dos dois aciona, mesmo que os valores sejam críticos.
10. O mesmo botão **Desconectar ESP32 físico** encerra a conexão mas mantém a fonte ESP32 FÍSICO selecionada, permitindo reconectar. **Por segurança na demonstração, perda/desconexão BLE pausa a caixa**; o botão BOOT continua disponível para operação local. Para voltar ao Simulador ou Wokwi, troque a opção em **FONTE**; a API não recebe comandos BLE.

**Limite arquitetural:** no modo BLE, **temperatura e impacto, estado do botão BOOT, sinais lógicos e alertas locais** refletem a caixa. **Umidade, bateria e sinal são números sintéticos gerados pelo navegador e claramente identificados como SIMULADO**. Mapa, rotas, gráficos históricos e timeline permanecem referentes à aplicação online e não são dados da caixa física. Nenhum dado BLE é enviado à API ou ao banco. A caixa funciona normalmente mesmo sem a conexão BLE.

### Voltar à versão segura

Abra [`../firmware-real/sketch.ino`](../firmware-real/sketch.ino) e envie novamente pela Arduino IDE. Esse arquivo **não foi alterado** por esta experiência.


### Faixas térmicas usadas pela caixa experimental

Os valores abaixo reproduzem o módulo `src/config/organProfiles.js`. São faixas do **modelo acadêmico**, não parâmetros validados para transporte clínico.

| Órgão | Código BLE | Faixa simulada |
| --- | --- | --- |
| Coração | HEART | 4–8 °C |
| Pulmão | LUNG | 0–4 °C |
| Rim | KIDNEY | 0–4 °C |
| Fígado | LIVER | 0–4 °C |
| Pâncreas | PANCREAS | 0–4 °C |
| Intestino | INTESTINE | 0–4 °C |

**Regra experimental dos atuadores (firmware BLE v2):** `TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)`, sendo `TEMPERATURA_CRITICA = temperatura < minimoOrgao OR temperatura > maximoOrgao` e `IMPACTO_CRITICO = impacto >= 3.5 g`. Os limites de temperatura são inclusivos; 3,5 g já é impacto crítico no modelo demonstrativo. LED verde indica transporte ativo e sem alerta, LED vermelho e buzzer indicam alerta; quando o BOOT pausa o transporte, ambos ficam desligados. A caixa processa essa regra localmente, mesmo se o notebook desconectar.

| Transporte ativo | Temperatura crítica | Impacto crítico | LED vermelho / Buzzer |
| --- | --- | --- | --- |
| Não | Qualquer | Qualquer | Desligados |
| Sim | Não | Não | Desligados (LED verde ligado) |
| Sim | Sim | Não | Ligados |
| Sim | Não | Sim | Ligados |
| Sim | Sim | Sim | Ligados |

**Atenção ao diagnóstico:** se o dashboard mostra impacto crítico mas a caixa não apita, confira o sketch efetivamente gravado. Alterar o GitHub não atualiza automaticamente a memória flash do ESP32. Firmware anterior podia iniciar ATIVO e acionar apenas por temperatura. Regrave `bluetooth-test/lifebox-ble-full/lifebox-ble-full.ino` na Arduino IDE e confirme no Serial a inicialização `LIFEBOX FISICA BLE PRONTA`. No BLE v2, a caixa inicia PAUSADA; não confunda o status logístico da aplicação online com o bit local do ESP32.

A escolha de órgão no **Planejamento Inteligente** é a fonte única da seleção. Quando BLE está ativo, a alteração é encaminhada ao OLED sem mudar o perfil da API/Wokwi, mesmo durante uma demonstração logística. Não existe um seletor de órgão BLE separado: primeiro escolha **ESP32 FÍSICO** em **FONTE**, depois use o botão **Conectar ESP32 físico** que aparecerá no planejamento.

**Teste físico pendente:** o código foi atualizado no repositório; compilação final, estabilidade do Bluetooth junto ao OLED/atuadores e troca real de órgão precisam ser confirmadas na placa. Se algum problema ocorrer, regrave o firmware offline preservado em `firmware-real/sketch.ino`.
