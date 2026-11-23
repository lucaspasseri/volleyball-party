# Seu lugar na areia

A seção **Expectativas** abre um mapa de Copacabana com seis áreas exploráveis. Qualquer visitante pode abrir o álbum e descobrir as atividades. Depois de responder **Vou**, o convidado pode guardar uma figurinha e voltar para mudar sua escolha.

## Arte e carregamento

| Arquivo | Uso | Dimensões | Tamanho |
| --- | --- | --- | --- |
| [Copacabana](../public/beach/copacabana.webp) | Mapa detalhado e zoom | 1536 × 1024 | 661 KiB |
| [Copacabana no celular](../public/beach/copacabana-small.webp) | Primeira vista em telas de até 700 px | 1000 × 667 | 275 KiB |
| [12 figurinhas](../public/beach/stickers/) | Álbum, convidados e rascunho | 256 × 256 cada | 305 KiB no total |

A ilustração e as figurinhas foram produzidas para o convite com o ImageGen integrado. O original do mapa tem 1536 px de largura, abaixo dos 3000 px sugeridos no brief. Os PNGs de origem ficam fora do diretório público. O navegador carrega o mapa sob demanda e o álbum tem um pacote JavaScript separado. A caixa da cena reserva espaço antes de a imagem chegar. [Arte e prompt do mapa](art/copacabana.md) · [Inventário, folha original e prompt das figurinhas](art/stickers.md)

## Posicionamento e movimento

O ponto salvo corresponde ao **centro** da figurinha na arte completa. A imagem e as sobreposições compartilham a mesma superfície de proporção 3:2. No celular, ela tem pelo menos 700 px de largura e permite rolagem nativa. O zoom aumenta as dimensões reais da superfície e mantém o ponto central da câmera. Os atalhos de área e o botão de centralizar também movimentam a câmera.

O toque converte a posição do ponteiro em coordenadas da arte com `(clientX - rect.left) / rect.width` e a expressão equivalente para Y. O retângulo é medido depois da rolagem e do zoom. No arraste, o deslocamento inicial entre o dedo e o centro da figurinha é descontado na soltura. Os offsets temporários do Motion voltam a zero ao transferir a posição para as porcentagens de layout. A caixa ocupa 6% da largura e 9% da altura. Margens de metade desses valores mantêm o desenho inteiro dentro do mapa. [Geometria e catálogo](../lib/beach.ts)

É possível usar um atalho de área, tocar num ponto, arrastar ou ajustar com as setas do teclado. Shift aumenta o passo das setas. Os atalhos sugerem espaço disponível perto da atividade. O álbum anima o contorno de seleção e a prévia ampliada. Cada área tem uma reação curta, a zona próxima acende durante o arraste e a figurinha se acomoda com uma mola após a gravação. As animações respeitam a preferência de movimento reduzido. Apenas **Guardar lugar** grava dados.

## Persistência e privacidade

Inicialize o [schema da aplicação](../db/001_initial.sql) no banco Neon. O mapa e o álbum funcionam localmente sem credenciais. A gravação e a leitura de participantes usam o PostgreSQL e as sessões do Neon Auth. [Configuração do Neon](../README.md#configuração-do-neon)

- A tabela `sticker_placements` mantém uma linha por convidado e cena. Constraints validam o catálogo, a área e os limites da posição. O ID público da figurinha é independente do ID da conta.
- A Server Action verifica a sessão. O RPC `save_beach_sticker` deriva o proprietário de `auth.uid()`, verifica e bloqueia a linha de RSVP durante a gravação e faz upsert. Somente quem respondeu `going` e está visível para a moderação pode salvar. O limite é de 20 chamadas por minuto por convidado elegível.
- O login do app pode executar somente as funções concedidas. A leitura direta das tabelas fica restrita à administração do banco. A função `beach_scene` devolve somente primeiro nome, figurinha, ponto, área e os indicadores usados pela interface.
- O consentimento de primeiro nome controla a visibilidade pública. Com a resposta privada, somente o próprio convidado vê sua figurinha no mapa. A interface informa o alcance antes da gravação.
- Uma alteração para `maybe` ou `not_going`, a retirada de consentimento ou a moderação no painel do organizador afeta a próxima leitura. A posição permanece guardada para uma futura confirmação. Os visitantes atualizam a página para ver mudanças de outras pessoas.

## Verificação

As capturas abaixo usam convidados fictícios do servidor de testes. Não há convidados de exemplo no aplicativo.

| Dispositivo | Mapa com convidados | Seleção | Posicionamento com zoom |
| --- | --- | --- | --- |
| Desktop | [Mapa](screenshots/beach/desktop-populated.webp) | [Álbum](screenshots/beach/desktop-album.webp) | [Arraste](screenshots/beach/desktop-dragging.webp) |
| Celular | [Mapa](screenshots/beach/mobile-populated.webp) | [Álbum](screenshots/beach/mobile-album.webp) | [Arraste](screenshots/beach/mobile-dragging.webp) |

`npm test` cobre conversão de coordenadas, limites, catálogo e atalhos de área. `npm run test:e2e` verifica a página existente. `npm run test:e2e:rsvp` exercita OAuth simulado, Server Actions, seleção, arraste com zoom, toque, teclado, falha e repetição da gravação, recarga e visibilidade em uma sessão separada. O teste de banco usa PostgreSQL e os grants, funções e políticas reais da aplicação.

Para reproduzir os testes SQL, use `npm run test:db` com PostgreSQL instalado. O comando inicializa um banco descartável no computador e testa o schema e os privilégios reais.

O fluxo Google/Neon hospedado ainda requer verificação no projeto de destino.
