// 1. IMPORTANTE: Importamos las imágenes para que Vite no rompa las rutas en producción
import logoDidec from '../assets/LOGODIDEC.png'
import logoAs from '../assets/LOGOA+S.png'

interface HeroBannerProps {
  nombre: string
}

export default function HeroBanner({ nombre }: HeroBannerProps) {
  return (
    <div className="relative w-full overflow-hidden min-h-[200px]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#5fb7bb] to-[#0d438b]" />

      <div className="relative z-10 flex flex-row items-center justify-between px-8 pt-8 pb-16">
        <img
          src={logoDidec}
          alt="Logo DIDEC"
          className="h-16 w-24 object-contain transition-all duration-300 cursor-pointer brightness-0 invert hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
        />

        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-semibold text-white">
            Bienvenid@ <span className="text-white/70">{nombre}</span>
          </h1>
          <p className="text-white/60 text-sm">
            Por favor seleccione un formulario para proceder
          </p>
        </div>

        <img
          src={logoAs}
          alt="Logo A+S"
          className="h-16 w-24 object-contain transition-all duration-300 cursor-pointer brightness-0 invert hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
        />
      </div>
      <svg
        className="absolute -bottom-px left-0 w-full transition-all duration-300"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,90 C360,10 1080,10 1440,90 L1440,90 L0,90 Z"
          className="fill-slate-50 dark:fill-slate-900 transition-all duration-300"
        />
      </svg>
    </div>
  )
}