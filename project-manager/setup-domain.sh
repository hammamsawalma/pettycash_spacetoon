#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Spacetoon Pocket — EC2 Domain Setup Script
#  Installs Nginx reverse proxy + Let's Encrypt SSL for stpocket.com
#
#  Usage: ssh into EC2, then:
#    chmod +x setup-domain.sh && ./setup-domain.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

DOMAIN="stpocket.com"
EMAIL="blackbearfinance25@gmail.com"
APP_PORT=3000

echo "══════════════════════════════════════════════════════════"
echo "  🌐 Setting up ${DOMAIN} on this EC2 instance"
echo "══════════════════════════════════════════════════════════"

# ─── Step 1: Install Nginx ──────────────────────────────────────────────────
echo ""
echo "📦 Step 1: Installing Nginx..."
if command -v nginx &> /dev/null; then
    echo "  ✓ Nginx already installed"
else
    sudo yum install -y nginx || sudo amazon-linux-extras install nginx1 -y
    echo "  ✓ Nginx installed"
fi
sudo systemctl start nginx
sudo systemctl enable nginx
echo "  ✓ Nginx started and enabled"

# ─── Step 2: Install Certbot ────────────────────────────────────────────────
echo ""
echo "🔒 Step 2: Installing Certbot..."
if command -v certbot &> /dev/null; then
    echo "  ✓ Certbot already installed"
else
    sudo yum install -y certbot python3-certbot-nginx 2>/dev/null || \
    sudo pip3 install certbot certbot-nginx 2>/dev/null || \
    (sudo yum install -y python3-pip && sudo pip3 install certbot certbot-nginx)
    echo "  ✓ Certbot installed"
fi

# ─── Step 3: Configure Nginx ────────────────────────────────────────────────
echo ""
echo "⚙️  Step 3: Configuring Nginx reverse proxy..."

# Remove default config if it conflicts
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

sudo tee /etc/nginx/conf.d/stpocket.conf > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # File upload limit
        client_max_body_size 10M;
        
        # Timeouts for SSR
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx
echo "  ✓ Nginx configured for ${DOMAIN}"

# ─── Step 4: Verify DNS (wait for propagation) ──────────────────────────────
echo ""
echo "🔍 Step 4: Checking DNS propagation..."
RESOLVED_IP=$(dig +short ${DOMAIN} 2>/dev/null || nslookup ${DOMAIN} 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}')
MY_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

if [ "$RESOLVED_IP" = "$MY_IP" ]; then
    echo "  ✓ DNS OK: ${DOMAIN} → ${RESOLVED_IP}"
else
    echo "  ⚠️  DNS not yet propagated: ${DOMAIN} → ${RESOLVED_IP:-NOT_FOUND} (expected ${MY_IP})"
    echo "  Waiting 30 seconds and retrying..."
    sleep 30
    RESOLVED_IP=$(dig +short ${DOMAIN} 2>/dev/null)
    if [ "$RESOLVED_IP" = "$MY_IP" ]; then
        echo "  ✓ DNS OK now: ${DOMAIN} → ${RESOLVED_IP}"
    else
        echo "  ❌ DNS still not propagated. Run this script again in 15-30 minutes."
        echo "     Or manually run: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
        exit 1
    fi
fi

# ─── Step 5: SSL Certificate ────────────────────────────────────────────────
echo ""
echo "🔐 Step 5: Generating SSL certificate..."
sudo certbot --nginx \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --non-interactive \
    --agree-tos \
    -m ${EMAIL} \
    --redirect

echo "  ✓ SSL certificate installed!"

# ─── Step 6: Setup auto-renewal ─────────────────────────────────────────────
echo ""
echo "🔄 Step 6: Setting up auto-renewal..."
sudo certbot renew --dry-run
# Add cron job for renewal
(sudo crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet") | sudo crontab - 2>/dev/null || true
echo "  ✓ Auto-renewal configured"

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✅ Domain Setup Complete!"
echo ""
echo "  🌐 https://${DOMAIN}"
echo "  🌐 https://www.${DOMAIN}"
echo "  🔒 SSL: Let's Encrypt (auto-renews)"
echo "  🔄 Proxy: Nginx → localhost:${APP_PORT}"
echo ""
echo "  Test: curl -I https://${DOMAIN}"
echo "══════════════════════════════════════════════════════════"
