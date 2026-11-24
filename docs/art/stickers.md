# Figurinhas da praia

O arquivo [sticker-atlas.png](sticker-atlas.png) preserva a folha original de 1448 × 1086 px gerada com o ImageGen integrado. As doze figuras foram recortadas pelo contorno e centralizadas em arquivos WebP transparentes de 256 × 256 px. Cada recorte tem uma margem livre para as animações e funciona tanto na areia quanto na galeria. O aplicativo carrega imagens individuais em `/beach/stickers/<id>.webp`.

| ID | Figurinha | Detalhe visual |
| --- | --- | --- |
| levantadora | Levantadora | Dois coques e a bola nas mãos erguidas |
| foguete | Foguete da areia | Atleta de regata amarela em disparada |
| paredao | Paredão | Bloqueador barbudo com as duas mãos abertas |
| salva-vidas | Salva-vidas | Boné e boia vermelhos |
| surfista | Surfista | Flor no cabelo e prancha listrada |
| capivara | Capivara do sol | Óculos verdes e lenço florido |
| siri | Siri do saque | Uma bola equilibrada na pinça |
| coco | Coco gelado | Canudo listrado e dois polegares para cima |
| gaivota | Gaivota da orla | Chapéu de pescador e asas abertas |
| capita | Capitã da quadra | Faixa coral e bola junto ao quadril |
| soneca | Mestre da soneca | Chapéu de palha cobrindo o rosto na cadeira |
| mergulho | Peixinho | Atleta no ar em uma defesa de manchete |

A revisão de perspectiva completou o corpo de levantadora, capita, salva-vidas e surfista. A folha acima preserva os desenhos de origem. [Auditoria e orientação para novas figurinhas](perspectiva.md)

## Prompt de geração

Use case: illustration-story. Production asset: a single transparent die-cut sticker atlas for a Brazilian illustrated beach volleyball birthday party map. Generate twelve completely original characters arranged in exactly FOUR evenly spaced columns by THREE equally spaced rows, in a 4:3 landscape canvas. Each cell independently contains ONE centered isolated complete character, generous gutters, common scale, nothing crossing virtual cell boundaries, no printed borders, no labels, no sheet backing, no text, no watermark. True transparent background. Warm retro Brazilian summer editorial cartoon, bold deep petrol ink contours, expressive ink faces, creamy thin outer die-cut edge, flat rich gouache spot colors, subtly imperfect screen print, simplified silhouettes recognizable at 44 pixels. Playful natural full-body proportions and 3/4 angle. Turquoise, coral vermilion, sunny yolk, leaf green, ultramarine, night teal. Top row left to right: (1) smiling Black woman with puff buns in cobalt athletic tank holding a volleyball above head, (2) lightning-fast joyous auburn curly-haired athlete in a yellow tank racing barefoot, (3) broad muscular bearded beach blocker in teal trunks holding up both big hands, (4) plucky lifeguard in red shorts with red rescue float under arm and white zinc on nose. Middle row left to right: (5) relaxed brunette surfer with a small striped longboard held upright, (6) charming round brown capybara wearing mint sunglasses and a tropical neckerchief sitting on haunches, (7) bright vermilion crab holding up one triumphant pincer around a tiny volleyball, (8) a jaunty green coconut mascot with straw, friendly face and little yellow feet. Bottom row left to right: (9) playful white-and-ink seagull sporting an apricot fisherman's hat, (10) determined tan woman captain with short blue-black hair, coral sweatband and a volleyball tucked at the hip, (11) sleepy beachgoer in tiny striped low folding chair, straw hat over eyes, (12) excited dark-curly-haired diver in teal shorts leaping sideways, forearms together to dig a volleyball. Every subject created for the same collector series. Keep the outer edge and character all inside each respective cell. No global lighting effects or backdrop.

## Ampliação do álbum

As 18 novas figurinhas foram geradas individualmente com o ImageGen integrado, usando a folha original como referência visual. Cada WebP usa o mesmo quadrado transparente de 256 × 256 px da coleção original.

Prompt comum aos 18 desenhos:

> Use case: illustration-story. Draw ONE new isolated die-cut character sticker for the same Copacabana party collection as the reference atlas. Match its hand-inked retro Brazilian cartoon exactly: very bold dark petrol contour, thin warm cream cut-paper border, simple flat rich gouache spot colors and light screenprinted grain, expressive broad face, slightly oversized head and hands. Strong silhouette readable at 44 pixels. Show the full action, all props, feet and border within frame. Transparent background, no text, no labels, no cast shadows, no backdrop, no other stickers.

