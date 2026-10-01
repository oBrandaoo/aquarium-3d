# Aquário Noturno

Experiência submersa em Three.js. Nade pelo aquário e encontre cinco peixes luminosos. Cada peixe permanece perto de um ponto fixo por uma mola amortecida e reage à passagem do nadador.

## Executar

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:5173/`.

## Controles

- **Computador:** W A S D para nadar, mouse para olhar, Espaço para subir, Ctrl para descer, Shift para acelerar e E para emitir um pulso. Clique na água para capturar o mouse.
- **Celular:** controle à esquerda para nadar, arraste a metade direita para olhar, setas para subir e descer, botão circular para emitir um pulso.

Um peixe é registrado no diário quando você se aproxima dele. A cena inclui vegetação animada, corais, partículas e iluminação noturna. O botão `?` abre as instruções durante a exploração.

## Verificação

```bash
npm run build
npm run test:smoke
```

O teste usa Microsoft Edge instalado na máquina para conferir renderização, início, pulso, descoberta por nado e controles móveis. As capturas geradas são `preview-playing.png` e `preview-touch.png`.
