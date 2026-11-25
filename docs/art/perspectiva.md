# Perspectiva da praia

## Leitura da pintura

A referência é a [imagem servida pela aplicação](../../public/beach/copacabana.webp), de 1536 × 1024 px. A câmera está elevada, no calçadão, olhando por cima dos assentos em direção ao mar. Vemos o tampo dos coolers e do banco, o tecido dos assentos e boa parte da areia entre as linhas das quadras. O horizonte marítimo fica em torno de y = 100 (10% da altura). A orla e a cidade recuam para a direita, perto de (1470, 112).

A perspectiva é ilustrada. Prolongar as laterais da primeira quadra dá um cruzamento por volta de (240, 120). As laterais da segunda convergem muito mais acima, fora do quadro. As transversais quase paralelas apontam para muito além da borda direita. Esses cruzamentos são aproximações locais. Forçar todas as linhas a um ponto de fuga produziria escalas incompatíveis com os banhistas que o artista pintou.

| Plano | Indício na pintura | Consequência para posicionar |
| --- | --- | --- |
| Mar e beira da água | Ondas estreitas e famílias pequenas. A faixa de areia molhada sobe para a direita. | Silhuetas pequenas, contato na superfície e leitura do gesto mesmo de longe. |
| Quadras | Os postes da rede esquerda tocam a areia em y ≈ 516 e 476. A borda próxima da quadra desce para a esquerda. | O tamanho muda mesmo num arraste horizontal. O pé projetado decide de que lado da rede está o jogador. |
| Gazebo e coolers | Convidados ao lado da tenda medem aproximadamente 125–145 px. É possível ver a tampa das caixas e a areia sombreada sob o teto. | A figura escurece gradualmente à sombra. Teto, postes e caixas voltam a cobrir figuras que passam atrás. |
| Areia, banco e cadeiras | O banco longo está vazio. As duas cadeiras grandes oferecem assentos próximos de (1112, 824) e (1352, 844). A cadeira da leitora e o banco curto já têm ocupantes. | Usar o quadril de quem senta de pernas cruzadas. Convidados com cadeira própria precisam de areia livre ao lado da mobília. |
| Calçadão | A borda do mosaico desce para a direita. Os três pedestres medem cerca de 320–365 px, bem maiores que a turma do gazebo. | A escala cresce até o primeiro plano. Os pedestres também podem encobrir quem fica atrás deles. |

O sol alto vem da direita. As sombras se estendem para a esquerda e um pouco para cima na imagem, como se vê junto aos postes e pés dos pedestres. A sombra do toldo é ampla e acinzentada. O contato no sol é mais escuro perto do apoio e perde definição com a distância.

## Escala, apoio e interação

As linhas transversais da pintura definem um campo contínuo de profundidade. Para cada pé, a função interpola a altura das duas linhas vizinhas naquele x e calcula sua posição entre elas. A largura de um adulto é uma fração da largura da arte. Os limites, as medidas das linhas e os tamanhos relativos ficam em [beach-perspective.ts](../../lib/beach-perspective.ts). Uma mascote pequena, o corpo agachado e os braços erguidos podem ter alturas bem diferentes na mesma posição.

O pivô tem duas coordenadas normalizadas do WebP. Um salto acrescenta distância vertical entre a silhueta e seu apoio projetado. A sombra acompanha esse apoio, inclusive durante o arraste. Cada banco, rede ou pessoa em primeiro plano usa a mesma função de profundidade dos convidados. O atlas transparente contém recortes dos pixels da pintura. A máscara da rede preserva os vãos entre os fios. O rótulo de seleção e o controle de arraste têm camadas independentes.

O banco de dados mantém os centros históricos. A conversão em [beach.ts](../../lib/beach.ts) recupera o ponto na praia com a largura e o apoio da versão original. Tanto a leitura de um registro antigo quanto a gravação de um novo usam esse mesmo contrato. A geometria de exibição pode evoluir sem deslocar o lugar escolhido.

