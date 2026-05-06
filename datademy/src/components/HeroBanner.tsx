interface HeroBannerProps {
  nombre: string
}

export default function HeroBanner({ nombre }: HeroBannerProps) {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '200px' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #5fb7bb, #0d438b)' }}
      />

      <div className="relative z-10 flex flex-row items-center justify-between px-8 pt-8 pb-16">
        <img
          src="/src/assets/LOGODIDEC.png"
          alt="Logo DIDEC"
          className="h-16 w-24 object-contain transition-all duration-300 cursor-pointer"
          style={{ filter: 'brightness(0) invert(1)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLImageElement).style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,0.6))'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLImageElement).style.filter = 'brightness(0) invert(1)'
          }}
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
          src="/src/assets/LOGOA+S.png"
          alt="Logo A+S"
          className="h-16 w-24 object-contain transition-all duration-300 cursor-pointer"
          style={{ filter: 'brightness(0) invert(1)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLImageElement).style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,0.6))'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLImageElement).style.filter = 'brightness(0) invert(1)'
          }}
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