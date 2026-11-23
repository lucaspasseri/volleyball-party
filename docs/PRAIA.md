# Seu lugar na areia

A seção **Expectativas** abre um mapa de Copacabana com oito áreas exploráveis. Qualquer visitante pode abrir o álbum e descobrir as atividades. Depois de responder **Vou**, o convidado pode guardar uma figurinha e voltar para mudar sua escolha.

## Arte e carregamento

| Arquivo | Uso | Dimensões | Tamanho |
| --- | --- | --- | --- |
| [Copacabana](../public/beach/copacabana.webp) | Mapa detalhado e zoom | 1536 × 1024 | 383 KiB |
| [Copacabana no celular](../public/beach/copacabana-small.webp) | Primeira vista em telas de até 700 px | 1000 × 667 | 174 KiB |
| [30 figurinhas](../public/beach/stickers/) | Álbum, convidados e rascunho | 256 × 256 cada | 687 KiB no total |

A ilustração e as figurinhas foram produzidas para o convite com o ImageGen integrado. O original do mapa tem 1536 px de largura, abaixo dos 3000 px sugeridos no brief. Os PNGs de origem ficam fora do diretório público. O navegador carrega o mapa sob demanda. O álbum tem um pacote JavaScript separado e carrega as miniaturas da atividade aberta (Vôlei, Praia e mar, Sossego ou Festa). A caixa da cena reserva espaço antes de a imagem chegar. [Arte e prompt do mapa](art/copacabana.md) · [Inventário, folha original e prompt das figurinhas](art/stickers.md)

## Posicionamento e movimento

A arte, as áreas de interação e as figurinhas compartilham uma superfície de proporção 3:2. A vista inicial mostra o mapa inteiro no celular. Escolher uma área ou começar a posicionar uma figurinha amplia o mapa em telas estreitas. Com zoom, é possível deslizar a praia ou usar o botão de centralizar. Apenas o arraste iniciado sobre a própria figurinha captura o dedo.

Os polígonos e os pontos sugeridos foram traçados sobre a ilustração de 1536 × 1024 e convertidos em frações. As duas quadras têm seis posições sugeridas ao todo. Há quatro lugares à sombra do gazebo branco, quatro ao redor dos coolers, três no banco comprido e um em cada uma das duas cadeiras sob o guarda-sol. O banco menor já tem um banhista pintado. O atalho dá preferência a um ponto desocupado. No arraste, um pequeno anel aparece junto a um ponto disponível e a figurinha se acomoda ali ao soltar. Em areia livre, ela fica onde foi solta. O mesmo editor aceita toque e setas do teclado, com Shift para um passo maior. Apenas **Guardar lugar** grava a alteração. [Geometria e catálogo](../lib/beach.ts)

As posições de interação usam a borda inferior visível de cada desenho. O aplicativo converte esse ponto no centro do quadrado antes de salvar. Na leitura, faz a conversão inversa com a largura definida pela área e a margem transparente da figurinha. Assim, os centros normalizados e os seis identificadores de área já gravados continuam válidos sem recalcular as posições. O ID histórico `torcida` identifica os bancos e `beira-mar` identifica a areia livre. As áreas Mar e Calçadão têm pontos livres para banhistas e pedestres.

A sombra e a ordem de desenho seguem o ponto de apoio. Como redes, bancos e cadeiras fazem parte da pintura, a ilustração não encobre partes da figurinha. As sugestões evitam sobreposições com convidados visíveis e a disponibilidade pode mudar com novas confirmações.

## Persistência e privacidade

Em um banco novo, aplique o [schema inicial](../db/001_initial.sql) e a [migração do álbum](../db/002_beach_collection.sql), nessa ordem. Em um banco que já usa o schema inicial, aplique apenas a migração do álbum. O mapa e o álbum funcionam localmente sem credenciais. A gravação e a leitura de participantes usam o PostgreSQL e as sessões do Neon Auth. [Configuração do Neon](../README.md#configuração-do-neon)

- A tabela `sticker_placements` mantém uma linha por convidado e cena. Constraints validam o catálogo, a área e os limites da posição. O ID público da figurinha é independente do ID da conta.
- A Server Action verifica a sessão. O RPC `save_beach_sticker` deriva o proprietário de `auth.uid()`, verifica e bloqueia a linha de RSVP durante a gravação e faz upsert. Somente quem respondeu `going` e está visível para a moderação pode salvar. O limite é de 20 chamadas por minuto por convidado elegível.
- O login do app pode executar somente as funções concedidas. A leitura direta das tabelas fica restrita à administração do banco. A função `beach_scene` devolve somente primeiro nome, figurinha, ponto, área e os indicadores usados pela interface.
- O consentimento de primeiro nome controla a visibilidade pública. Com a resposta privada, somente o próprio convidado vê sua figurinha no mapa. A interface informa o alcance antes da gravação.
- Uma alteração para `maybe` ou `not_going`, a retirada de consentimento ou a moderação no painel do organizador afeta a próxima leitura. A posição permanece guardada para uma futura confirmação. Os visitantes atualizam a página para ver mudanças de outras pessoas.

## Verificação

As capturas abaixo usam convidados fictícios do servidor de testes. Não há convidados de exemplo no aplicativo.

| Dispositivo | Praia sem figurinhas | Mapa com convidados | Seleção | Posicionamento com zoom |
| --- | --- | --- | --- | --- |
| Desktop | [Vista inicial](screenshots/beach/desktop-empty.webp) | [Mapa](screenshots/beach/desktop-populated.webp) | [Álbum](screenshots/beach/desktop-album.webp) | [Arraste](screenshots/beach/desktop-dragging.webp) |
| Celular | [Vista inicial](screenshots/beach/mobile-empty.webp) | [Mapa](screenshots/beach/mobile-populated.webp) | [Álbum](screenshots/beach/mobile-album.webp) | [Arraste](screenshots/beach/mobile-dragging.webp) |

`npm test` cobre conversão de coordenadas, limites, catálogo e atalhos de área. `npm run test:e2e` verifica a página existente. `npm run test:e2e:rsvp` exercita OAuth simulado, Server Actions, seleção, arraste com zoom, toque, teclado, falha e repetição da gravação, recarga e visibilidade em uma sessão separada. O teste de banco usa PostgreSQL e os grants, funções e políticas reais da aplicação.

Para reproduzir os testes SQL, use `npm run test:db` com PostgreSQL instalado. O comando inicializa um banco descartável no computador e testa o schema e os privilégios reais.

O fluxo Google/Neon hospedado ainda requer verificação no projeto de destino.