## Auditoria das sete coleções

A revisão considera o desenho anterior à intervenção. As 78 imagens foram vistas sobre areia clara e medidas pelo canal alfa do WebP final. As figuras usam luz quente, contorno gráfico e em geral vista frontal ou de três quartos. Todas preservam transparência. A moldura quadrada acomoda braços, acessórios e gestos diagonais, portanto sua borda inferior nem sempre marca o apoio. A coluna final registra a característica que determinou a decisão para cada desenho.

**C** indica compatível com a câmera. **A** indica ajustável por apoio, tamanho, sombra ou altura. **R** indica regeneração necessária. O inventário reúne 16 compatíveis, 58 ajustáveis e quatro que exigiam regeneração. As quatro figuras R receberam pernas e pés em novos recortes de corpo inteiro. As demais mantêm o WebP original.


### Turma da praia

| ID | Classe | Leitura e decisão |
| --- | --- | --- |
| `levantadora` | R | A regata azul terminava no busto. Completar a base de passe, mantendo bola acima da cabeça e braços estendidos. |
| `foguete` | A | Corrida lateral com pernas em tesoura. Apoio entre os passos e sombra curta de corredor. |
| `paredao` | C | Base larga e barba de frente, joelhos dobrados, mãos acima dos ombros. Os dois pés sustentam o bloqueador. |
| `siri` | A | Pinça e bola dominam a composição. Reduzir à escala de mascote e apoiar nas patas centrais. |
| `capita` | R | O cós do short formava um corte reto. Manter faixa coral, bola no quadril e mão na cintura, completar a postura em contrapposto. |
| `mergulho` | A | Defesa quase horizontal, antebraços à frente dos joelhos. Projetar o tronco sobre a areia e separar a sombra. |
| `saque` | A | Jogadora de perfil com bola alcançada de um lado. Considerar o alcance do braço na altura total. |
| `cortada` | A | Mão e bola no alto à direita, pés recuados para a esquerda. Projetar o salto sob o corpo. |
| `manchete` | A | Pose baixa com base larga e bola lateral. Reduzir a altura de postura e apoiar entre os pés. |
| `largadinha` | A | Os dois calcanhares estão suspensos, com o alcance acima da cabeça. Dar folga entre sola e areia. |
| `bloqueio` | A | Os dois joelhos dobram para trás. Elevar a silhueta sem elevar a sombra ou a ordem de profundidade. |
| `salva-vidas` | R | A figura terminava no short. Completar as pernas, preservar boné, apito e boia sob o braço. |
| `surfista` | R | A prancha e as pernas tinham corte horizontal. Completar a prancha até a areia ao lado dos pés, mantendo a flor e a canga. |
| `gaivota` | A | Asas abertas, chapéu alto e patas finas. Reduzir a estatura para caber junto aos banhistas. |
| `tchibum` | A | Corpo diagonal com mãos entrando primeiro na água. Contato junto à ponta dos dedos. |
| `crawl` | A | Tronco de lado, braço em escorço e onda já desenhada. Ancorar na espuma e suavizar a borda na água. |
| `embaixadinha` | A | Um pé sustenta o corpo e o outro sobe até a bola. Deslocar o pivô ao pé plantado. |
| `calcadao` | A | Passo longo de perfil e pernas afastadas. Usar o centro do passo e a escala dos caminhantes. |
| `soneca` | A | Corpo reclinado leva uma cadeira listrada. Apoiar a estrutura inteira na areia. |
| `capivara` | A | Animal compacto sentado nas patas traseiras. Aproximar o ventre da areia e reduzir a estatura. |
| `protetor` | C | Pernas afastadas sob o chapéu e mão erguida ao rosto. Os pés já definem a profundidade. |
| `milho` | A | Postura de pernas cruzadas segura o milho no peito. Apoio na região posterior do quadril sobre banco ou cadeira. |
| `cadeirinha` | A | A leitora tem cadeira dobrável e perna cruzada. O calcanhar à frente não define sozinho o plano da estrutura. |
| `leque` | A | Banhista sentada de lado em toalha larga. Ancorar junto ao quadril e dimensionar pelo comprimento sentado. |
| `ponto` | A | Comemoração de joelhos, punhos elevados. Apoio baixo entre joelhos e pernas recolhidas. |
| `coco` | A | Canudo, braços e pés pequenos são parte do mascote. Escala reduzida e apoio sob a passada. |
| `brinde` | C | Taça erguida e base estável em três quartos. Pode conversar ao lado ou atrás das caixas. |
| `selfie` | C | Braços abertos com telefone alto e base em pé. Preserva espaço lateral para a mão. |
| `passinho` | A | Um joelho flexionado no ar durante a dança. Pivô deslocado para o chinelo que suporta o corpo. |
| `cooler` | A | Convidado sentado em seu próprio isopor. Apoio amplo na base do conjunto, espaço livre para as pernas. |

