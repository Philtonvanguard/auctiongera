#!/bin/bash
# ============================================================
#  n8n Self-Hosted Server Setup Script for Ubuntu
#  Run as root or with sudo on a fresh Ubuntu 22.04/24.04 VPS
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "============================================"
echo "   n8n Self-Hosted Server Setup"
echo "   Ubuntu + Docker + Caddy + PostgreSQL"
echo "============================================"
echo -e "${NC}"

# ---------------------------
# 1. Gather user input
# ---------------------------
read -p "Enter your DuckDNS subdomain (e.g. myauction): " DUCKDNS_SUBDOMAIN
read -p "Enter your DuckDNS token: " DUCKDNS_TOKEN
read -p "Enter n8n admin username [admin]: " N8N_USER
N8N_USER=${N8N_USER:-admin}
read -sp "Enter n8n admin password: " N8N_PASSWORD
echo ""
read -p "Enter timezone [Europe/Berlin]: " TIMEZONE
TIMEZONE=${TIMEZONE:-Europe/Berlin}

N8N_HOST="${DUCKDNS_SUBDOMAIN}.duckdns.org"
N8N_LICENSE_KEY="4b8479f4-87c3-4d77-bb86-402558acbeeb"
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_USER="n8n_db_user"

echo -e "\n${GREEN}[1/6] Updating system packages...${NC}"
apt-get update -y && apt-get upgrade -y

echo -e "${GREEN}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    apt-get install -y ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully!${NC}"
else
    echo -e "${YELLOW}Docker already installed, skipping...${NC}"
fi

echo -e "${GREEN}[3/6] Setting up DuckDNS...${NC}"
# Point DuckDNS subdomain to this server's IP
SERVER_IP=$(curl -s https://api.ipify.org)
echo -e "  Server IP: ${CYAN}${SERVER_IP}${NC}"
curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=${SERVER_IP}" && echo ""

# Set up cron job to keep DuckDNS updated every 5 minutes
mkdir -p /opt/duckdns
cat > /opt/duckdns/duck.sh << DUCKEOF
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=" | curl -k -o /opt/duckdns/duck.log -K -
DUCKEOF
chmod +x /opt/duckdns/duck.sh
(crontab -l 2>/dev/null | grep -v duckdns; echo "*/5 * * * * /opt/duckdns/duck.sh >/dev/null 2>&1") | crontab -
echo -e "${GREEN}DuckDNS configured! Domain: ${CYAN}${N8N_HOST}${NC}"

echo -e "${GREEN}[4/6] Creating n8n project directory...${NC}"
N8N_DIR="/opt/n8n"
mkdir -p "${N8N_DIR}"

# Write .env file
cat > "${N8N_DIR}/.env" << ENVEOF
N8N_HOST=${N8N_HOST}
N8N_LICENSE_KEY=${N8N_LICENSE_KEY}
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
N8N_USER=${N8N_USER}
N8N_PASSWORD=${N8N_PASSWORD}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
TIMEZONE=${TIMEZONE}
DUCKDNS_TOKEN=${DUCKDNS_TOKEN}
DUCKDNS_SUBDOMAIN=${DUCKDNS_SUBDOMAIN}
ENVEOF
chmod 600 "${N8N_DIR}/.env"

# Write docker-compose.yml
cat > "${N8N_DIR}/docker-compose.yml" << 'COMPEOF'
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
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
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
      - n8n-network

  postgres:
    image: postgres:16-alpine
    container_name: n8n-postgres
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d n8n"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - n8n-network

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
      - n8n-network

volumes:
  n8n_data:
  postgres_data:
  caddy_data:
  caddy_config:

networks:
  n8n-network:
    driver: bridge
COMPEOF

# Write Caddyfile
cat > "${N8N_DIR}/Caddyfile" << 'CADDYEOF'
{$N8N_HOST} {
    reverse_proxy n8n:5678 {
        flush_interval -1
    }
}
CADDYEOF

echo -e "${GREEN}[5/6] Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    ufw --force enable
    echo -e "${GREEN}Firewall configured (ports 80, 443, 22 open)${NC}"
else
    echo -e "${YELLOW}UFW not found, skipping firewall setup${NC}"
fi

echo -e "${GREEN}[6/6] Starting n8n...${NC}"
cd "${N8N_DIR}"
docker compose pull
docker compose up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check if containers are running
if docker ps | grep -q "n8n"; then
    echo -e "${GREEN}n8n is running!${NC}"
else
    echo -e "${RED}Warning: n8n container may not have started correctly.${NC}"
    echo "Run 'docker compose logs -f' in /opt/n8n to check."
fi

echo -e "\n${CYAN}============================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "  URL:       ${CYAN}https://${N8N_HOST}${NC}"
echo -e "  Username:  ${CYAN}${N8N_USER}${NC}"
echo -e "  Password:  ${CYAN}(the one you entered)${NC}"
echo ""
echo -e "  Files:     ${CYAN}/opt/n8n/${NC}"
echo -e "  Logs:      ${CYAN}docker compose -f /opt/n8n/docker-compose.yml logs -f${NC}"
echo -e "  Restart:   ${CYAN}docker compose -f /opt/n8n/docker-compose.yml restart${NC}"
echo -e "  Stop:      ${CYAN}docker compose -f /opt/n8n/docker-compose.yml down${NC}"
echo ""
echo -e "${YELLOW}  Note: SSL certificate may take 1-2 minutes to provision.${NC}"
echo -e "${YELLOW}  If the site doesn't load immediately, wait and retry.${NC}"
echo -e "${CYAN}============================================${NC}"
