#!/bin/bash
# ============================================================
# IDAZ Agency - Auto Deploy Script
# Chạy lệnh này trên Server Ubuntu để cài đặt tự động
# Usage: bash deploy.sh
# ============================================================

set -e  # Dừng ngay nếu có lỗi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Bắt đầu Deploy IDAZ Agency...${NC}"

# --- BƯỚC 1: Cập nhật OS ---
echo -e "\n${YELLOW}[1/8] Cập nhật hệ thống...${NC}"
sudo apt update && sudo apt upgrade -y

# --- BƯỚC 2: Cài Node.js 20 ---
echo -e "\n${YELLOW}[2/8] Cài đặt Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "✅ Node.js: $(node -v)"

# --- BƯỚC 3: Cài PM2 & Nginx ---
echo -e "\n${YELLOW}[3/8] Cài PM2 và Nginx...${NC}"
sudo npm install -g pm2 2>/dev/null
sudo apt install -y nginx
echo "✅ PM2: $(pm2 -v)"

# --- BƯỚC 4: Clone / Pull code ---
echo -e "\n${YELLOW}[4/8] Cài đặt source code...${NC}"
if [ -d "/var/www/idaz/.git" ]; then
    echo "Repo đã tồn tại, đang pull code mới..."
    cd /var/www/idaz && git pull origin main
else
    echo "Clone repo mới..."
    sudo mkdir -p /var/www/idaz
    sudo chown $USER:$USER /var/www/idaz
    git clone https://github.com/iamsir995/IDAZ.git /var/www/idaz
    cd /var/www/idaz
fi

# --- BƯỚC 5: Install dependencies ---
echo -e "\n${YELLOW}[5/8] Cài đặt dependencies...${NC}"
cd /var/www/idaz/backend && npm install --production
cd /var/www/idaz/frontend && npm install

# --- BƯỚC 6: Kiểm tra .env ---
echo -e "\n${YELLOW}[6/8] Kiểm tra file môi trường...${NC}"
if [ ! -f "/var/www/idaz/backend/.env" ]; then
    echo -e "${RED}⚠️  Chưa có file backend/.env!${NC}"
    echo "   → Copy file mẫu: cp /var/www/idaz/backend/.env.example /var/www/idaz/backend/.env"
    echo "   → Sau đó điền thông tin: nano /var/www/idaz/backend/.env"
    echo -e "${RED}Dừng deploy. Hãy tạo file .env rồi chạy lại script này.${NC}"
    exit 1
fi
echo "✅ File backend/.env tồn tại."

if [ ! -f "/var/www/idaz/frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠️  Chưa có frontend/.env.local. Đang tạo từ mẫu...${NC}"
    cp /var/www/idaz/frontend/.env.example /var/www/idaz/frontend/.env.local
    echo "   → Kiểm tra và sửa file: nano /var/www/idaz/frontend/.env.local"
fi

# --- BƯỚC 7: Build Frontend ---
echo -e "\n${YELLOW}[7/8] Build Frontend Next.js (có thể mất vài phút)...${NC}"
cd /var/www/idaz/frontend && npm run build
echo "✅ Build Frontend hoàn tất."

# --- BƯỚC 8: Cấu hình Nginx ---
echo -e "\n${YELLOW}[8/8] Cấu hình Nginx...${NC}"
sudo cp /var/www/idaz/nginx.conf /etc/nginx/sites-available/idaz.com.vn
sudo ln -sf /etc/nginx/sites-available/idaz.com.vn /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx đã cấu hình xong."

# --- Start PM2 ---
echo -e "\n${YELLOW}Khởi động ứng dụng với PM2...${NC}"
cd /var/www/idaz
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo -e "\n${GREEN}============================================"
echo "✅ DEPLOY HOÀN TẤT!"
echo "============================================"
echo ""
echo "🌐 Website: http://idaz.com.vn"
echo "🔌 API:     http://idaz.com.vn/api"
echo ""
echo "Bước tiếp theo:"
echo "  1. Trỏ DNS domain về IP Server này"
echo "  2. Cài SSL: sudo certbot --nginx -d idaz.com.vn -d www.idaz.com.vn"
echo ""
echo "Kiểm tra trạng thái: pm2 status"
echo -e "============================================${NC}"
