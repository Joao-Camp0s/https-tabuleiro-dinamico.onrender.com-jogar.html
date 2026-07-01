# Pôr o site online (fora do localhost)

O multiplayer (e o resto do site) já funciona em localhost e na tua rede local
(`http://<o-teu-ip-local>:3000/jogar.html`, com `npm start`). Para jogares com
alguém fora da tua rede, o servidor Node tem de estar hospedado num serviço
online. Este guia usa o **Render** (tem plano gratuito, é o mais simples para
este projeto).

## 0. Pré-requisitos

- Ter o projeto num repositório Git (GitHub, GitLab ou Bitbucket) — o Render
  faz deploy a partir de um repositório.
- Ter corrido `npm install --prefix json` pelo menos uma vez localmente para
  confirmar que `npm start` funciona (abre `http://localhost:3000/jogar.html`).

Se ainda não tens o projeto no GitHub:

```powershell
git init
git add .
git commit -m "Primeira versão do site"
```

Depois cria um repositório vazio em https://github.com/new e segue as
instruções que o GitHub mostra para "push an existing repository".

## 1. Criar o serviço no Render

1. Entra em https://render.com e cria conta (podes usar o GitHub para entrar).
2. **New +** → **Web Service**.
3. Escolhe o repositório deste projeto.
4. Configura assim (importante, por causa da pasta `json/` onde está o
   `package.json`):
   - **Root Directory**: `json`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Clica em **Create Web Service**. O primeiro deploy demora 1-3 minutos.

Quando terminar, o Render dá-te um URL público, por exemplo:
`https://tabuleiro-dinamico.onrender.com`

O jogo fica acessível em `https://tabuleiro-dinamico.onrender.com/jogar.html`
para qualquer pessoa, em qualquer rede.

## 2. Notas importantes

- **Plano gratuito "adormece"**: se ninguém aceder ao site durante ~15
  minutos, o Render desliga o serviço. O pedido seguinte demora uns 30-50s a
  "acordar" o servidor — normal, não é um erro.
- **Socket.io funciona sem configuração extra** no Render (ao contrário de
  algumas plataformas serverless, o Render corre um processo Node persistente,
  que é o que o Socket.io precisa).
- **Supabase continua a funcionar na mesma** — as chamadas ao Supabase são
  feitas diretamente do browser (`js/supabase-config.js`), não passam pelo
  teu servidor Node, por isso não há nada a mudar aí.
- Se mais tarde quiseres um domínio próprio (ex: `tabuleirodinamico.pt`), o
  Render permite associar domínios personalizados nas definições do serviço.

## Alternativas ao Render

- **Railway** (railway.app) — processo semelhante, também tem plano gratuito
  com limite de horas/mês.
- **Fly.io** — mais configurável, requer a CLI `flyctl` e um `Dockerfile` ou
  `fly.toml`; vale a pena se precisares de mais controlo.
