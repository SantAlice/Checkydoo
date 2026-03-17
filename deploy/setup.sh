#!/bin/bash
# Скрипт первоначальной настройки VPS для Checkydoo
# Запускать от root: bash setup.sh

set -e

echo "=== 1. Обновление системы ==="
apt update && apt upgrade -y

echo "=== 2. Установка Docker ==="
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

echo "=== 3. Установка Docker Compose ==="
apt install -y docker-compose-plugin

echo "=== 4. Установка Nginx и Certbot ==="
apt install -y nginx certbot python3-certbot-nginx

echo "=== 5. Клонирование репозитория ==="
mkdir -p /opt
cd /opt
if [ ! -d "Checkydoo" ]; then
    git clone https://github.com/SantAlice/Checkydoo.git
fi
cd Checkydoo

echo "=== 6. Создание .env файла ==="
if [ ! -f ".env" ]; then
    DB_PASS=$(openssl rand -base64 24)
    JWT_SEC=$(openssl rand -base64 48)
    cat > .env << EOL
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT_SEC}
CORS_ORIGIN=http://$(curl -s ifconfig.me)
VITE_API_URL=/api
EOL
    echo "Файл .env создан. Отредактируй CORS_ORIGIN если есть домен:"
    echo "  nano /opt/Checkydoo/.env"
fi

echo ""
echo "=== Готово! ==="
echo ""
echo "Следующие шаги:"
echo "  1. Отредактируй .env:  nano /opt/Checkydoo/.env"
echo "  2. Запусти:            cd /opt/Checkydoo && docker compose up -d --build"
echo "  3. Проверь:            curl http://localhost:3001/api/health"
echo ""
echo "Для SSL (если есть домен):"
echo "  1. Замени your-domain.ru в deploy/nginx-host.conf"
echo "  2. cp deploy/nginx-host.conf /etc/nginx/sites-available/checkydoo"
echo "  3. ln -s /etc/nginx/sites-available/checkydoo /etc/nginx/sites-enabled/"
echo "  4. certbot --nginx -d your-domain.ru"
echo "  5. systemctl reload nginx"
