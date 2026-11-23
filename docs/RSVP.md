# RSVP e lista de convidados — Marco 2

## Configuração

1. Crie um projeto Supabase. No SQL Editor, execute **uma vez**, como `postgres`, `supabase/migrations/202611230001_rsvp.sql`. A migração usa `pgcrypto` no schema `extensions` (padrão do Supabase). Não execute `tests/database/bootstrap.sql` no Supabase: é um substituto mínimo do Auth somente para um PostgreSQL descartável.
2. Copie `.env.example` para `.env.local`. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` em Project Settings → API. O projeto não precisa de `service_role` nem chave secreta no aplicativo. Use a chave publicável `sb_publishable_…` (ou a chave legada `anon`, nunca `service_role`).
3. Configure `SITE_URL` com a origem exata, sem caminho, usada para abrir o convite. Localmente, o padrão do app é `http://127.0.0.1:3000`; não misture com `localhost`, pois os cookies PKCE pertencem à origem.
4. No Google Cloud, configure um cliente OAuth do tipo **Web application**, a tela de consentimento e os usuários de teste enquanto estiver no modo de testes. Use apenas os escopos de identidade `openid`, `userinfo.email` e `userinfo.profile`. Adicione a origem do app às origens JavaScript autorizadas e **a URL de callback mostrada pelo provedor Google no Supabase**, normalmente `https://SEU-PROJETO.supabase.co/auth/v1/callback`, aos URIs de redirecionamento autorizados. Não confunda esse endereço com o callback do app.
5. No Supabase → Authentication → Sign In / Providers → Google, ative o provedor e informe o Client ID e Client Secret do Google. Os segredos do Google ficam no Supabase, nunca em variáveis `NEXT_PUBLIC_…`. Desative provedores que não usará e autenticação anônima. O app solicita apenas `openid email profile`, sem acesso offline ou APIs adicionais do Google.
6. Em Authentication → URL Configuration, configure Site URL com a origem pública e permita explicitamente `http://127.0.0.1:3000/auth/callback` e `https://SEU-DOMINIO/auth/callback` nas Redirect URLs. Para outras portas, adicione a URL exata correspondente e altere `SITE_URL`. Evite curingas em produção.
7. Reinicie `npm run dev` após mudar as variáveis. Sem as duas variáveis Supabase, o convite continua disponível com um aviso de preparação, sem simular confirmações.