### Cultura pop

| ID | Classe | Leitura e decisão |
| --- | --- | --- |
| `golpe-da-mare` | A | Tronco torcido, pernas dobradas e bola no alto. Apoio projetado sob o atleta. |
| `maga-do-mormaco` | C | Base em três quartos e acessório solar alto. Contabilizar a extensão do acessório na escala. |
| `ronin-do-milho` | A | Pernas cruzadas sob o quimono e milho erguido. Ancorar no quadril para sentar sobre o banco. |
| `capita-do-coco` | C | Pernas firmes e bebida diante do rosto. A pose aceita sombra do gazebo e espaço perto das caixas. |
| `mecha-bloqueio` | A | Autômato de pernas curtas e mãos muito grandes. Apoiar nas duas botas e moderar a altura. |
| `axolote-surfista` | A | Prancha inclinada sob corpo baixo e cauda larga. Contato na quilha visual e escala de mascote aquático. |
| `goleira-lunar` | A | Defesa lateral em extensão, bola na ponta dos braços. Projetar o centro do mergulho e reservar largura. |
| `rei-da-bicicleta` | A | Pernas e mão projetadas em direções opostas. O chute acrobático exige sombra separada do pé alto. |
| `enterrada-solar` | A | Joelho levantado e braço alongado até a bola. Dar altura e espaço ao salto. |
| `saque-de-raquete` | C | Postura aberta em três quartos. A altura da raquete e da bola integra o alcance total. |
| `rodas-na-orla` | A | Patinadora com uma perna estendida para trás. Usar o plano das rodas que tocam o mosaico. |
| `campea-sobre-rodas` | A | Cadeira de rodas vista de três quartos com medalha alta. Apoio no eixo entre as rodas e largura própria. |
| `nadador-torpedo` | A | Nadador alongado em diagonal. Manter a projeção do corpo na superfície e retirar sombra de areia. |
| `guitarra-de-concha` | C | Músico em pé, guitarra diagonal e pés afastados. Preservar a silhueta larga do instrumento. |
| `diva-do-vento` | C | Cantora inclina o tronco sobre dois sapatos. Ambos sustentam a pose. |
| `dj-do-isopor` | A | DJ abaixada junto ao próprio equipamento. Usar a base da caixa e a largura entre os pés. |
| `baixo-da-onda` | A | Baixista com perna cruzada e cadeira própria. Posicionar o conjunto pelo apoio da cadeira. |
| `sanfona-de-sol` | C | Músico em três quartos com instrumento à frente do peito. Pernas livres para definir contato. |
| `rap-do-picole` | C | Postura frontal aberta e microfone junto à boca. Tênis apoiados na mesma faixa de piso. |
| `rainha-do-tambor` | C | Pernas escalonadas e instrumento à cintura. Apoio entre os pés na torcida. |
| `astronauta-de-boia` | A | Boia em torno do quadril e pernas projetadas à frente. A linha da boia determina a imersão. |
| `detetive-de-canga` | A | Investigadora reclinada com cadeira incluída. Apoiar a armação junto às outras cadeiras. |
| `chef-do-arcade` | A | Salto de perfil com frigideira e bola acima dos ombros. Separar os pés da sombra na areia. |
| `vampira-do-sol` | A | Caminha com sombrinha alta e passos largos. Dimensionar a figura pelo gesto completo. |
| `monstro-da-selfie` | C | Monstro ereto com telefone diante da cabeça. Pés largos e corpo volumoso suportam leve aumento. |
| `cavaleira-do-fliper` | A | Ajoelhada junto ao castelo de areia. Apoio no joelho recuado e folga lateral para o castelo. |

