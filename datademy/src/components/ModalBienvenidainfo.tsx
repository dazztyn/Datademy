interface ModalBienvenidaProps {
  onCerrar: () => void
}

export default function ModalBienvenida({ onCerrar }: ModalBienvenidaProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in"
      onClick={onCerrar}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 p-8 max-h-[85vh] overflow-y-auto border border-slate-100 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2">
            ¡Te damos la bienvenida a Datademy!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Antes de comenzar a analizar datos, necesitamos preparar la app en unos simples pasos.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-l-2 border-blue-500 pl-4 space-y-3">
            <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Fase 1: Configuración en Google Drive</h4>
            
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Paso 1: Plantillas</p>
              Si no tienes encuestas creadas en Google Forms, presiona el botón <strong className="text-blue-500">"Carpeta plantillas"</strong> para seleccionar la carpeta de Drive donde guardas tus plantilas base. 
              <span className="block mt-1 text-slate-400 italic">*Si ya tienes tus encuestas listas en Drive, puedes saltar directamente al Paso 3.</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Paso 2: Guardado de lo nuevo</p>
              Haz clic en el botón <strong className="text-blue-500">"Carpeta destino"</strong> y elige la carpeta de Google Drive donde quieres que la aplicación cree y almacene las nuevas encuestas.
            </div>
          </div>

          <div className="border-l-2 border-purple-500 pl-4 space-y-3">
            <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider">Fase 2: Crear el Proceso</h4>
            
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Paso 3: Iniciar un nuevo proceso</p>
              Oprime el botón <strong className="text-orange-500">"Crear proceso"</strong>. Un proceso es un contenedor que reúne la información de las encuestas. Cada proceso tiene dos espacios en blanco esperando sus encuestas: uno para <strong>Estudiantes</strong> y otro para <strong>Socios Comunitarios</strong>.
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Paso 4: Vincular o Crear encuestas</p>
              En cada espacio tendrás dos opciones:
              <ul className="list-disc list-inside mt-1 ml-1 space-y-0.5 text-slate-500 dark:text-slate-400">
                <li><strong className="text-blue-500">Crear nuevo desde plantilla:</strong> Para crear una encuesta limpia usando plantillas del Paso 1.</li>
                <li><strong className="text-purple-500">Vincular formulario existente:</strong> Si ya tienes la encuesta hecha en tu Drive.</li>
              </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Paso 5: Asignar y Enviar</p>
              Si creas una nueva encuesta, selecciona la plantilla de la lista, asígnale un nombre descriptivo y presiona <strong>"Asignar"</strong>. 
              <span className="block mt-1 font-medium text-amber-600 dark:text-amber-400">Importante: Tendrás un enlace directo para abrir tu nueva encuesta en Google Forms. Recuerda publicarla y enviársela a tus alumnos o socios para que comiencen a responder.</span>
            </div>
          </div>

          <div className="border-l-2 border-emerald-500 pl-4 space-y-3">
            <h4 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Fase 3: ¡Todo listo!</h4>
            
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Paso 6: Completar el proceso</p>
              Asegúrate de asignar tanto el formulario de Estudiantes como el de Socios. Cuando ambos estén vinculados, el estado del proceso cambiará a <strong className="text-emerald-500">"Completo"</strong> de forma automática.
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Paso 7: Visualizar y Generar Informes</p>
              ¡Eso es todo! Selecciona tu proceso completo activo en la lista y haz clic en <strong className="text-orange-500">"Ver Detalles/Generar Informe"</strong> para ingresar al panel de analíticas visuales.
            </div>
          </div>

        </div>
        <button
          onClick={onCerrar}
          className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-95 transition-opacity shadow-md"
        >
          Entendido, ¡vamos a configurar!
        </button>
      </div>
    </div>
  )
}