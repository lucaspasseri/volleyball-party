# Vôlei do Pesca

Convite de aniversário para uma quinta-feira de vôlei na Praia de Copacabana: **7 de janeiro de 2027, das 9h às 17h, America/Sao_Paulo**. Seis seções responsivas com identidade visual própria, RSVP com Google pelo Neon Auth, gestão de convidados e mapa interativo da festa.

## Executar

Requer Node.js 22 ou superior e npm.

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
- `components/illustrations/`: ilustrações SVG originais, escaláveis e sem downloads externos. A cena interativa usa as ilustrações WebP em `public/beach/`.
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

O convite abre em modo de prévia com as variáveis de banco e autenticação em branco. Ao publicar, use um ambiente que suporte o runtime Node.js do Next.js.

### Configuração do Neon

1. Crie um projeto no [Neon Console](https://console.neon.tech) e selecione a branch e o banco destinados ao convite. Use a mesma branch e o mesmo banco para o PostgreSQL da aplicação e o Managed Better Auth.
2. Na branch, abra **Auth → Configuration**, habilite **Managed Better Auth** e copie o Auth URL completo, incluindo o caminho.
3. Em **Connect**, copie a conexão direta do proprietário do banco e abra-a no `psql` a partir da raiz do repositório. Gere uma senha aleatória e substitua o valor de exemplo abaixo. O `psql` mantém o histórico dessa sessão fora do disco.

   ```sql
   \set HISTFILE /dev/null
   CREATE ROLE pesca_runtime WITH LOGIN PASSWORD 'SUBSTITUA-PELA-SENHA-ALEATORIA';
   SELECT format('GRANT CONNECT ON DATABASE %I TO pesca_runtime', current_database()) \gexec
   \i db/001_initial.sql
   ```

   A instalação do schema é transacional e deve ser executada uma vez por banco novo. Crie `pesca_runtime` via SQL para que o login tenha apenas os privilégios concedidos pela instalação. Use a conexão do proprietário apenas para inicialização e administração. Se o schema e o login já foram inicializados, prossiga para a configuração de ambiente. [Privilégios de roles na Neon](https://neon.com/docs/manage/roles)

4. Use `.env.example` como modelo para `.env.local`. Configure estas variáveis no ambiente do servidor, localmente e na hospedagem.

   | Variável | Valor |
   | --- | --- |
   | `SITE_URL` | Origem exata do convite, como `http://localhost:3000` em desenvolvimento e `https://seu-dominio.com` em produção. |
   | `DATABASE_URL` | Conexão PostgreSQL **pooled** da branch, com o usuário `pesca_runtime`, sua senha codificada para URL e `sslmode=verify-full`. Use a opção de conexão pooled do Console para obter o endpoint do pool. |
   | `NEON_AUTH_BASE_URL` | Auth URL completo da branch, incluindo o caminho. |
   | `NEON_AUTH_COOKIE_SECRET` | Segredo estável do servidor. Gere com `openssl rand -base64 32` e guarde o resultado. |

5. Em **Auth → Configuration**, adicione a origem HTTPS de produção e outras origens necessárias aos domínios confiáveis. `http://localhost` é aceito em desenvolvimento. Abra o app usando o mesmo hostname de `SITE_URL`.
6. Em **OAuth providers**, configure Google. No Google Cloud, crie um cliente OAuth do tipo **Web application** e registre o URI de redirecionamento fornecido pela Neon (no formato `NEON_AUTH_BASE_URL/callback/google`). Se o projeto Google estiver em modo de testes, adicione as contas de teste. Cole o Client ID e Client Secret na configuração Google da Neon. Mantenha Google como provedor e desative outros métodos de cadastro que não serão usados. [OAuth da Neon](https://neon.com/docs/auth/guides/setup-oauth) · [Domínios confiáveis](https://neon.com/docs/auth/guides/configure-domains)
7. Reinicie `npm run dev`, abra `http://localhost:3000` e teste a entrada pelo Google. Depois da primeira entrada, adicione a conta organizadora pela conexão administrativa. [Organizador, código de convite e teste hospedado](docs/RSVP.md)

O fluxo usa o SDK `@neon/auth` para Next.js e `pg` no servidor para SQL parametrizado. O proxy processa o retorno do OAuth. A aplicação verifica a sessão nos pontos de leitura e gravação protegidos, e o PostgreSQL aplica as regras de RSVP, consentimento e moderação. [Guia oficial Next.js](https://neon.com/docs/auth/quick-start/nextjs-api-only)

**Open-Meteo:** consulta coordenadas gerais de Copacabana. A requisição solicita condições atuais e até 16 dias de previsão; o servidor reutiliza a resposta por 30 minutos com `next.revalidate`. A previsão da festa aparece somente se a API incluir uma linha completa para a data do evento e o evento ainda não tiver passado. Antes disso, o widget indica explicitamente “Condições atuais”, mostra a hora da observação no fuso do evento e explica a diferença. Falhas de rede, timeout e dados incompletos produzem uma mensagem sem temperaturas inventadas. A página inicial não espera pela API para carregar. Atribuição e link ao provedor estão no widget.

**Google Maps:** iframe carregado sob demanda e link externo, sem chave de API. Enquanto `meetingPoint` for `null`, a interface sinaliza mapa geral e ponto a definir. Para finalizar, edite `event.location.meetingPoint`, `nearbyReferences`, `coordinates` e `mapsUrl`. O iframe passará a usar as coordenadas exatas. O mapa depende da disponibilidade do Google e pode ser bloqueado por rede ou extensões; o link externo continua disponível.

## Validação

```sh
npm run typecheck
npm test
npx playwright install chromium  # somente se o navegador ainda não estiver instalado
npm run test:e2e
npm run test:db
npm run test:e2e:rsvp
npm run build
```

Os testes unitários verificam a conversão de fuso e o formato ICS, o dia da semana, a seleção da previsão, dados incompletos e a mudança de dia em São Paulo. Os testes Playwright cobrem as seis seções, navegação, download, indicação de clima atual versus previsão, falhas da API, menu móvel, Escape, movimento reduzido e ausência de overflow inclusive em 320 px. O clima dos testes de navegador é interceptado para ser determinístico; o aplicativo não contém dados meteorológicos de demonstração.

Os testes de banco e de RSVP precisam de `initdb`, `pg_ctl` e `psql` no PATH. Cada execução inicializa e encerra sua própria instância PostgreSQL local, com um socket em diretório temporário. Os testes de navegador usam o SDK real e simulam apenas o serviço hospedado de autenticação e o provedor Google. Faça o teste hospedado com as credenciais da branch de destino.

## Funcionalidades e limitações

- **Marco 2 implementado:** Google OAuth via Neon Auth, Server Actions e Neon PostgreSQL, RSVP privado por padrão, consentimentos separados para nome/foto, lista e contagens, moderação e CSV em `/organizador`. Configuração e verificação em [docs/RSVP.md](docs/RSVP.md). Sem credenciais, a seção explica que as confirmações estão sendo preparadas.
- **Marco 3 implementado:** mapa ilustrado de Copacabana, seis áreas e doze figurinhas. Convidados confirmados guardam e ajustam seu lugar na areia. [Migração, coordenadas, inventário de arte e capturas](docs/PRAIA.md).
- O posto e as barracas ainda não foram definidos. Não há nomes ou ponto de encontro inventados.
- O clima depende da disponibilidade e dos limites do Open-Meteo; previsão distante não é garantida e pode mudar.
- Este marco entrega o código no repositório local. Nenhum domínio, serviço pago ou publicação foi configurado.
