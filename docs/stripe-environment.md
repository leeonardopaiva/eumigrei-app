# Stripe environment

O Gringoou Ads processa contratos avulsos em dolar americano (USD) com PaymentIntents e Payment Element.

## Desenvolvimento local

Adicione ao `.env.local` (nunca versione esse arquivo):

```dotenv
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="rk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXTAUTH_URL="http://localhost:3000"
```

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: chave publica do sandbox. Pode ser enviada ao navegador.
- `STRIPE_SECRET_KEY`: prefira uma restricted key (`rk_test_...`) com acesso minimo a PaymentIntents. Nunca use esta chave no cliente.
- `STRIPE_WEBHOOK_SECRET`: valor temporario exibido por `stripe listen`; ele pertence somente ao listener local atual.
- `NEXTAUTH_URL`: origem local usada nos links de retorno e notificacoes.

Inicie o encaminhamento local em outro terminal:

```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copie o novo `whsec_...` impresso pelo comando para `STRIPE_WEBHOOK_SECRET` e reinicie o Next.js sempre que o segredo mudar.

## Preview e producao

Configure variaveis separadas no provedor de hospedagem:

```dotenv
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="rk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXTAUTH_URL="https://www.gringoou.com"
```

O `STRIPE_WEBHOOK_SECRET` de producao e obtido no endpoint criado no Stripe Workbench para:

```text
https://www.gringoou.com/api/webhooks/stripe
```

Eventos usados pelo sistema:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `charge.refunded`

Se o endpoint tambem receber Checkout Sessions, mantenha `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` e `checkout.session.expired`.

Use chaves diferentes para desenvolvimento, preview e producao. Marque as chaves privadas e o signing secret como variaveis sensiveis, restrinja o acesso por ambiente e rotacione qualquer chave que tenha sido compartilhada em chat, log ou commit.
