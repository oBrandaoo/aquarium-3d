# Aquário Noturno

Experiência submersa em Three.js. Nade dentro de uma redoma de vidro e encontre nove espécies marinhas presentes no Brasil: sargento, borboleta-listrada, cirurgião-azul, peixe-frade, salema, budião-azul, mero, peixe-porco e cavalo-marinho. Os modelos usam silhuetas e padrões de cor próprios de cada espécie. Cada peixe permanece perto de um ponto fixo por uma mola amortecida, com uma rotina de movimento própria e reação à passagem do nadador.

## Executar

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:5173/`.

## Controles

- **Computador:** W A S D para nadar na direção da câmera (inclusive para cima ou para baixo ao olhar), mouse para olhar, Espaço para subir, Ctrl para descer, Shift para acelerar, E para emitir um pulso direcional, L para alternar a lanterna, G para abrir o diário, F para rever a última ficha, R para explorar um habitat próximo, P para fotografar e M para alternar o som. Clique na água para capturar o mouse; mire e clique em um peixe descoberto para abrir sua ficha.
- **Celular:** controle à esquerda para nadar, arraste a metade direita para olhar, setas para subir e descer, botão ✦ para a lanterna e ◎ para o sonar. Toque no ícone de câmera para fotografar, em um peixe descoberto para abrir sua ficha ou em “Explorar habitat” perto de um marco luminoso. O botão ♪ alterna o som.

Um peixe é registrado no diário quando você se aproxima dele ou o fotografa de perto. Sua ficha mostra nome científico, ocorrência no Brasil, habitat, marcas para identificação, comportamento na redoma e um link para a fonte. O diário tem abas para as fichas, os três habitats visitados e um álbum com uma fotografia por espécie; as fotos podem ser baixadas. O progresso e as imagens são salvos no armazenamento deste navegador. O sonar indica a direção e distância do peixe ainda não encontrado mais próximo. Três marcos apresentam recifes de Abrolhos, costões rochosos e a Costa das Algas, com fontes do ICMBio. O som opcional é sintetizado no navegador, com ambiente submerso e bolhas posicionadas nos marcos. A redoma mostra reflexos e uma ondulação quando o nadador encosta no vidro. O botão `?` abre as instruções durante a exploração.

## Verificação

```bash
npm run build
npm run test:movement
npm run test:smoke
```

O teste usa Microsoft Edge instalado na máquina para conferir renderização, início, sonar, habitat, descoberta por nado, fotografia, álbum, progresso salvo, diário, alternância de som, contato com a redoma, lanterna e controles móveis. As capturas geradas incluem `preview-playing.png`, `preview-species.png`, `preview-habitat.png`, `preview-habitat-marker.png`, `preview-journal.png`, `preview-photo.png`, `preview-glass.png` e `preview-touch.png`.
