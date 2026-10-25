#!/bin/bash
# ============================================
#  n8n Server Management Script
# ============================================

N8N_DIR="/opt/n8n"
cd "${N8N_DIR}"

case "${1:-help}" in
    start)
        echo "Starting n8n..."
        docker compose up -d
        echo "Done! Check: docker compose logs -f"
        ;;
    stop)
        echo "Stopping n8n..."
        docker compose down
        echo "Stopped."
        ;;
    restart)
        echo "Restarting n8n..."
        docker compose restart
        echo "Restarted."
        ;;
    update)
        echo "Updating n8n to latest version..."
        docker compose pull
        docker compose up -d
        echo "Updated!"
        ;;
    logs)
        docker compose logs -f "${2:-n8n}"
        ;;
    status)
        docker compose ps
        ;;
    backup)
        BACKUP_DIR="/opt/n8n-backups"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        mkdir -p "${BACKUP_DIR}"
        echo "Backing up database..."
        docker exec n8n-postgres pg_dump -U n8n_db_user n8n > "${BACKUP_DIR}/n8n_db_${TIMESTAMP}.sql"
        echo "Backup saved to: ${BACKUP_DIR}/n8n_db_${TIMESTAMP}.sql"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|update|logs|status|backup}"
        echo ""
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  update  - Pull latest n8n image and restart"
        echo "  logs    - Follow logs (optionally: logs postgres)"
        echo "  status  - Show container status"
        echo "  backup  - Backup PostgreSQL database"
        ;;
esac
