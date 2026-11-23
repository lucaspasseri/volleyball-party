# RSVP e lista de convidados

O Google autentica o convidado via Managed Better Auth. O SDK da Neon processa o retorno do OAuth, cria os cookies e verifica a sessão nas operações do servidor. O aplicativo usa o ID autenticado para vincular o perfil, a resposta e a figurinha da praia. A configuração da Neon está no [README](../README.md#configuração-do-neon).

## Acesso do organizador

Entre pelo convite com a conta Google do organizador. No painel **Auth → Users** da mesma branch Neon, copie o ID dessa conta. Na conexão administrativa do PostgreSQL, execute:

```sql
insert into pesca.organizers (user_id)
values ('ID-DO-ORGANIZADOR')
on conflict do nothing;
```

Abra `/organizador` com essa conta para ler respostas, exportar CSV e ocultar ou restaurar convidados. A autorização é consultada também na exportação e na moderação. Ocultar tira o convidado da lista pública, das contagens e do mapa. A atualização de RSVP feita pelo convidado preserva a moderação.

## Código opcional de convite

Por padrão, qualquer conta autenticada pode criar uma primeira resposta. Para exigir um código compartilhado, use a conexão administrativa e grave um hash. Depois da primeira resposta, o mesmo convidado pode editar sem reapresentar o código.

```sql
update pesca.invitation_settings
set code_hash = extensions.crypt('SUBSTITUA-POR-UM-CODIGO', extensions.gen_salt('bf'))
where id;
```

## Banco e autorização

- `db/001_initial.sql` cria o schema `pesca`, funções e privilégios. O login `pesca_runtime` pode executar as funções concedidas e não possui acesso direto às tabelas. O Data API da Neon não é necessário.
- Os IDs de conta são armazenados como texto. O app recebe o ID da sessão verificada pela Neon a cada operação protegida e passa esse valor como parâmetro SQL separado. O código de banco roda no servidor. O navegador não recebe a conexão PostgreSQL.
- O PostgreSQL mantém o perfil e o RSVP em uma operação atômica, guarda uma figurinha por conta e cena, restringe as gravações de figurinha a confirmações elegíveis e valida a autorização de organizador. Limites de gravação valem por conta e operação.
- As funções públicas retornam contagens e dados explicitamente consentidos. Nome completo, mensagem privada, e-mail e ID da conta ficam fora da leitura pública. Uma figurinha privada aparece para o dono.
- O schema da aplicação é independente do schema gerenciado de identidade. As tabelas da aplicação mantêm cascata de perfil para RSVP e figurinha. Se uma conta for removida no painel da Neon, o operador deve também tratar seu perfil, autorização de organizador e contadores no schema `pesca`.

## Verificação no ambiente hospedado

1. Em janela anônima, abra o convite sem sessão e confirme que as seis seções e o álbum carregam.
2. Entre com uma conta Google. Confirme o retorno à seção RSVP, salve uma resposta privada, recarregue e edite. Escolha uma figurinha e confirme que a posição reaparece após recarregar.
3. Em outra sessão, confirme que a resposta e figurinha privadas permanecem restritas à primeira conta. Ative o consentimento e verifique o primeiro nome e a figurinha. Altere para **Talvez** e confira que ambos somem da leitura pública.
4. Teste `/organizador` e a exportação com uma conta comum e com a conta autorizada. Oculte e restaure uma resposta. Saia e confira que a sessão e o acesso terminam.
