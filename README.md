# Gringoou App (Next.js)

## Rodar localmente

1. Instale as dependencias:
   `npm install`
2. Configure o arquivo `.env.local` com pelo menos:
   `NEXTAUTH_URL=http://localhost:3000`
   `GOOGLE_CLIENT_ID=...`
   `GOOGLE_CLIENT_SECRET=...`
   `NEXTAUTH_SECRET=...`
   `NEXT_PUBLIC_GEMINI_API_KEY=...`
3. No Google Cloud Console, adicione `http://localhost:3000/api/auth/callback/google` em Authorized redirect URIs para testar localmente.
4. Inicie em modo desenvolvimento:
   `npm run dev`
5. Abra:
   `http://localhost:3000`

## Modo de manutencao

Se quiser bloquear o acesso da plataforma temporariamente:

1. Defina no `.env.local`:
   `MAINTENANCE_MODE=true`
2. Adicione seu email em:
   `MAINTENANCE_ALLOWLIST_EMAILS="seuemail@dominio.com"`
3. Opcionalmente, adicione IDs de usuario em:
   `MAINTENANCE_ALLOWLIST_USER_IDS="user-id-1,user-id-2"`
4. Na Vercel, cadastre as mesmas variaveis em **Project Settings > Environment Variables** para o ambiente desejado.
5. Faça um novo deploy para aplicar.

## Producao

- Dominio final: `https://gringoou.com`
- Callback do Google em producao: `https://gringoou.com/api/auth/callback/google`
