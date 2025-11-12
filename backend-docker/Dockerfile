# Usar imagen oficial de Node.js con herramientas de compilación
FROM node:18-alpine

# Información del mantenedor
LABEL maintainer="AlejandroSazo00"
LABEL description="Backend Docker para MiRutinaVisual con OAuth2.0"
LABEL version="1.0.0"

# Instalar herramientas necesarias para compilar módulos nativos
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (npm install recompilará automáticamente)
RUN npm install --production && \
    npm cache clean --force

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando de salud
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
CMD ["node", "server.js"]
