import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Política de Privacidad
          </h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-sm text-gray-500 mb-8">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Información que Recopilamos
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Información de Cuenta
              </h3>
              <p className="text-gray-700 mb-4">
                Cuando crea una cuenta, recopilamos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Contraseña (hasheada y encriptada)</li>
                <li>Institución educativa (opcional)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Información de Uso
              </h3>
              <p className="text-gray-700 mb-4">
                Recopilamos automáticamente:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Páginas visitadas y tiempo de permanencia</li>
                <li>Fecha y hora de acceso</li>
                <li>Referrer URL</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Contenido Generado
              </h3>
              <p className="text-gray-700 mb-4">
                Almacenamos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Prompts y textos que genera</li>
                <li>Documentos que sube para procesar</li>
                <li>Métricas de calidad y humanización</li>
                <li>Reportes de verificación y similitud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Cómo Utilizamos su Información
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizamos su información para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Personalizar su experiencia de usuario</li>
                <li>Procesar pagos y gestionar suscripciones</li>
                <li>Enviar notificaciones importantes sobre el servicio</li>
                <li>Mejorar nuestros modelos de IA (de forma anonimizada)</li>
                <li>Prevenir fraude y abuso</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Compartir Información
              </h2>
              <p className="text-gray-700 mb-4">
                <strong>NO vendemos ni alquilamos sus datos personales.</strong>
              </p>
              <p className="text-gray-700 mb-4">
                Podemos compartir información con:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Proveedores de Servicios:</strong> Procesadores de pago, hosting, 
                  análisis (todos bajo acuerdos de confidencialidad)
                </li>
                <li>
                  <strong>Cumplimiento Legal:</strong> Si es requerido por ley o para proteger 
                  nuestros derechos
                </li>
                <li>
                  <strong>Con su Consentimiento:</strong> En cualquier otro caso, solo con su 
                  aprobación explícita
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Seguridad de Datos
              </h2>
              <p className="text-gray-700 mb-4">
                Implementamos medidas de seguridad técnicas y organizativas:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Encriptación SSL/TLS para transmisión de datos</li>
                <li>Contraseñas hasheadas con bcrypt</li>
                <li>Acceso restringido a datos personales</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Backups regulares y encriptados</li>
                <li>Auditorías de seguridad periódicas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Retención de Datos
              </h2>
              <p className="text-gray-700 mb-4">
                Retenemos sus datos mientras:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Su cuenta esté activa</li>
                <li>Sea necesario para proporcionar servicios</li>
                <li>Sea requerido por ley</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Al eliminar su cuenta, sus datos personales se eliminan dentro de 30 días, 
                excepto donde sea requerido por ley retenerlos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Sus Derechos
              </h2>
              <p className="text-gray-700 mb-4">
                Usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Acceder:</strong> Solicitar una copia de sus datos</li>
                <li><strong>Rectificar:</strong> Corregir datos inexactos</li>
                <li><strong>Eliminar:</strong> Solicitar eliminación de sus datos</li>
                <li><strong>Restringir:</strong> Limitar el procesamiento de sus datos</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en formato portable</li>
                <li><strong>Oposición:</strong> Oponerse a ciertos usos de sus datos</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Para ejercer estos derechos, contáctenos en: privacy@humanwriter.ai
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Cookies y Tecnologías Similares
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Mantener su sesión activa</li>
                <li>Recordar sus preferencias</li>
                <li>Analizar el uso del sitio</li>
                <li>Mejorar la seguridad</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Puede configurar su navegador para rechazar cookies, pero esto puede afectar 
                la funcionalidad del servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Transferencias Internacionales
              </h2>
              <p className="text-gray-700 mb-4">
                Sus datos pueden ser procesados en servidores ubicados fuera de su país. 
                Aseguramos protecciones adecuadas mediante:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Acuerdos de procesamiento de datos</li>
                <li>Cláusulas contractuales estándar</li>
                <li>Cumplimiento con regulaciones de privacidad internacionales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Privacidad de Menores
              </h2>
              <p className="text-gray-700 mb-4">
                Nuestro servicio está diseñado para estudiantes universitarios y no está 
                dirigido a menores de 13 años. No recopilamos intencionalmente información 
                de menores sin el consentimiento parental.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Cambios a esta Política
              </h2>
              <p className="text-gray-700 mb-4">
                Podemos actualizar esta política ocasionalmente. Le notificaremos de cambios 
                significativos por email o mediante aviso en el sitio. El uso continuado del 
                servicio después de los cambios constituye su aceptación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Contacto
              </h2>
              <p className="text-gray-700 mb-4">
                Para preguntas sobre esta política o para ejercer sus derechos:
              </p>
              <ul className="list-none text-gray-700 space-y-2">
                <li>Email: privacy@humanwriter.ai</li>
                <li>Formulario: https://humanwriter.ai/contact</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              © 2024 HumanWriter AI. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
