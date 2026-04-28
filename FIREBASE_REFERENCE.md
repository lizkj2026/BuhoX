# Guía de Referencia Firebase - MarketFlow AI

Como solicitaste una arquitectura Firebase, aquí tienes la especificación detallada de Firestore y las Reglas de Seguridad, aunque en este entorno de previsualización estemos usando Express + SQLite por restricciones de red.

## 1. Estructura de Firestore (firebase-blueprint.json)

```json
{
  "entities": {
    "User": {
      "title": "User",
      "description": "Perfiles de administrador y clientes.",
      "type": "object",
      "properties": {
        "email": { "type": "string" },
        "name": { "type": "string" },
        "role": { "type": "string", "enum": ["admin", "client"] },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["email", "role"]
    },
    "Prospect": {
      "title": "Prospect",
      "description": "Leads potenciales identificados y analizados.",
      "type": "object",
      "properties": {
        "userId": { "type": "string", "description": "ID del cliente dueño del lead" },
        "url": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string" },
        "social": {
          "type": "object",
          "properties": {
            "linkedin": { "type": "string" },
            "instagram": { "type": "string" }
          }
        },
        "analysis": {
          "type": "object",
          "description": "Resultado de Gemini: Competidores, Sentimiento, ROI"
        },
        "segmentation": {
          "type": "object",
          "description": "Clasificación IA: Sector, Pérdida de Oportunidad"
        },
        "status": {
          "type": "string",
          "enum": ["pending", "analyzed", "validated", "sent"]
        },
        "visualHook": { "type": "string", "description": "URL del boceto generado por IA" }
      }
    }
  },
  "firestore": {
    "/users/{userId}": {
      "schema": "User",
      "description": "Colección de usuarios"
    },
    "/prospects/{prospectId}": {
      "schema": "Prospect",
      "description": "Colección global de prospectos (filtrados por userId en reglas)"
    }
  }
}
```

## 2. Reglas de Seguridad (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función para verificar si el usuario está autenticado
    function isSignedIn() {
      return request.auth != null;
    }

    // Función para verificar si el usuario es Admin
    function isAdmin() {
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Regla por defecto: Denegar todo
    match /{document=**} {
      allow read, write: if false;
    }

    // Reglas para Usuarios
    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if isSignedIn(); // Registro inicial
      allow update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
    }

    // Reglas para Prospectos (Punto 10 del esquema: Dashboard privado vs público)
    match /prospects/{prospectId} {
      // Los clientes solo ven sus propios datos. Los admins ven todo.
      allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      
      // Solo admins o el sistema (vía Admin SDK) suelen crear prospectos en el Dashboard MCP
      allow create: if isSignedIn(); 
      
      // Validación Ghost Mode (Punto 7): El usuario valida su propia propuesta
      allow update: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      
      allow delete: if isAdmin();
    }
  }
}
```

## 3. Cloud Functions (onProspectCreate)

```javascript
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.onProspectCreate = onDocumentCreated("prospects/{prospectId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const data = snapshot.data();
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 1. Análisis de URL y Competidores
  // 2. Segmentación y ROI
  // 3. Generación de Gancho
  
  const prompt = `Analiza el sitio ${data.url} y genera un reporte de marketing...`;
  const result = await model.generateContent(prompt);
  const analysis = JSON.parse(result.response.text());

  return snapshot.ref.update({
    analysis: analysis,
    status: 'analyzed'
  });
});
```
