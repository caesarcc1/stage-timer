# ⏱️ Stage Timer — Cronômetro de Palco Remoto em Tempo Real

Aplicativo Web Progressivo (PWA) de cronômetro para apresentações e palestras, com sincronização bidirecional em tempo real via WebSockets (Socket.io).

## 🚀 Arquitetura

- **Frontend (PWA)**: Next.js (App Router) + Tailwind CSS + Lucide Icons + PWA Service Worker + Screen Wake Lock API.
- **Deploy Frontend**: Vercel.
- **Backend (Tempo Real)**: Node.js + Socket.io Server rodando em container Docker na Hetzner VPS.
- **Reverse Proxy & SSL**: Nginx com certificado SSL Let's Encrypt para `stage-timer.178-156-222-232.sslip.io` (garantindo conexão segura `wss://` sem erros de Mixed Content no navegador).

---

## 📱 Rotas e Telas

### 1. Visor do Palco (`/` ou `/?room=palestra-01`)
- Fundo totalmente preto (`#000000`) para melhor visualização em palcos, telas OLED e projetores.
- Números gigantescos em fonte mono tabular (`tabular-nums`) para máxima legibilidade à distância.
- **Alertas visuais automáticos**:
  - Dígitos em **amarelo** nos últimos 2 minutos.
  - Dígitos e tela piscando em **vermelho** ao zerar (`00:00`).
  - Efeito de **Flash** quando o operador clica em "Piscar Tela" para chamar atenção do palestrante.
- **Screen Wake Lock API**: Mantém a tela do tablet ou notebook do palco sempre ativa, impedindo que ela durma ou bloqueie durante a palestra.
- Suporte a múltiplas salas via parâmetro de URL (`?room=minha-sala`).

### 2. Controle Remoto (`/control` ou `/control?room=palestra-01`)
- Otimizado para navegação mobile com uma mão.
- Visor espelhado sincronizado em tempo real no topo.
- Botões grandes para: **Iniciar**, **Pausar**, **Reset**.
- Ajustes finos: `+1m`, `-1m`, `+5m`, `-5m`.
- Presets rápidos de palestras: `15 min`, `20 min`, `30 min`, `45 min`, `60 min`.
- Definição manual de minutos personalizados.
- Botão "Piscar Tela" (alerta visual discreto para o palco).
- Envio de mensagens personalizadas em tempo real (ex: *"5 MINUTOS RESTANTES"*).
- Botão para copiar o link direto do visor para o palestrante.

---

## 🛠️ Tecnologias Utilizadas

- [Next.js](https://nextjs.org/) (v14)
- [React](https://react.dev/) (v18)
- [Socket.io](https://socket.io/) (v4)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Docker](https://www.docker.com/) & [Nginx](https://nginx.org/)
- [Let's Encrypt](https://letsencrypt.org/) SSL
