FROM node:20-alpine3.19

# Cài đặt các công cụ cần thiết
RUN apk update && apk add bash
RUN apk add --no-cache g++ make python3

WORKDIR /app

# Copy package files trước để tận dụng cache
COPY package*.json ./
RUN npm install pm2 -g
RUN npm install

# Copy toàn bộ code
COPY . .

# Build dự án
RUN npm run build

# QUAN TRỌNG: Hugging Face yêu cầu port 7860
ENV PORT=7860
EXPOSE 7860

# Cấp quyền cho user 1000 (mặc định của HF)
RUN chmod -R 777 /app

# Chạy bằng pm2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]