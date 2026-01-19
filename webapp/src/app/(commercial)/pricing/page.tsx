import React from 'react';
import { Check, X } from 'lucide-react';

const plans = [
  {
    name: "Free",
    price: "Gratis",
    period: "siempre",
    description: "Perfecto para probar el servicio",
    features: [
      { text: "100 generaciones/mes", included: true },
      { text: "Generación desde prompts", included: true },
      { text: "Humanización básica", included: true },
      { text: "Exportación DOCX, PDF, TXT", included: true },
      { text: "Historial de 30 días", included: true },
      { text: "Modelos especializados", included: false },
      { text: "Verificación con detectores IA", included: false },
      { text: "Detección de similitud", included: false },
      { text: "API access", included: false },
      { text: "Soporte prioritario", included: false }
    ],
    cta: "Empezar Gratis",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/mes",
    description: "Para estudiantes serios",
    features: [
      { text: "Generaciones ilimitadas", included: true },
      { text: "Generación desde prompts", included: true },
      { text: "Humanización avanzada completa", included: true },
      { text: "Exportación todos los formatos", included: true },
      { text: "Historial ilimitado", included: true },
      { text: "4 modelos especializados", included: true },
      { text: "Verificación ilimitada detectores", included: true },
      { text: "Detección de similitud completa", included: true },
      { text: "Safety Score y reportes", included: true },
      { text: "Soporte prioritario 24/7", included: true }
    ],
    cta: "Empezar Prueba 7 Días",
    highlighted: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Para instituciones y equipos",
    features: [
      { text: "Todo de Pro +", included: true },
      { text: "API REST completa", included: true },
      { text: "Webhooks personalizados", included: true },
      { text: "Multi-usuarios (hasta 50)", included: true },
      { text: "Panel de admin avanzado", included: true },
      { text: "Fine-tuning personalizado", included: true },
      { text: "Corpus privado", included: true },
      { text: "SLA 99.9% uptime", included: true },
      { text: "Soporte dedicado", included: true },
      { text: "Consultoría académica", included: true }
    ],
    cta: "Contactar Ventas",
    highlighted: false
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Precios Simples y Transparentes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades académicas
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white rounded-2xl shadow-lg transition-transform hover:scale-105 ${
                plan.highlighted ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition mb-8 ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included ? 'text-gray-700' : 'text-gray-400'
                        }
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Únete a miles de estudiantes que ya confían en HumanWriter AI
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
            Empezar Gratis
          </button>
        </div>
      </div>
    </div>
  );
}
