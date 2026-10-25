#!/bin/bash
# ============================================================
#  n8n ONE-CLICK INSTALL — Paste this entire script into your
#  Hostinger VPS terminal (Ubuntu) as root
# ============================================================
#
#  BEFORE RUNNING: Edit these 4 values below ↓↓↓
# ============================================================

DUCKDNS_SUBDOMAIN="auctiongera"          # ← Your DuckDNS subdomain
DUCKDNS_TOKEN="YOUR_DUCKDNS_TOKEN_HERE"  # ← Your DuckDNS token
N8N_ADMIN_USER="admin"                   # ← n8n login username
N8N_ADMIN_PASS="ChangeMe123!"            # ← n8n login password

# ============================================================
#  DO NOT EDIT BELOW THIS LINE
# ============================================================

set -euo pipefail

N8N_HOST="${DUCKDNS_SUBDOMAIN}.duckdns.org"
N8N_LICENSE_KEY="4b8479f4-87c3-4d77-bb86-402558acbeeb"
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
DB_PASS=$(openssl rand -hex 16)
SERVER_IP=$(curl -s https://api.ipify.org)

echo ""
echo "======================================"
echo "  n8n Installer — Starting..."
echo "  Server IP: ${SERVER_IP}"
echo "  Domain:    ${N8N_HOST}"
echo "======================================"
echo ""

# --- Step 1: System update ---
echo "[1/6] Updating system..."
apt-get update -y && apt-get upgrade -y -q

# --- Step 2: Install Docker ---
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker && systemctl start docker
    echo "  Docker installed!"
else
    echo "  Docker already installed, skipping."
fi

# --- Step 3: DuckDNS ---
echo "[3/6] Setting up DuckDNS..."
curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=${SERVER_IP}"
echo ""
mkdir -p /opt/duckdns
cat > /opt/duckdns/duck.sh << EOF
#!/bin/bash
curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=" > /dev/null
EOF
chmod +x /opt/duckdns/duck.sh
(crontab -l 2>/dev/null | grep -v duckdns; echo "*/5 * * * * /opt/duckdns/duck.sh") | crontab -
echo "  DuckDNS configured!"

# --- Step 4: Firewall ---
echo "[4/6] Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
    echo "  Firewall configured!"
fi

# --- Step 5: Create n8n project ---
echo "[5/6] Creating n8n configuration..."
mkdir -p /opt/n8n && cd /opt/n8n

cat > .env << EOF
N8N_HOST=${N8N_HOST}
N8N_LICENSE_KEY=${N8N_LICENSE_KEY}
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
N8N_USER=${N8N_ADMIN_USER}
N8N_PASSWORD=${N8N_ADMIN_PASS}
POSTGRES_USER=n8n_user
POSTGRES_PASSWORD=${DB_PASS}
TIMEZONE=Europe/Berlin
EOF
chmod 600 .env

cat > docker-compose.yml << 'DCEOF'
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_HOST}/
      - N8N_LICENSE_ACTIVATION_KEY=${N8N_LICENSE_KEY}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - GENERIC_TIMEZONE=${TIMEZONE}
      - TZ=${TIMEZONE}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - n8n-net

  postgres:
    image: postgres:16-alpine
    container_name: n8n-postgres
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d n8n"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - n8n-net

  caddy:
    image: caddy:2-alpine
    container_name: n8n-caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      - N8N_HOST=${N8N_HOST}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - n8n
    networks:
      - n8n-net

volumes:
  n8n_data:
  pg_data:
  caddy_data:
  caddy_config:

networks:
  n8n-net:
DCEOF

cat > Caddyfile << 'CEOF'
{$N8N_HOST} {
    reverse_proxy n8n:5678 {
        flush_interval -1
    }
}
CEOF

# Management script
cat > manage.sh << 'MEOF'
#!/bin/bash
cd /opt/n8n
case "${1:-help}" in
    start)   docker compose up -d ;;
    stop)    docker compose down ;;
    restart) docker compose restart ;;
    update)  docker compose pull && docker compose up -d ;;
    logs)    docker compose logs -f "${2:-n8n}" ;;
    status)  docker compose ps ;;
    backup)
        mkdir -p /opt/n8n-backups
        docker exec n8n-postgres pg_dump -U n8n_user n8n > "/opt/n8n-backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "Backup saved to /opt/n8n-backups/"
        ;;
    *) echo "Usage: $0 {start|stop|restart|update|logs|status|backup}" ;;
esac
MEOF
chmod +x manage.sh

echo "  Configuration created!"

# --- Step 6: Launch ---
echo "[6/6] Pulling images and starting n8n..."
docker compose pull
docker compose up -d

echo ""
echo "Waiting for services to start..."
sleep 15

if docker ps --format '{{.Names}}' | grep -q "^n8n$"; then
    echo ""
    echo "======================================"
    echo "  SUCCESS! n8n is running!"
    echo "======================================"
    echo ""
    echo "  URL:      https://${N8N_HOST}"
    echo "  User:     ${N8N_ADMIN_USER}"
    echo "  Password: ${N8N_ADMIN_PASS}"
    echo ""
    echo "  Commands:"
    echo "    /opt/n8n/manage.sh status"
    echo "    /opt/n8n/manage.sh logs"
    echo "    /opt/n8n/manage.sh update"
    echo "    /opt/n8n/manage.sh backup"
    echo "    /opt/n8n/manage.sh restart"
    echo ""
    echo "  SSL may take 1-2 min to provision."
    echo "======================================"
else
    echo ""
    echo "WARNING: Containers may not be running."
    echo "Run: cd /opt/n8n && docker compose logs"
fi
