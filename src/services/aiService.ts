/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeProspect(url: string) {
  const prompt = `Analiza el sitio web ${url} para una herramienta de automatización de marketing. 
  Necesito:
  1. Comparativa detallada de 3 competidores (Nombre, Fuerza, Debilidad).
  2. Análisis de sentimiento basado en la percepción del mercado y reseñas simuladas.
  3. Clasificación del negocio (Sector primario y secundario).
  4. Cálculo de 'Pérdida de Oportunidad' financiera basada en tráfico y conversión estimada.
  5. Selector GenAI (Lógica de decisión): Elige una de estas categorías basándote en lo que más necesita el cliente:
     - 'Identity' (Ideas de Market / Eslogan / Logo)
     - 'Outreach' (Follet / Newsletter / Mailing)
     - 'Social' (RRSS / Banner)
  6. Gancho visual: Un copy creativo para un anuncio o mejora visual acorde a la categoría elegida.
  7. ROI estimado: Beneficio proyectado vs coste del servicio.
  8. Momento Clave: ¿Es un negocio reciente? ¿Tiene vulnerabilidades digitales? (Simula una detección de momento clave).
  9. Identificación del Propietario: Intenta deducir el nombre del fundador o CEO basándote en la URL o sector (simulado).
  10. Precisión de Resultado: Una métrica de confianza (0-100) sobre la recomendación.
  
  Responde ÚNICAMENTE en formato JSON plano sin bloques de código.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            competitors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  strength: { type: Type.STRING },
                  weakness: { type: Type.STRING }
                }
              }
            },
            sentiment: { type: Type.STRING },
            sector: { type: Type.STRING },
            opportunityLoss: { type: Type.NUMBER },
            recommendedProduct: { 
              type: Type.STRING, 
              enum: ["Identity", "Outreach", "Social"],
              description: "Estrategia elegida según el perfil"
            },
            roiEstimate: { type: Type.STRING },
            hookText: { type: Type.STRING },
            keyMoment: { type: Type.STRING },
            ownerName: { type: Type.STRING },
            qualityScore: { type: Type.NUMBER }
          },
          required: ["competitors", "sentiment", "sector", "opportunityLoss", "recommendedProduct", "roiEstimate", "hookText", "keyMoment", "ownerName", "qualityScore"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function generateNewsletter(companyName: string, sector: string, hook: string, ownerName?: string) {
  const prompt = `Escribe una newsletter de marketing persuasiva para ${ownerName ? `el cliente ${ownerName} de` : ''} la empresa ${companyName} del sector ${sector}. 
  Usa este gancho creativo: "${hook}".
  Debe incluir:
  1. Asunto impactante.
  2. Un saludo personalizado ${ownerName ? `usando el nombre ${ownerName}` : ''}.
  3. Cuerpo del mensaje con beneficios claros sobre por qué necesitan automatizar su marketing.
  4. Llamadas a la acción (CTA) para agendar una cita.
  5. Tono profesional, innovador y muy cercano.
  
  Responde ÚNICAMENTE con el contenido de la newsletter en formato Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Newsletter Gen Error:", error);
    return "Error generando newsletter.";
  }
}

export async function analyzeSentiment(sector: string, location: string) {
  const prompt = `Analiza las reseñas de Google Maps de los 3 competidores principales en ${location} para el sector ${sector}.
  Identifica puntos débiles (quejas comunes) y puntos fuertes.
  Responde con un JSON breve: { "weaknesses": string[], "strengths": string[], "opportunity": string }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Sentiment Analysis Error:", error);
    return { weaknesses: ["Atención lenta"], strengths: ["Buen producto"], opportunity: "Mejorar la rapidez" };
  }
}

export async function generateLogoConcepts(companyName: string, sector: string) {
  const prompt = `Genera 3 conceptos creativos y minimalistas para el logo de la empresa ${companyName} (${sector}).
  Describe la paleta de colores, el símbolo y la tipografía sugerida.
  Responde en Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    return "Error generando conceptos de logo.";
  }
}

