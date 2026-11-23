# Vôlei do Pesca

Convite de aniversário para uma quinta-feira de vôlei na Praia de Copacabana: **7 de janeiro de 2027, das 9h às 17h, America/Sao_Paulo**. Seis seções responsivas com identidade visual própria, RSVP com Google/Supabase e gestão de convidados (Marco 2).

## Executar

Requer Node.js 20.9 ou superior (verificado com Node.js 22) e npm.

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:3000. Para produção:

```sh
npm run build
npm start
```

As versões das dependências estão fixadas e registradas em `package-lock.json`.

## Arquitetura

- `app/`: App Router, layout, metadados, favicon e imagem de compartilhamento gerada com `ImageResponse`.
- `components/sections/`: hero, quando, onde, como, confirmação e expectativas. A composição da página e as seções informativas usam Server Components; hero e componentes interativos usam Client Components.
- `components/illustrations/`: ilustrações SVG originais, escaláveis e sem downloads externos. Nenhuma fotografia raster exige `next/image` neste marco.
- `components/motion/`: configuração global que respeita movimento reduzido e entradas de seção. Textos informativos continuam visíveis antes da animação de rolagem.
- `components/ui/`: navegação responsiva e widget de clima.
- `lib/event.ts`: fonte central da data, horário, idade, textos e objeto tipado de localização. Rótulos de calendário, horários, convite ICS e metadados derivam dessa configuração.
- `lib/weather.ts`: consulta Open-Meteo, seleção de previsão ou condições atuais, validação de dados e tradução das condições meteorológicas.
- `app/api/weather/route.ts`: endpoint de clima, sem credenciais no navegador.
- `app/calendario/route.ts`: download `.ics`, com horário convertido para UTC e linhas dobradas por tamanho UTF-8 conforme RFC 5545.

## Direção visual e movimento

Pôster de verão com azul profundo, turquesa, creme, amarelo e coral. Barlow Condensed nos títulos e DM Sans no texto; fontes servidas pelo próprio projeto via Fontsource. Praia vetorial com montanhas, rede, bola, guarda-sol, cooler e coqueiro; calendário de papel, mapa inclinado e divisórias em ondas.

Motion (`motion/react`) anima a entrada escalonada do hero, a bola com mola, o selo de aniversário, a paralaxe discreta da praia, a entrada das seções, as trocas de estado do clima e a abertura do menu móvel. Botões e bola respondem ao hover. A preferência `prefers-reduced-motion` reduz movimentos e desativa rolagem suave. Não há ciclos contínuos de animação.

## Ambiente e integrações

O convite pode abrir sem credenciais. Para habilitar RSVP, configure as variáveis Supabase de `.env.example` e execute a migração SQL. Veja o [guia completo de RSVP, OAuth, RLS e testes](docs/RSVP.md). O arquivo `.env.example` também documenta `SITE_URL`, opcional em desenvolvimento. Ao publicar, configure a origem pública completa (por exemplo, `https://seu-dominio.com`) para URLs absolutas corretas nas imagens de compartilhamento. Na Vercel, o domínio de produção também é detectado automaticamente. O deploy precisa suportar o runtime Node.js do Next.js; exportação puramente estática não fornece as rotas de clima e calendário.

**Open-Meteo:** consulta coordenadas gerais de Copacabana. A requisição solicita condições atuais e até 16 dias de previsão; o servidor reutiliza a resposta por 30 minutos com `next.revalidate`. A previsão da festa aparece somente se a API incluir uma linha completa para a data do evento e o evento ainda não tiver passado. Antes disso, o widget indica explicitamente “Condições atuais”, mostra a hora da observação no fuso do evento e explica a diferença. Falhas de rede, timeout e dados incompletos produzem uma mensagem sem temperaturas inventadas. A página inicial não espera pela API para carregar. Atribuição e link ao provedor estão no widget.

**Google Maps:** iframe carregado sob demanda e link externo, sem chave de API. Enquanto `meetingPoint` for `null`, a interface sinaliza mapa geral e ponto a definir. Para finalizar, edite `event.location.meetingPoint`, `nearbyReferences`, `coordinates` e `mapsUrl`. O iframe passará a usar as coordenadas exatas. O mapa depende da disponibilidade do Google e pode ser bloqueado por rede ou extensões; o link externo continua disponível.

## Validação

```sh
npm run typecheck
npm test
npx playwright install chromium  # somente se o navegador ainda não estiver instalado
npm run test:e2e
npm run build
```

Os testes unitários verificam a conversão de fuso e o formato ICS, o dia da semana, a seleção da previsão, dados incompletos e a mudança de dia em São Paulo. Os testes Playwright cobrem as seis seções, navegação, download, indicação de clima atual versus previsão, falhas da API, menu móvel, Escape, movimento reduzido e ausência de overflow inclusive em 320 px. O clima dos testes de navegador é interceptado para ser determinístico; o aplicativo não contém dados meteorológicos de demonstração.

## Próximos marcos e limitações

- **Marco 2 implementado:** Google OAuth via Supabase SSR, Server Actions, PostgreSQL com RLS, RSVP privado por padrão, consentimentos separados para nome/foto, lista e contagens, moderação e CSV em `/organizador`. Configuração e verificação em [docs/RSVP.md](docs/RSVP.md). Sem credenciais, a seção explica que as confirmações estão sendo preparadas.
- **Marco 3:** substituir a cena conceitual em `components/sections/expectations.tsx` por escolha e posicionamento de avatares e stickers. A ilustração atual está identificada como prévia.
- O posto e as barracas ainda não foram definidos. Não há nomes ou ponto de encontro inventados.
- O clima depende da disponibilidade e dos limites do Open-Meteo; previsão distante não é garantida e pode mudar.
- Este marco entrega o código no repositório local. Nenhum domínio, serviço pago ou publicação foi configurado.