O campo `Subject` de cada geração está na tabela.

| ID | Subject |
| --- | --- |
| saque | Tall lean dark-skinned Black woman with a long braided ponytail, lemon sleeveless jersey and cobalt shorts, serving a yellow-blue volleyball overhead, open striking palm drawn behind head, weight rocking onto front foot. |
| cortada | Lanky Japanese-Brazilian man with swept back black hair and a coral vest, midair at the apex of a spike, powerful fully extended striking arm contacting ball overhead, knees scissored backward. |
| manchete | Stocky older tan woman with short silver curls, green tank and coral shorts, in a deep wide lateral squat with locked straight forearms joined out in front to receive an oncoming volleyball. |
| largadinha | Slender brown-skinned androgynous player with short curly magenta hair, navy cropped jersey, white shorts, springing lightly on tiptoe, surprising soft one-handed fingertip dink of a volleyball. |
| bloqueio | Strong Black woman with cropped blonde natural hair in cobalt blue one-piece sports kit jumping vertically to block, both arms reaching straight up, fingers spread wide, both bare feet tucked off ground. No drawn net. |
| ponto | Broad smiling olive-skinned middle-aged bald man with a curled mustache, coral shirt and blue shorts, jubilant kneeling slide celebrating a point, both bent arms pumping fists, face lifted in delight. |
| brinde | Large curvy Black woman with dark brown skin and a wide round natural afro, bright orange cat-eye sunglasses and a teal patterned beach wrap, leaning forward to toast with an oversized yellow reusable cup. |
| protetor | Pale freckled redheaded adult with a compact build in cobalt swim trunks and a yellow bucket hat, visibly rubbing a broad white streak of zinc across their opposite shoulder, orange squeeze sunscreen bottle in other hand. |
| milho | Plump grandmother with brown skin, long white braid, red kerchief and a sunflower-yellow sundress, seated cross-legged delightedly biting a buttered golden corn cob held in its green husk. |
| cadeirinha | Older East Asian woman with silver bob and round dark glasses in a striped coral swimsuit seated upright in a low turquoise beach folding chair, reading an open bright yellow paperback, legs crossed. |
| selfie | Slim brown-skinned young man with tall black quiff, gold hoop and a flowery open green beach shirt over coral shorts, stretching an arm upward with a blue smartphone and grinning at its camera, other hand making a peace sign. |
| passinho | Joyous dark-skinned dancer with swinging long copper box braids, turquoise cropped top, wide yellow beach trousers and bangles, caught mid samba step with one knee high, elbows high and hips tilted. |
| tchibum | Lean brown woman in a coral one-piece with black hair in a tight bun and pale goggles diving headfirst diagonally down, hands together pointed well in front of head, slender straight legs trailing high behind, full airborne silhouette. |
| crawl | Broad dark brown Black man in yellow swim cap and coral goggles, swimming front crawl horizontally, turning side-on to breathe, one high bent elbow swinging over a low turquoise splash that is part of the sticker. No land. |
| embaixadinha | Compact wiry tan young man with a shock of bleached curls and teal soccer shorts, barefoot, balancing on one foot to kick a black and cream football up with the instep of his raised foot, eyes on ball. |
| calcadao | Fit senior brown-skinned man with neatly trimmed white beard, turquoise terry headband and coral sleeveless shirt, striding briskly down a promenade in trainers, towel swung over one shoulder, long open walking stride. |
| cooler | Broad-shouldered stocky brown-skinned adult with close shaved head and chunky sunglasses, sleeveless yellow floral beach shirt and teal trunks, knees bent lifting a single large rectangular red cooler by its cream handle. |
| leque | Curvy middle-aged Brazilian woman with straight ink-black bob and a wide sunhat, coral wrap dress, lounging cross-legged on a folded teal beach mat, fanning herself with a large open yellow folding fan in the gazebo shade. No structure. |

## Cultura pop

As 26 figurinhas são personagens originais desenhados para a festa com o ImageGen integrado. A figurinha **Saque viagem** serviu de referência para os contornos, a paleta e a borda de recorte. Os desenhos usam arquétipos de mangá, esportes, música, cinema e jogos, com nomes próprios da coleção. O DJ do isopor usa o cooler como toca-discos e o Ronin do milho faz uma pausa no banco com uma espiga assada.

Cada desenho tem um WebP transparente de 256 × 256 px. O catálogo define o nome, a categoria e a área sugerida de cada figurinha. [Catálogo das coleções](../../lib/stickers.ts)