export async function generateVideoPitchScript(ownerName: string, companyName: string, sector: string, hook: string) {
  const prompt = `Escribe un guión de 30 segundos para un vídeo de venta personalizado (tipo HeyGen).
  Nombre del dueño: ${ownerName}. Empresa: ${companyName}. Sector: ${sector}.
  Gancho: ${hook}. 
  El tono debe ser de alto impacto, profesional y generar curiosidad inmediata.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    return "Error generando guión de vídeo.";
  }
}

export async function generateSocialPosts(companyName: string, sector: string, hook: string) {
  const prompt = `Crea 3 posts de redes sociales para la empresa ${companyName} (${sector}). 
  Uno para LinkedIn (profesional), uno para Instagram (creativo con emojis) y uno para X/Twitter (corto y directo).
  Usa este gancho: ${hook}. 
  Responde en Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    return "Error generando posts sociales.";
  }
}

export async function generateSEOStrategy(companyName: string, sector: string, location: string) {
  const prompt = `Sugiere una estrategia SEO para ${companyName} en ${location}. 
  Incluye: 5 palabras clave de alta conversión, una meta-descripción sugerida y una idea de post para el blog.
  Responde con un JSON: { "keywords": string[], "meta": string, "blogIdea": string }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { keywords: ["SEO", "Marketing"], meta: "La mejor empresa", blogIdea: "Cómo mejorar" };
  }
}

export async function translateContent(content: string, targetLang: string) {
  const prompt = `Traduce el siguiente contenido al idioma ${targetLang}. Mantén el tono profesional y persuasivo:
  
  ${content}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    return "Error en la traducción.";
  }
}

export async function identifyCompetitors(companyName: string, sector: string, location: string) {
  const prompt = `Identifica a los 5 principales competidores directos de la empresa ${companyName} en ${location} para el sector ${sector}.
  Para cada uno, proporciona: nombre, una URL de su sitio web (real o sugerida) y una breve nota sobre su ventaja competitiva.
  Responde únicamente con un JSON: { "competitors": [{ "name": string, "url": string, "notes": string }] }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Competitor identification error:", error);
    return { competitors: [] };
  }
}

export async function generateScrapedLeads(sector: string, location: string, contextSearch: string) {
  const prompt = `Actúa como un agente de scraping experto. Basado en el sector "${sector}", la localización "${location}" y estos resultados de búsqueda:
  
  ${contextSearch}
  
  Extrae o sugiere 5 empresas reales que sean PROSPECTOS POTENCIALES (leads) para venderles servicios de marketing. No incluyas a la empresa original.
  Para cada una proporciona: name, url, notes (por qué es un buen prospecto).
  Responde únicamente con un JSON: { "leads": [{ "name": string, "url": string, "notes": string }] }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { leads: [] };
  }
}

export async function deepScrapeInfo(queryOrUrl: string) {
  const prompt = `Actúa como un agente de OSINT y web scraping. Procesa la siguiente búsqueda o URL: "${queryOrUrl}".
  Genera 5 resultados detallados de empresas reales (o altamente probables para este sector).
  Para cada empresa, necesito:
  - Nombre y Sector
  - URL del sitio web
  - CORREOS ELECTRÓNICOS (sugiere correos de contacto corporativos estándar: info@, contacto@, gerencia@...)
  - REDES SOCIALES (LinkedIn, Instagram)
  - TELÉFONO
  - STACK TECNOLÓGICO (ej: WordPress, Shopify, Next.js)
  - OPORTUNIDAD (por qué necesitan marketing: "Web lenta", "Sin SEO", "Pixel no instalado")
  
  Responde únicamente con un JSON:
  {
    "results": [
      {
        "name": string,
        "url": string,
        "emails": string[],
        "socials": { "linkedin": string, "instagram": string },
        "phone": string,
        "tech": string[],
        "opportunity": string,
        "description": string
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Deep Scrape Error:", error);
    return { results: [] };
  }
}

export async function generateVisualHook(description: string): Promise<string> {
  const prompt = `Boceto minimalista y profesional para un ${description}. Estilo high-end marketing agency.`;
  // Using the generateContent for image generation as per gemini-api skill
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return "https://picsum.photos/seed/hook/400/400";
  } catch (error) {
    console.error("Image Gen Error:", error);
    return "https://picsum.photos/seed/hook/400/400";
  }
}
