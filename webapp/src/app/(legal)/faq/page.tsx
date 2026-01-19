import React from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "¿Qué es HumanWriter AI?",
        a: "HumanWriter AI es una plataforma avanzada que genera texto académico utilizando IA y lo humaniza para que sea indetectable por detectores de IA. Además, incluye verificación y detección de similitudes."
      },
      {
        q: "¿Cómo funciona?",
        a: "1) Ingresas un prompt o subes un documento, 2) Nuestro sistema genera texto académico, 3) Lo humaniza automáticamente con técnicas avanzadas, 4) Puedes verificarlo con detectores externos, 5) Exportas en el formato que necesites."
      },
      {
        q: "¿Es legal usar HumanWriter AI?",
        a: "Sí, usar HumanWriter AI es legal. Sin embargo, debes cumplir con las políticas de integridad académica de tu institución. Recomendamos usar el contenido como apoyo y siempre consultar con tus profesores."
      }
    ]
  },
  {
    category: "Funcionalidades",
    questions: [
      {
        q: "¿Qué es la humanización de texto?",
        a: "La humanización es un proceso que ajusta el texto generado por IA para que tenga características más humanas: variación en longitud de oraciones (burstiness), expresiones coloquiales naturales, imperfecciones sutiles, y eliminación de palabras típicas de IA."
      },
      {
        q: "¿Qué detectores de IA soportan?",
        a: "Integramos con múltiples detectores: GPTZero, ZeroGPT, Copyleaks, y Winston AI. Esto te permite verificar tu texto antes de entregarlo y tener confianza en su calidad."
      },
      {
        q: "¿Qué es el reporte de similitud?",
        a: "Similar a Turnitin, comparamos tu texto contra nuestro corpus académico de 1,000+ documentos dominicanos para identificar similitudes y posible plagio. Te mostramos el porcentaje de similitud y las fuentes coincidentes."
      },
      {
        q: "¿Puedo usar mis propios documentos?",
        a: "Sí, puedes subir documentos PDF o DOCX para que el sistema los reescriba, expanda o modifique según tus instrucciones manteniendo el estilo académico."
      },
      {
        q: "¿Qué formatos de exportación tienen?",
        a: "Puedes exportar en DOCX (Word), PDF, TXT (texto plano) y Markdown (MD). Todos los formatos mantienen el formato académico."
      }
    ]
  },
  {
    category: "Modelos y Calidad",
    questions: [
      {
        q: "¿Qué modelos de IA usan?",
        a: "Utilizamos LLaMA 3.1 8B fine-tuneado específicamente con 1,000+ documentos académicos dominicanos (1990-2021). Tenemos 4 modelos especializados por disciplina: Ingeniería, Ciencias Sociales, Exactas/Naturales, y Agrarias."
      },
      {
        q: "¿Cómo miden la calidad?",
        a: "Calculamos múltiples métricas: Burstiness Score (variación de oraciones), Humanization Score (0-100), conteo de palabras típicas de IA, frecuencia de coloquialismos, y safety score (riesgo de detección)."
      },
      {
        q: "¿Qué es el Safety Score?",
        a: "Es un puntaje de 0-100 que indica qué tan seguro es tu texto. Se basa en resultados de múltiples detectores de IA. Verde (<30) = Seguro, Amarillo (30-70) = Riesgo moderado, Rojo (>70) = Alto riesgo."
      }
    ]
  },
  {
    category: "Planes y Precios",
    questions: [
      {
        q: "¿Tienen plan gratuito?",
        a: "Sí, el plan Free incluye 100 generaciones por mes con acceso a todas las funcionalidades básicas. Perfecto para probar el servicio."
      },
      {
        q: "¿Cuánto cuesta el plan Pro?",
        a: "El plan Pro cuesta $9.99/mes e incluye generaciones ilimitadas, acceso a todos los modelos especializados, verificación con detectores externos ilimitada, y soporte prioritario."
      },
      {
        q: "¿Puedo cancelar en cualquier momento?",
        a: "Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. No hay compromisos a largo plazo."
      },
      {
        q: "¿Ofrecen descuentos para estudiantes?",
        a: "Sí, ofrecemos 20% de descuento para estudiantes verificados. Contáctanos con tu email institucional."
      }
    ]
  },
  {
    category: "Seguridad y Privacidad",
    questions: [
      {
        q: "¿Es seguro subir mis documentos?",
        a: "Sí, todos los datos se transmiten encriptados (SSL/TLS) y se almacenan de forma segura. Solo tú tienes acceso a tus documentos. No compartimos ni vendemos tu información."
      },
      {
        q: "¿Guardan mis textos generados?",
        a: "Sí, guardamos tu historial de generaciones para que puedas acceder a ellas en cualquier momento. Puedes eliminar cualquier generación desde tu panel."
      },
      {
        q: "¿Pueden ver mis profesores que usé IA?",
        a: "No directamente a través de nosotros. Sin embargo, si tu institución usa detectores de IA o Turnitin, dependerá de qué tan bien humanizado esté el texto. Por eso incluimos verificación integrada."
      }
    ]
  },
  {
    category: "Soporte Técnico",
    questions: [
      {
        q: "¿Qué hago si el texto no se genera?",
        a: "Verifica tu conexión a internet, que tengas generaciones disponibles en tu plan, y que el prompt sea claro. Si el problema persiste, contacta soporte: support@humanwriter.ai"
      },
      {
        q: "¿Cuánto tarda una generación?",
        a: "Típicamente 20-60 segundos dependiendo de la longitud solicitada. Textos más largos (2000+ palabras) pueden tardar hasta 2 minutos."
      },
      {
        q: "¿Puedo usar HumanWriter AI en móvil?",
        a: "Sí, nuestra interfaz está optimizada para móviles. Puedes generar y gestionar texto desde cualquier dispositivo."
      },
      {
        q: "¿Tienen API para desarrolladores?",
        a: "Sí, el plan Enterprise incluye acceso completo a nuestra API REST. Consulta la documentación en docs.humanwriter.ai/api"
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-600">
            Todo lo que necesitas saber sobre HumanWriter AI
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, idx) => (
            <div key={idx} className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {category.category}
              </h2>
              <div className="space-y-6">
                {category.questions.map((faq, qIdx) => (
                  <details key={qIdx} className="group">
                    <summary className="flex justify-between items-center cursor-pointer list-none">
                      <h3 className="text-lg font-semibold text-gray-800 pr-4">
                        {faq.q}
                      </h3>
                      <ChevronDown className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-4 text-gray-700 leading-relaxed pl-2 border-l-2 border-blue-500">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿No encuentras tu respuesta?
          </h2>
          <p className="text-gray-700 mb-6">
            Nuestro equipo de soporte está listo para ayudarte
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@humanwriter.ai"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Enviar Email
            </a>
            <a
              href="/contact"
              className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              Formulario de Contacto
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