### Haikyu!!

| ID | Classe | Leitura e decisão |
| --- | --- | --- |
| `hinata` | A | Joelhos recolhidos sob o atacante e bola acima do braço. Projetar o salto atrás ou à frente da rede. |
| `kageyama` | A | Braços estendidos em diagonal e uma perna atrás. Apoio deslocado ao pé esquerdo da imagem. |
| `nishinoya` | A | Mergulho horizontal com areia já desenhada abaixo do líbero. Preservar o efeito incorporado sem duplicar a sombra. |
| `tsukishima` | A | Bloqueador suspenso com braços abertos e pernas recolhidas. Ancorar a projeção sob o tronco. |
| `daichi` | A | Manchete de frente, corpo agachado e pés abertos. Encurtar a altura aparente na quadra. |
| `tanaka` | A | Base agachada sobre faixa de areia pintada. Manter a faixa como contato e reduzir a altura. |

### Dragon Ball Z

| ID | Classe | Leitura e decisão |
| --- | --- | --- |
| `goku` | A | Salto com pernas dobradas e bola numa mão. Usar a posição projetada para a ordem de desenho. |
| `gohan` | A | Figura suspensa alcança a bola com as duas mãos. Elevar os tornozelos em relação à areia. |
| `piccolo` | A | Capa aberta em torno da pose de pernas cruzadas. Apoio largo no quadril, compatível com banco ou areia. |
| `vegeta` | A | Braços cruzados, corpo compacto, pernas em passo. Moderar a estatura em relação aos demais adultos. |
| `krillin` | A | Corpo baixo em base defensiva sobre areia já pintada. Reduzir a escala e preservar o contato incorporado. |
| `roshi` | A | O personagem descansa em sua própria cadeira. Usar apoio da armação, com espaço para a perna cruzada. |

### Lendas do Vôlei

| ID | Classe | Leitura e decisão |
| --- | --- | --- |
| `giba` | A | Atacante visto de três quartos no ar. Projetar as pernas dobradas sobre a faixa de jogo. |
| `serginho` | A | Defesa rente à areia, corpo longo e mãos juntas. O apoio fica sob a linha baixa do tronco. |
| `marcelinho` | C | Atleta em pé, uma perna atrás e mãos altas. Os tênis dão uma base estável ao levantamento. |

### Lendas do Vôlei de Praia

| ID | Classe | Leitura e decisão |
| --- | --- | --- |
| `ricardo` | A | Bloqueio vertical com pés suspensos e mãos bem altas. Usar altura de alcance e sombra projetada. |
| `emanuel` | A | Defesa baixa e pés largos na areia. Compensar a altura reduzida dos joelhos dobrados. |
| `alison` | C | Bloqueador alto de base firme, pernas ligeiramente afastadas. Preservar sua estatura relativa. |

### Games

| ID | Classe | Leitura e decisão |
| --- | --- | --- |
| `ryu` | C | Postura diagonal de quimono com a bola equilibrada. Base baixa e larga sustenta o gesto. |
| `chunli` | A | Manchete em passada profunda sobre areia pintada. Reduzir altura aparente e usar a sombra existente. |
| `sonic` | A | Corrida baixa, bola lateral e terra pintada sob os sapatos. Manter escala de mascote e contato original. |
| `tails` | A | Raposa compacta com balde, duas caudas e base pintada. Reduzir escala e preservar a base. |

