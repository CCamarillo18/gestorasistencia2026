import { Coffee, Sparkles, Clock, ChefHat } from 'lucide-react'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-500/10 to-rose-600/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-orange-500/50 mb-6">
              <Coffee className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl sm:text-8xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-rose-700 bg-clip-text text-transparent">
                Café Mocha
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 max-w-2xl mx-auto font-light leading-relaxed">
              Una perfecta fusión de espresso intenso, chocolate aterciopelado y leche cremosa
            </p>
          </div>
        </div>
      </div>

      {/* What is Mocha Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 sm:p-16 border border-amber-200/50">
          <div className="flex items-center gap-4 mb-8">
            <Sparkles className="w-8 h-8 text-orange-500" />
            <h2 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              ¿Qué es el Mocha?
            </h2>
          </div>
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p className="text-xl leading-relaxed">
              El <strong>café mocha</strong>, también conocido como <em>mochaccino</em> o <em>caffè mocha</em>, 
              es una bebida de café que combina espresso con chocolate y leche vaporizada, coronada con 
              espuma de leche y ocasionalmente crema batida.
            </p>
            <p className="leading-relaxed">
              Su nombre proviene de la ciudad de <strong>Mocha</strong> en Yemen, un importante puerto para 
              el comercio de café en el siglo XV. Aunque hoy el mocha se asocia principalmente con la combinación 
              de café y chocolate, históricamente el término se refería a un tipo específico de grano de café 
              con notas naturalmente achocolatadas.
            </p>
          </div>
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl p-10 shadow-xl border border-amber-200/50">
            <div className="flex items-center gap-4 mb-6">
              <ChefHat className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Ingredientes
              </h2>
            </div>
            <ul className="space-y-4 text-gray-800">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-lg">Espresso</strong>
                  <p className="text-sm text-gray-600">1-2 shots de café espresso fuerte</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-lg">Chocolate</strong>
                  <p className="text-sm text-gray-600">Jarabe de chocolate o cacao en polvo</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-lg">Leche</strong>
                  <p className="text-sm text-gray-600">Leche vaporizada y espumada</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-lg">Crema batida (opcional)</strong>
                  <p className="text-sm text-gray-600">Para decorar y añadir cremosidad</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-3xl p-10 shadow-xl border border-rose-200/50">
            <div className="flex items-center gap-4 mb-6">
              <Clock className="w-8 h-8 text-rose-600" />
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Preparación
              </h2>
            </div>
            <ol className="space-y-4 text-gray-800">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <p>Prepara 1-2 shots de espresso</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <p>Añade jarabe de chocolate o cacao al espresso</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <p>Vaporiza la leche hasta obtener textura sedosa</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <p>Vierte la leche sobre la mezcla de café y chocolate</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  5
                </div>
                <p>Decora con crema batida y cacao en polvo</p>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Fun Facts */}
      <div className="max-w-6xl mx-auto px-6 py-16 pb-24">
        <div className="bg-gradient-to-r from-amber-900 to-orange-800 rounded-3xl p-10 sm:p-16 shadow-2xl text-white">
          <h2 className="text-4xl font-bold mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
            Datos Curiosos
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="text-5xl">☕</div>
              <h3 className="text-xl font-semibold">Origen del nombre</h3>
              <p className="text-amber-100 leading-relaxed">
                El puerto de Mocha en Yemen fue durante siglos el principal punto de exportación 
                de café al mundo occidental.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-5xl">🍫</div>
              <h3 className="text-xl font-semibold">Chocolate perfecto</h3>
              <p className="text-amber-100 leading-relaxed">
                El chocolate de alta calidad con al menos 60% de cacao realza mejor los sabores 
                del espresso en un mocha auténtico.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-5xl">🌍</div>
              <h3 className="text-xl font-semibold">Popularidad mundial</h3>
              <p className="text-amber-100 leading-relaxed">
                El mocha es una de las bebidas de café con leche más populares en cafeterías 
                de todo el mundo.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-5xl">✨</div>
              <h3 className="text-xl font-semibold">Variaciones infinitas</h3>
              <p className="text-amber-100 leading-relaxed">
                Existen versiones con chocolate blanco, menta, caramelo, y muchas otras 
                combinaciones creativas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
