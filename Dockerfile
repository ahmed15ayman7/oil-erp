FROM node:20-alpine

WORKDIR /app

# تعديل أمر تثبيت الحزم لتجاوز مشكلة تعارض الإصدارات
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --legacy-peer-deps
RUN npm install  --legacy-peer-deps

# نسخ باقي الملفات
COPY . .

# بناء التطبيق
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# إعداد بيئة التشغيل
EXPOSE 3005
ENV PORT 3005
ENV HOSTNAME "0.0.0.0"

 CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
