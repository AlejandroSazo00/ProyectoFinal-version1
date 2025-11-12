# 🚀 DESPLIEGUE EN RED HAT OPENSHIFT
## MiRutinaVisual Backend - Guía Completa

---

## 📋 PRERREQUISITOS

### **🔑 Cuenta OpenShift:**
1. **🌐 Ir a:** [https://developers.redhat.com/developer-sandbox](https://developers.redhat.com/developer-sandbox)
2. **📝 Registrarse** con GitHub/Google/Red Hat
3. **✅ Activar** Developer Sandbox (30 días gratis)
4. **🎯 Acceder** al cluster asignado

### **🛠️ Herramientas Necesarias:**
- **📦 Git** (para subir código)
- **🌐 Navegador** (para OpenShift Console)
- **📱 oc CLI** (opcional, para comandos)

---

## 🚀 PASOS DE DESPLIEGUE

### **1️⃣ PREPARAR REPOSITORIO GITHUB**

```bash
# Subir código a GitHub (si no está)
git add .
git commit -m "🚀 Preparar para OpenShift deployment"
git push origin main
```

### **2️⃣ ACCEDER A OPENSHIFT CONSOLE**

1. **🌐 Login** en tu Developer Sandbox
2. **🎯 Seleccionar** "Developer" perspective
3. **📂 Crear** nuevo proyecto: `mirutinavisual`

### **3️⃣ CREAR SECRETS**

En OpenShift Console:
1. **⚙️ Secrets** → **Create Secret**
2. **📋 Nombre:** `mirutinavisual-secrets`
3. **🔑 Tipo:** Opaque
4. **📝 Agregar keys:**
   - `jwt-secret`: `mirutinavisual-production-jwt-secret-2024-very-secure-32chars`
   - `session-secret`: `mirutinavisual-production-session-secret-2024-secure`
   - `mongodb-uri`: `mongodb+srv://mirutinavisual:5%25S%230mmb@mirutinavisual.1shy5rk.mongodb.net/mirutinavisual?retryWrites=true&w=majority`
   - `google-client-id`: `DEMO_MODE`
   - `google-client-secret`: `DEMO_MODE`

### **4️⃣ CREAR APLICACIÓN DESDE GIT**

1. **➕ Add** → **From Git**
2. **🔗 Git Repo URL:** `https://github.com/AlejandroSazo00/MiRutinaVisual.git`
3. **📂 Context Dir:** `backend-docker`
4. **🏷️ Application Name:** `mirutinavisual`
5. **📛 Name:** `mirutinavisual-backend`
6. **🚀 Create**

### **5️⃣ CONFIGURAR VARIABLES DE ENTORNO**

En la aplicación creada:
1. **⚙️ Environment** tab
2. **🔗 Add from Secret:** `mirutinavisual-secrets`
3. **✅ Seleccionar** todas las keys
4. **💾 Save**

### **6️⃣ CONFIGURAR HEALTH CHECKS**

1. **❤️ Health Checks** tab
2. **➕ Add Readiness Probe:**
   - **Path:** `/health`
   - **Port:** `3000`
   - **Initial Delay:** `5s`
   - **Period:** `5s`
3. **➕ Add Liveness Probe:**
   - **Path:** `/health`
   - **Port:** `3000`
   - **Initial Delay:** `30s`
   - **Period:** `10s`

### **7️⃣ CREAR ROUTE (ACCESO PÚBLICO)**

1. **🌐 Networking** → **Routes**
2. **➕ Create Route**
3. **📛 Name:** `mirutinavisual-backend-route`
4. **🎯 Service:** `mirutinavisual-backend`
5. **🔒 Secure Route:** ✅ (TLS)
6. **🚀 Create**

---

## 🔧 CONFIGURACIÓN AVANZADA

### **📊 ESCALADO AUTOMÁTICO**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mirutinavisual-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mirutinavisual-backend
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### **📈 MONITOREO**

1. **📊 Monitoring** → **Metrics**
2. **📋 Dashboards** disponibles:
   - CPU Usage
   - Memory Usage
   - Network Traffic
   - Request Rate

---

## 🧪 VERIFICACIÓN DEL DESPLIEGUE

### **✅ ENDPOINTS A PROBAR:**

```bash
# Health Check
curl https://mirutinavisual-backend-XXXXX.apps.sandbox.x8i5.p1.openshiftapps.com/health

# Swagger Documentation
https://mirutinavisual-backend-XXXXX.apps.sandbox.x8i5.p1.openshiftapps.com/api-docs

# OAuth Status
curl https://mirutinavisual-backend-XXXXX.apps.sandbox.x8i5.p1.openshiftapps.com/oauth/status
```

### **📋 CHECKLIST DE VERIFICACIÓN:**

- [ ] **🟢 Pod Status:** Running
- [ ] **❤️ Health Check:** Passing
- [ ] **🌐 Route:** Accessible
- [ ] **🔒 HTTPS:** Working
- [ ] **📊 Swagger:** Loading
- [ ] **🔐 OAuth:** Configured
- [ ] **☁️ MongoDB:** Connected

---

## 🚨 TROUBLESHOOTING

### **❌ PROBLEMAS COMUNES:**

#### **1. Pod CrashLoopBackOff**
```bash
# Ver logs
oc logs deployment/mirutinavisual-backend

# Verificar variables de entorno
oc describe pod mirutinavisual-backend-xxxxx
```

#### **2. MongoDB Connection Failed**
- ✅ Verificar `mongodb-uri` en secrets
- ✅ Verificar IP whitelist en MongoDB Atlas
- ✅ Verificar credenciales

#### **3. Route Not Accessible**
- ✅ Verificar service está running
- ✅ Verificar port mapping (3000)
- ✅ Verificar firewall rules

---

## 📊 MÉTRICAS Y LOGS

### **📈 ACCESO A MÉTRICAS:**
1. **📊 Observe** → **Monitoring**
2. **📋 Dashboards** → Application metrics
3. **🔍 Query** custom metrics

### **📝 ACCESO A LOGS:**
```bash
# Ver logs en tiempo real
oc logs -f deployment/mirutinavisual-backend

# Ver logs de eventos
oc get events --sort-by='.lastTimestamp'
```

---

## 🔒 SEGURIDAD EN PRODUCCIÓN

### **🛡️ CONFIGURACIONES RECOMENDADAS:**

1. **🔑 Rotar Secrets** regularmente
2. **🌐 Configurar CORS** específico
3. **📊 Habilitar monitoring** de seguridad
4. **🔒 Usar HTTPS** siempre
5. **📋 Revisar logs** regularmente

### **⚠️ VARIABLES CRÍTICAS:**
- `JWT_SECRET`: Mínimo 32 caracteres aleatorios
- `MONGODB_URI`: Credenciales seguras
- `GOOGLE_CLIENT_*`: Configurar para producción

---

## 🎯 URLS FINALES

Una vez desplegado, tendrás:

- **🌐 Backend API:** `https://mirutinavisual-backend-XXXXX.apps.sandbox.x8i5.p1.openshiftapps.com`
- **📚 Swagger Docs:** `https://mirutinavisual-backend-XXXXX.apps.sandbox.x8i5.p1.openshiftapps.com/api-docs`
- **❤️ Health Check:** `https://mirutinavisual-backend-XXXXX.apps.sandbox.x8i5.p1.openshiftapps.com/health`
- **🔐 OAuth:** `https://mirutinavisual-backend-XXXXX.apps.sandbox.x8i5.p1.openshiftapps.com/oauth/google`

---

**📅 Tiempo estimado de despliegue:** 15-30 minutos  
**⏰ Válido por:** 30 días (Developer Sandbox)  
**🔄 Próxima acción:** Configurar CI/CD automático