Referências oficiais: [clientes SSR e Proxy](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [cache e sessões](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

## Organizador

Entre uma vez pelo Google e copie o UUID da conta em Authentication → Users. Como `postgres`, acrescente-o à allowlist privada:

```sql
insert into private.organizers(user_id)
values ('UUID-DA-CONTA-DO-ORGANIZADOR')
on conflict do nothing;
```

Abra `/organizador` depois de entrar pelo convite. O organizador vê todas as respostas, nomes escolhidos, mensagens, contribuição, acompanhantes e consentimentos. Pode ocultar/restaurar respostas e exportar CSV em `/organizador/exportar`. Ocultar retira a resposta das contagens, da lista pública e da elegibilidade para a praia; edições do convidado preservam a moderação. O CSV inclui respostas ocultas e o respectivo indicador, escapa aspas/quebras de linha e neutraliza fórmulas de planilhas. Não contém emails nem tokens.

A allowlist é por UUID autenticado, não por email, nome exibido ou metadados editáveis. Para revogar:

```sql
delete from private.organizers where user_id = 'UUID-DA-CONTA';
```

## Código opcional de convite

Como `postgres`, configure um código compartilhado de até 128 caracteres:

```sql
update private.invitation_settings
set code_hash = extensions.crypt('SUBSTITUA-POR-UM-CODIGO-LONGO', extensions.gen_salt('bf'))
where id;
```

O código não vai para o bundle, URL ou armazenamento local. O banco guarda somente o hash. O formulário pede o código apenas ao criar a primeira resposta; quem já respondeu pode editar sem digitá-lo novamente. Para desativar, defina `code_hash = null`. A interface descobre somente se há código configurado, nunca o hash. Configure o código pelo SQL Editor privado e compartilhe-o pelo seu canal de convite.

Esse código reduz cadastros ocasionais, mas pode ser repassado. Nem o código, nem um link público, nem uma conta Google provam que a pessoa foi convidada ou que seu nome é verdadeiro. O limite de 10 tentativas por minuto é por conta, não global; ele não impede abuso com várias contas. Para um evento maior, configure também os controles de abuso do Supabase e limites no provedor de hospedagem.

## Fluxo e privacidade

O convite permanece público. Ao clicar em “Continuar com Google”, uma Server Action inicia OAuth com PKCE; `/auth/callback` troca o código pela sessão em cookies e retorna sempre a `/#presenca`. Cancelamento e falhas mostram mensagens fixas em português, sem refletir mensagens do provedor nem aceitar redirects arbitrários. `proxy.ts` usa `getClaims()` para atualizar tokens e propaga cookies e cabeçalhos para a resposta. Leituras de perfil e mutações usam `getUser()` para verificar a conta atual. Nunca se usa `getSession()` como autorização. As rotas de sessão não devem ser colocadas em cache por um CDN; preserve `Cache-Control: private, no-store` e encaminhe cookies. Configure o CDN com TTL mínimo zero nessas rotas.

O formulário preenche o nome disponível, mas permite editar. Nome e presença são obrigatórios. Mensagem (500 caracteres), contribuição e até 5 acompanhantes são secundários. Uma resposta existente aparece como resumo editável; o banco faz upsert pela chave única `guest_id`. Pending é anunciado por região viva e desabilita campos; falhas preservam o estado do formulário. A comemoração acontece somente depois da resposta de persistência, sem repetição ao recarregar. Motion respeita movimento reduzido.

A resposta começa **privada**. Compartilhar o primeiro nome exige consentimento explícito. A foto tem outro consentimento, desligado por padrão. Ao retirar a permissão de nome, a de foto também é retirada. Só `going`, não ocultado e com consentimento aparece na lista. A contagem inclui respostas privadas, mas exclui ocultadas. Acompanhantes são contados separadamente; “1 pessoa confirmada + 2 acompanhantes” são três pessoas. “Talvez” e “Não vou” retiram imediatamente a conta da lista de confirmados após o salvamento e a revalidação. Outros visitantes veem a atualização na próxima leitura/recarregamento; não há assinatura Realtime neste marco. A lista mostra até 200 primeiros nomes consentidos, enquanto as contagens abrangem todas as respostas.

O email fica somente no Supabase Auth, sem cópia nas tabelas do app, renderização pública ou comparação de permissões. O nome privado escolhido e a identidade UUID permanecem separados. Fotos são limitadas a hosts HTTPS `lhN.googleusercontent.com`, sem credenciais ou portas, e renderizadas sem referrer. Nomes e mensagens usam o escape de texto do React. O app não usa HTML de convidados.

## Modelo, autorização e RLS

- `guest_profiles`: `id` referencia `auth.users`, nome completo escolhido, primeiro nome de apresentação, URL opcional de foto e timestamps. Pronto para futura associação de stickers pelo UUID; nenhuma posição é persistida.
- `rsvps`: UUID próprio, `guest_id` único, status, mensagem, contribuição, acompanhantes, dois consentimentos, moderação e timestamps. Constraints validam status, limites, contribuição e relação entre os consentimentos.
- RLS permite SELECT de perfis e respostas somente ao próprio convidado ou a um UUID da allowlist de organizadores. `anon` não pode ler nenhuma linha dessas tabelas. `authenticated` não possui grants de INSERT/UPDATE/DELETE.
- `save_rsvp(jsonb,text)` é o único caminho de escrita de convidados. Deriva `auth.uid()` no banco, valida novamente, verifica código quando necessário e grava perfil + resposta em uma transação. Não aceita identidade ou flag de moderação do cliente.
- `public_attendance()` é uma função `SECURITY DEFINER` estreita que retorna somente contagens e objetos `{ display_name, avatar_url }` permitidos. Não expõe IDs, nomes completos, mensagens, contribuições, acompanhantes individuais, emails, consentimentos ou linhas brutas.
- `is_organizer()` retorna apenas a autorização da sessão atual. `moderate_rsvp(uuid,boolean)` exige essa autorização novamente no banco. Página, action e CSV também verificam a sessão e o papel no servidor.
- Funções privilegiadas têm `search_path = ''`, referências qualificadas, grants explícitos e nenhum SQL dinâmico. Tabelas privadas têm RLS e nenhum acesso de clientes. Apenas o administrador do banco configura allowlist e hash do convite.
- `private.mutation_limits` implementa limite atômico, compartilhado entre instâncias: 10 chamadas de RSVP por conta/minuto e 30 moderações por organizador/minuto. Falhas de código/validação no RPC retornam um resultado, em vez de uma exceção, para preservar a contagem. Dados rejeitados na validação Zod nem chegam ao banco. Constraints e falta de grants também bloqueiam chamadas diretas.

## Integração com Marco 3

`getAttendanceState()` em `lib/rsvp-data.ts` fornece o tipo `AttendanceState` (`authenticated`, `status`, `canPlaceSticker`) a partir de leitura autenticada e persistida. `canPlaceSticker` só é verdadeiro para `going` não ocultado. Uma futura action de sticker deve revalidar essa condição no servidor e na política de leitura/escrita do banco; nunca confiar no estado enviado pelo navegador. A cena deve filtrar stickers cujo RSVP deixe de ser `going` ou seja ocultado. Este marco entrega apenas o link “Escolher meu lugar na praia!” para `#expectativas`; a cena continua sendo a prévia do Marco 1.

## Verificação automatizada

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run test:e2e           # convite sem variáveis Supabase, porta 3000
npm run test:e2e:rsvp      # Supabase HTTP simulado: 54326; app isolado: 3101
```

O segundo conjunto Playwright usa cookies, PKCE, callback, Server Actions e revalidação reais do Next.js, com Auth e REST do Supabase substituídos por um servidor HTTP em memória. Não há endpoint de teste no app nem bypass de autenticação em produção. Os testes verificam fluxo privado, primeira confirmação, edição, contagens persistidas no mock, consentimento, XSS renderizado como texto, pending, falha de gravação, campos preservados, perfil ausente, sessão encerrada, callback cancelado/inválido, sign-out, restrição do organizador, CSV e ocultar/restaurar em desktop e mobile. O mock não substitui as verificações reais de segurança do banco.

Para testar a migração em PostgreSQL local vazio e **descartável**, com `pgcrypto` instalado e usuário administrador:

```sh
psql "$RSVP_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f tests/database/bootstrap.sql \
  -f supabase/migrations/202611230001_rsvp.sql \
  -f tests/database/rsvp.sql
```

O bootstrap cria roles `anon`/`authenticated` e emula somente `auth.uid()` e a FK `auth.users`. O arquivo `rsvp.sql` também pode ser executado após a migração numa instância Supabase **local de testes vazia**. Ele testa a migração real com roles distintas: isolamento entre contas, bloqueio de leitura anônima, grants de escrita, unicidade, IDs forjados, validação, consentimentos/foto, status, contagens, moderação e limites inclusive tentativas erradas de convite. Os dados de teste são revertidos ao final. Não execute em produção.

## Checklist manual com Google e Supabase reais

1. Configure o projeto, URLs, provedor e variáveis acima; abra uma janela anônima no celular e desktop. Verifique que as seis seções abrem sem login.
2. Entre com uma conta Google de teste. Confira que a tela de consentimento pede somente identidade e que o retorno é `/#presenca`. Cancele uma entrada e tente novamente. Repita em outra origem autorizada para detectar cookies/redirects mal configurados.
3. Confirme privadamente, recarregue e confira as linhas no banco. Edite várias vezes e confira que há somente um RSVP por UUID. Tente um código errado se o código estiver ativo.
4. Com duas contas, compartilhe primeiro nome, depois foto; retire os consentimentos. Confirme que a outra conta só recebe a projeção pública permitida. Troque para Talvez/Não vou e confira contagens/lista. Teste atualizações de token deixando expirar o access token e retomando com refresh token válido; teste também sessão revogada.
5. Pelo cliente REST autenticado de A, tente consultar/editar B e fazer INSERT/UPDATE direto. Não deve conseguir. Tente invocar `moderate_rsvp` sem allowlist. Não deve conseguir. Confira ausência de emails, tokens e dados privados em HTML/Flight/respostas públicas.
6. Entre com o UUID organizador, abra `/organizador`, exporte CSV e oculte/restaure uma resposta. Saia e verifique que o CSV retorna 403. Edite uma resposta ocultada com a conta do convidado e confira que continua oculta.
7. Desconecte a rede ao enviar; a interface deve preservar os campos e não comemorar. Volte à rede e salve. Teste limites de acompanhantes, mensagens e tentativas.

Google OAuth e Supabase hospedado exigem credenciais externas e precisam desse teste manual. O ambiente local não forneceu essas credenciais; testes com o mock e PostgreSQL local não são uma alegação de OAuth Google ou integração Supabase hospedada testados ao vivo.

## Resultados desta entrega — 23/11/2026

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Passou |
| `npm test` | 18 testes passaram |
| `npm run build` | Passou; RSVP, callback e organizador usam renderização dinâmica |
| `npm run test:e2e` | 11 passaram; 1 caso exclusivo de mobile foi ignorado no projeto desktop |
| `npm run test:e2e:rsvp` | 10 passaram, em desktop e mobile, sem erros de hidratação |
| Migração + `tests/database/rsvp.sql` em PostgreSQL local | Todas as assertions passaram, usando roles reais e a migração do aplicativo |
| Revisão visual | Screenshots de RSVP desktop e mobile revisados; sem overflow horizontal |
| Google OAuth / Supabase hospedado | Não testados ao vivo: credenciais externas indisponíveis |

O conjunto de RSVP também verificou a troca de um access token expirado por cookies renovados no Proxy e uma requisição de salvamento interrompida na rede. Nenhuma infraestrutura externa foi criada ou publicada.
