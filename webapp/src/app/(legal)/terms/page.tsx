import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Términos de Servicio
          </h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-sm text-gray-500 mb-8">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Aceptación de los Términos
              </h2>
              <p className="text-gray-700 mb-4">
                Al acceder y utilizar HumanWriter AI, usted acepta estar legalmente vinculado 
                por estos términos de servicio. Si no está de acuerdo con alguna parte de estos 
                términos, no debe utilizar nuestros servicios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Descripción del Servicio
              </h2>
              <p className="text-gray-700 mb-4">
                HumanWriter AI es una plataforma de generación de texto académico que utiliza 
                inteligencia artificial y técnicas de humanización para crear contenido académico.
              </p>
              <p className="text-gray-700 mb-4">
                El servicio incluye:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Generación de texto académico personalizado</li>
                <li>Humanización de texto generado por IA</li>
                <li>Verificación de contenido generado por IA</li>
                <li>Detección de similitudes con corpus académico</li>
                <li>Gestión y almacenamiento de documentos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Uso Aceptable
              </h2>
              <p className="text-gray-700 mb-4">
                Usted se compromete a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Utilizar el servicio solo para fines académicos legítimos</li>
                <li>No violar las políticas académicas de su institución</li>
                <li>No utilizar el contenido generado como sustituto del trabajo propio</li>
                <li>Citar apropiadamente cuando sea requerido</li>
                <li>Cumplir con todas las leyes y regulaciones aplicables</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Responsabilidad del Usuario
              </h2>
              <p className="text-gray-700 mb-4">
                El contenido generado por HumanWriter AI debe ser utilizado como una 
                <strong> herramienta de apoyo</strong> para su trabajo académico. Usted es 
                totalmente responsable de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Verificar la exactitud del contenido generado</li>
                <li>Cumplir con las políticas de integridad académica de su institución</li>
                <li>Editar y personalizar el contenido según sea necesario</li>
                <li>Citar fuentes apropiadamente</li>
                <li>Obtener aprobación de sus profesores cuando sea requerido</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Cuenta de Usuario
              </h2>
              <p className="text-gray-700 mb-4">
                Al crear una cuenta, usted:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Debe proporcionar información precisa y actualizada</li>
                <li>Es responsable de mantener la confidencialidad de su contraseña</li>
                <li>Es responsable de todas las actividades bajo su cuenta</li>
                <li>Debe notificarnos inmediatamente de cualquier uso no autorizado</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Planes y Pagos
              </h2>
              <p className="text-gray-700 mb-4">
                Ofrecemos diferentes planes de suscripción:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Plan Gratuito:</strong> 100 generaciones por mes</li>
                <li><strong>Plan Pro:</strong> Generaciones ilimitadas con facturación mensual</li>
                <li><strong>Plan Enterprise:</strong> Acceso API y soporte dedicado</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Los pagos son procesados de forma segura. Las suscripciones se renuevan 
                automáticamente a menos que sean canceladas antes del próximo período de 
                facturación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Propiedad Intelectual
              </h2>
              <p className="text-gray-700 mb-4">
                <strong>Contenido Generado:</strong> Usted retiene todos los derechos sobre 
                el contenido que genera usando nuestra plataforma. Sin embargo, nos otorga 
                una licencia limitada para almacenar y procesar el contenido necesario para 
                proporcionar el servicio.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Plataforma:</strong> Todo el código, diseño, y tecnología de 
                HumanWriter AI es propiedad exclusiva de HumanWriter AI y está protegido por 
                leyes de propiedad intelectual.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Limitación de Responsabilidad
              </h2>
              <p className="text-gray-700 mb-4">
                HumanWriter AI se proporciona "tal cual" sin garantías de ningún tipo. 
                No garantizamos que:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>El servicio estará disponible ininterrumpidamente</li>
                <li>El contenido generado sea 100% original o libre de errores</li>
                <li>El contenido pase todos los detectores de IA</li>
                <li>El contenido cumpla con todos los requisitos académicos</li>
              </ul>
              <p className="text-gray-700 mt-4">
                No seremos responsables por cualquier consecuencia académica, legal o de 
                otro tipo derivada del uso de nuestro servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Privacidad y Datos
              </h2>
              <p className="text-gray-700 mb-4">
                Su privacidad es importante para nosotros. Consulte nuestra{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Política de Privacidad
                </a>{' '}
                para obtener información detallada sobre cómo recopilamos, utilizamos y 
                protegemos sus datos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Terminación
              </h2>
              <p className="text-gray-700 mb-4">
                Nos reservamos el derecho de suspender o terminar su cuenta si:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Viola estos términos de servicio</li>
                <li>Utiliza el servicio de manera fraudulenta o ilegal</li>
                <li>No paga las tarifas aplicables</li>
                <li>Realiza actividades que dañen nuestro servicio o reputación</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Modificaciones
              </h2>
              <p className="text-gray-700 mb-4">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Los cambios serán efectivos inmediatamente después de su publicación. El uso 
                continuado del servicio después de los cambios constituye su aceptación de 
                los nuevos términos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contacto
              </h2>
              <p className="text-gray-700 mb-4">
                Para preguntas sobre estos términos, contáctenos en:
              </p>
              <ul className="list-none text-gray-700 space-y-2">
                <li>Email: legal@humanwriter.ai</li>
                <li>Website: https://humanwriter.ai/contact</li>
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
