import React from 'react';
import { DollarSign, Users, TrendingUp, Gift, Zap, Shield } from 'lucide-react';

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Programa de Afiliados
            </h1>
            <p className="text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Gana 30% de comisión recurrente por cada referido.
              Monetiza tu audiencia mientras ayudas a estudiantes.
            </p>
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition">
              Unirme al Programa
            </button>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué unirse?
            </h2>
            <p className="text-xl text-gray-600">
              El mejor programa de afiliados para productos académicos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                30% de Comisión
              </h3>
              <p className="text-gray-600">
                Gana $3 por cada suscripción Pro ($9.99/mes).
                Comisiones recurrentes mientras el cliente permanezca activo.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ingresos Recurrentes
              </h3>
              <p className="text-gray-600">
                No es una comisión única. Ganas cada mes mientras tu referido
                permanezca suscrito. Potencial de ingresos pasivos ilimitado.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Pagos Rápidos
              </h3>
              <p className="text-gray-600">
                Pagos mensuales automáticos vía PayPal o transferencia bancaria.
                Mínimo $50 para retiro.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Cookie 90 Días
              </h3>
              <p className="text-gray-600">
                Si alguien hace clic en tu enlace, tienes 90 días para que
                se suscriban y aún recibir la comisión.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Material de Marketing
              </h3>
              <p className="text-gray-600">
                Banners, landing pages, email templates y más.
                Todo lo que necesitas para promocionar efectivamente.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard Completo
              </h3>
              <p className="text-gray-600">
                Rastrea clicks, conversiones y comisiones en tiempo real.
                Analíticas detalladas para optimizar tu estrategia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cómo Funciona
            </h2>
            <p className="text-xl text-gray-600">
              Simple, transparente y automático
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Regístrate Gratis
                </h3>
                <p className="text-gray-600">
                  Completa el formulario y obtén tu enlace de afiliado único
                  en menos de 2 minutos. Totalmente gratis.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Comparte tu Enlace
                </h3>
                <p className="text-gray-600">
                  Comparte en redes sociales, blog, YouTube, email list o donde
                  esté tu audiencia. Usa nuestro material de marketing.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Gana Comisiones
                </h3>
                <p className="text-gray-600">
                  Cuando alguien se suscriba usando tu enlace, ganas 30% cada mes.
                  Rastrea todo en tu dashboard y recibe pagos automáticos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Calculator */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6 text-center">
              Calculadora de Ganancias
            </h2>

            <div className="bg-white/10 backdrop-blur rounded-lg p-8 mb-8">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-blue-100 mb-2">Con 10 referidos</p>
                  <p className="text-4xl font-bold">$30/mes</p>
                  <p className="text-sm text-blue-100 mt-1">$360/año</p>
                </div>
                <div>
                  <p className="text-blue-100 mb-2">Con 50 referidos</p>
                  <p className="text-4xl font-bold">$150/mes</p>
                  <p className="text-sm text-blue-100 mt-1">$1,800/año</p>
                </div>
                <div>
                  <p className="text-blue-100 mb-2">Con 100 referidos</p>
                  <p className="text-4xl font-bold">$300/mes</p>
                  <p className="text-sm text-blue-100 mt-1">$3,600/año</p>
                </div>
              </div>
            </div>

            <p className="text-center text-blue-100">
              Basado en plan Pro ($9.99/mes) con 30% de comisión ($3/mes por referido)
            </p>
          </div>
        </div>
      </div>

      {/* Who Should Join */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            ¿Para quién es este programa?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Influencers Educativos
              </h3>
              <p className="text-gray-600">
                Si tienes audiencia en YouTube, TikTok, Instagram o blog sobre
                educación, este es el producto perfecto para monetizar.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Estudiantes Universitarios
              </h3>
              <p className="text-gray-600">
                Comparte con tus compañeros de clase. Gana mientras ayudas a
                otros estudiantes a mejorar sus trabajos académicos.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Profesores y Tutores
              </h3>
              <p className="text-gray-600">
                Recomienda a tus alumnos una herramienta que les ayude a
                escribir mejor, y gana comisiones recurrentes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Marketers Digitales
              </h3>
              <p className="text-gray-600">
                Producto de alta conversión con comisiones recurrentes.
                Perfecto para campañas de afiliados profesionales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Listo para Empezar a Ganar?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a cientos de afiliados que ya están generando ingresos pasivos
          </p>
          <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition">
            Registrarme Ahora
          </button>
          <p className="mt-4 text-gray-500">
            Sin costos, sin compromisos. Comienza a ganar hoy.
          </p>
        </div>
      </div>
    </div>
  );
}
