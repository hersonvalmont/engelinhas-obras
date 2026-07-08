#!/bin/bash
# ══════════════════════════════════════════════════════════════
# DEPLOY — Engelinhas Obras para VPS Hostinger
# Executar como root no VPS: bash deploy.sh
# ══════════════════════════════════════════════════════════════
set -e

echo "═══════════════════════════════════════════"
echo "  ENGELINHAS OBRAS — DEPLOY VPS"
echo "═══════════════════════════════════════════"

# ── 1. Criar estrutura de pastas ─────────────────────────────
mkdir -p /var/www/engelinhas/{server/uploads,public/static}
echo "✅ Pastas criadas"

# ── 2. Instalar dependências do backend ──────────────────────
cd /var/www/engelinhas/server
npm install --production
echo "✅ Dependências instaladas"

# ── 3. PM2 — iniciar ou reiniciar ────────────────────────────
if pm2 list | grep -q "engelinhas-api"; then
  pm2 restart engelinhas-api
  echo "✅ PM2 reiniciado"
else
  pm2 start ecosystem.config.cjs
  echo "✅ PM2 iniciado"
fi
pm2 save
echo "✅ PM2 salvo"

# ── 4. Nginx ─────────────────────────────────────────────────
cat > /etc/nginx/sites-available/engelinhas << 'NGINX'
server {
    listen 80;
    server_name obras.engelinhas.com;

    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Cache assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        proxy_pass http://127.0.0.1:3001;
        expires 7d;
        add_header Cache-Control "public";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/engelinhas /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "✅ Nginx configurado"

# ── 5. SSL (só se o DNS já apontar para este servidor) ───────
echo ""
echo "Para ativar HTTPS, execute:"
echo "  certbot --nginx -d obras.engelinhas.com --non-interactive --agree-tos -m ti@engelinhas.com.br"
echo ""

# ── 6. Teste ─────────────────────────────────────────────────
sleep 2
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$HTTP" = "200" ]; then
  echo "✅ API respondendo: HTTP $HTTP"
else
  echo "⚠️  API não respondeu (HTTP $HTTP) — verifique: pm2 logs engelinhas-api"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  DEPLOY CONCLUÍDO!"
echo "  Acesse: http://obras.engelinhas.com"
echo "═══════════════════════════════════════════"
