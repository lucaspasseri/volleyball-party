# Seu lugar na areia

A seção **Expectativas** abre um mapa de Copacabana com oito áreas exploráveis. Qualquer visitante pode abrir o álbum e descobrir as atividades. Depois de responder **Vou**, o convidado pode guardar uma figurinha e voltar para mudar sua escolha.

## Arte e carregamento

| Arquivo | Uso | Dimensões | Tamanho |
| --- | --- | --- | --- |
| [Copacabana](../public/beach/copacabana.webp) | Mapa detalhado e zoom | 1536 × 1024 | 383 KiB |
| [Copacabana no celular](../public/beach/copacabana-small.webp) | Primeira vista em telas de até 700 px | 1000 × 667 | 174 KiB |
| [Turma da praia (30)](../public/beach/stickers/) | Álbum, convidados e rascunho | 256 × 256 cada | 660 KiB no total |
| [Cultura pop (26)](../public/beach/stickers/) | Álbum, convidados e rascunho | 256 × 256 cada | 541 KiB no total |

A ilustração e as figurinhas foram produzidas para o convite com o ImageGen integrado. O original do mapa tem 1536 px de largura, abaixo dos 3000 px sugeridos no brief. Os PNGs de origem ficam fora do diretório público. O navegador carrega o mapa sob demanda. O álbum tem um pacote JavaScript separado. A Turma da praia mantém os quatro filtros de atividade. Em Cultura pop, é possível ver todas as figurinhas ou filtrar por Anime, Esportes, Música e Cinema e games. As miniaturas da seleção atual carregam sob demanda. A caixa da cena reserva espaço antes de a imagem chegar. [Arte e prompt do mapa](art/copacabana.md) · [Inventário, folha original e prompt das figurinhas](art/stickers.md)

## Posicionamento e movimento

A arte, as áreas de interação e as figurinhas compartilham uma superfície de proporção 3:2. A vista inicial mostra o mapa inteiro no celular. Escolher uma área ou começar a posicionar uma figurinha amplia o mapa em telas estreitas. Com zoom, é possível deslizar a praia ou usar o botão de centralizar. Apenas o arraste iniciado sobre a própria figurinha captura o dedo.

Os polígonos e os pontos sugeridos foram traçados sobre a ilustração de 1536 × 1024 e convertidos em frações. As duas quadras têm seis posições sugeridas ao todo. Há quatro lugares à sombra do gazebo branco, quatro ao redor dos coolers, três no banco comprido e um em cada uma das duas cadeiras sob o guarda-sol. O banco menor já tem um banhista pintado. O atalho dá preferência a um ponto desocupado. No arraste, um pequeno anel aparece junto a um ponto disponível e a figurinha se acomoda ali ao soltar. Em areia livre, ela fica onde foi solta. O mesmo editor aceita toque e setas do teclado, com Shift para um passo maior. Apenas **Guardar lugar** grava a alteração. [Geometria](../lib/beach.ts) · [Catálogo](../lib/stickers.ts)

Cada figura tem um apoio próprio na cena. Pés, quadril, rodas, linha da água e projeção do salto determinam a posição visual. O mapa interpola a escala entre linhas de profundidade traçadas sobre a pintura. A conversão histórica dos centros gravados continua em uso para recuperar o mesmo ponto na praia.

Uma camada transparente recompõe partes das redes, gazebo, coolers, bancos, cadeiras e pedestres à frente de convidados mais distantes. O arraste e a seleção continuam acessíveis sobre esses recortes. O relatório reúne a leitura da câmera, as decisões para cada uma das 78 figurinhas, as capturas comparativas e as instruções para novas artes. [Perspectiva, auditoria e configuração](art/perspectiva.md)

## Persistência e privacidade