## Preparar uma nova figurinha

1. Use a pintura pública de Copacabana como referência de câmera e luz. Forneça também o desenho do personagem ao editar uma figurinha. Especifique ação, roupa, expressão, acessórios e a parte do corpo que recebe o peso. Peça o corpo inteiro visto de três quartos ligeiramente de cima, luz quente da direita e fundo transparente. Para salto ou mergulho, peça espaço para a ação e indique onde estaria o chão ou a água.
2. Exporte a figura e os acessórios em WebP RGBA de 256 × 256. Ajuste a silhueta preservando a proporção. Deixe apenas alguns pixels nas extremidades do eixo mais longo. Examine o recorte sobre areia clara e azul-marinho, principalmente dedos, bola, pés e áreas entre os membros. Deixe a sombra projetada para o mapa.
3. Cadastre o ID, a coleção e a área recomendada no catálogo. Meça o contato no quadrado exportado, com x da esquerda para a direita e y do topo à base. Em `profiles`, informe pose, x, y e, quando necessário, largura relativa e sombra incorporada. Um adulto em pé tem tamanho 1. Um bloqueador no ar usa a projeção abaixo dos pés, um convidado com cadeira própria apoia o conjunto no chão e um convidado de pernas cruzadas usa o quadril. Um ID sem perfil recebe apoio central próximo à base e escala adulta.
4. Rode `node scripts/sticker-bounds.mjs` para recalcular os limites visíveis usados no toque. Ao alterar a pintura, reveja as linhas de profundidade e os contornos em `scripts/beach-foreground.mjs`. Execute esse script para gerar o atlas e a geometria de seus fragmentos. Confira a continuidade da malha da rede com um jogador em ambos os lados.
5. Verifique inventário, permissões de publicação e allowlist SQL conforme a coleção. A participação de uma homenagem depende do manifesto existente. Teste perto da água, junto à rede e no primeiro plano em duas larguras de tela, inclusive com zoom. Compare a figura com um banhista pintado no mesmo plano.

## Comparação visual

A composição de referência usa 20 posicionamentos fixos no mapa real, com a mesma capitã na beira da água, na quadra e no calçadão. A cena cheia usa as 78 figurinhas das sete coleções. Os convidados são criados somente pelo servidor de teste. Depois de `npm run build`, use `PLAYWRIGHT_RSVP_PRODUCTION=1 npm run test:e2e:rsvp -- perspective.spec.ts beach.spec.ts` para verificar o mesmo fluxo com `next start`. Rode `npm run test:e2e:rsvp -- perspective.spec.ts beach.spec.ts` para gerar novos PNGs em `test-results-rsvp`.

| Tela | Antes | Depois | Cena cheia |
| --- | --- | --- | --- |
| Desktop | [Antes](../screenshots/perspective/desktop-before.webp) | [Depois](../screenshots/perspective/desktop-after.webp) | [78 convidados](../screenshots/perspective/desktop-crowded.webp) |
| Celular | [Antes](../screenshots/perspective/mobile-before.webp) | [Depois](../screenshots/perspective/mobile-after.webp) | [78 convidados](../screenshots/perspective/mobile-crowded.webp) |

Nas capturas comparáveis, a largura da caixa da capitã corresponde a 6,6% da arte junto à água, 10,0% na quadra e 21,0% no calçadão. A figura ao fundo fica próxima da escala das famílias na areia molhada. Na quadra esquerda, os fios deixam ver o rosto e a camisa do atacante pelo vão da malha. À direita, a tampa do cooler passa diante da convidada que brinda. No primeiro plano, o músico de pernas cruzadas repousa no banco, a convidada com milho ocupa a cadeira e o caminhante de chapéu encobre parte da cadeira de Roshi. No celular, o zoom facilita a seleção dos convidados distantes na composição cheia.