O comando de migração do ambiente instala o schema inicial e as atualizações do catálogo em ordem. Aplique as migrações pendentes antes de publicar a nova versão. O mapa e o álbum funcionam localmente sem credenciais. A gravação e a leitura de participantes usam o PostgreSQL e as sessões do Neon Auth. [Migrações e publicação](../README.md#migrações-e-publicação)

- A tabela `sticker_placements` mantém uma linha por convidado e cena. Constraints validam o catálogo, a área e os limites da posição. O ID público da figurinha é independente do ID da conta.
- A Server Action verifica a sessão e passa o ID do convidado à função `save_beach_sticker`. A função verifica e bloqueia a linha de RSVP durante a gravação e faz upsert. Somente quem respondeu `going` e está visível para a moderação pode salvar. O limite é de 20 chamadas por minuto por convidado elegível.
- O login do app pode executar somente as funções concedidas. A leitura direta das tabelas fica restrita à administração do banco. A função `beach_scene` devolve somente primeiro nome, figurinha, ponto, área e os indicadores usados pela interface.
- O consentimento de primeiro nome controla a visibilidade pública. Com a resposta privada, somente o próprio convidado vê sua figurinha no mapa. A interface informa o alcance antes da gravação.
- Uma alteração para `maybe` ou `not_going`, a retirada de consentimento ou a moderação no painel do organizador afeta a próxima leitura. A posição permanece guardada para uma futura confirmação. Os visitantes atualizam a página para ver mudanças de outras pessoas.

## Verificação

As capturas abaixo registram a versão anterior da interface com convidados fictícios do servidor de testes. A revisão de perspectiva inclui comparações nas mesmas posições e cenas com as sete coleções. [Comparação atual](art/perspectiva.md#comparação-visual)

| Dispositivo | Praia sem figurinhas | Mapa com convidados | Seleção | Posicionamento com zoom |
| --- | --- | --- | --- | --- |
| Desktop | [Vista inicial](screenshots/beach/desktop-empty.webp) | [Mapa](screenshots/beach/desktop-populated.webp) | [Álbum](screenshots/beach/desktop-album.webp) | [Arraste](screenshots/beach/desktop-dragging.webp) |
| Celular | [Vista inicial](screenshots/beach/mobile-empty.webp) | [Mapa](screenshots/beach/mobile-populated.webp) | [Álbum](screenshots/beach/mobile-album.webp) | [Arraste](screenshots/beach/mobile-dragging.webp) |

`npm test` cobre conversão de coordenadas, limites, catálogo e atalhos de área. `npm run test:e2e` verifica a página existente. `npm run test:e2e:rsvp` exercita OAuth simulado, Server Actions, seleção, arraste com zoom, toque, teclado, falha e repetição da gravação, recarga e visibilidade em uma sessão separada. O teste de banco usa PostgreSQL e os grants, funções e políticas reais da aplicação.

Para reproduzir os testes SQL, use `npm run test:db` com PostgreSQL instalado. O comando inicializa um banco descartável no computador e testa o schema e os privilégios reais.

O fluxo Google/Neon hospedado ainda requer verificação no projeto de destino.

## Coleções e publicação

O álbum do convite em `http://localhost:3000/#expectativas` reúne as mesmas 78 figurinhas públicas em desenvolvimento e produção. O botão **Todos** mostra o álbum inteiro. Os filtros de coleção rolam horizontalmente no celular. Qualquer visitante pode abrir o álbum. Guardar um lugar na cena compartilhada segue as regras de RSVP e consentimento descritas acima.

| Coleção | Figurinhas | Situação da arte |
| --- | ---: | --- |
| Turma da praia | 30 | Pública |
| Cultura pop | 26 | Pública |
| Haikyu!! | 6 | Pública |
| Dragon Ball Z | 6 | Pública |
| Lendas do Vôlei | 3 | Pública |
| Lendas do Vôlei de Praia | 3 | Pública |
| Games | 4 | Pública |

Os 22 WebP das homenagens preservam as imagens geradas de 256 × 256 px com transparência. O manifesto identifica os personagens, as seis pessoas retratadas, as referências e a situação de cada imagem. Os seis Pokémon, Mario e Luigi não tiveram imagens geradas e ficam fora da contagem de 78. [Manifesto das homenagens](art/tribute-manifest.json)

As 78 imagens estão versionadas em `public/beach/stickers/<id>.webp`. O álbum e os lugares guardados usam a mesma URL estática. Os testes verificam todos os IDs, o inventário de arquivos e o tamanho e a transparência das novas imagens.

A migração `004_tribute_stickers.sql` aceita os 78 IDs na coluna existente `sticker_id`. O catálogo é definido em TypeScript. Aplicar a migração não cria convidados, respostas nem posições. O histórico transacional impede reaplicar a mesma versão. O comando de migração deve corresponder ao destino do banco usado pelo servidor. [Migrações e publicação](../README.md#migrações-e-publicação)
