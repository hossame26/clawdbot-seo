import AuditForm from '@/components/AuditForm';

export default function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ClawdBot SEO
        </h1>
        <p className="text-xl text-gray-600">
          Analysez votre site web et améliorez votre référencement
        </p>
      </div>

      {/* Quick Audit Form */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Audit SEO Rapide</h2>
        <AuditForm />
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold text-gray-900 mb-2">9 Analyseurs</h3>
          <p className="text-sm text-gray-500">
            Meta, Headings, Content, Links, Images, Technical, Mobile, Schema, Security
          </p>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="font-semibold text-gray-900 mb-2">Score Détaillé</h3>
          <p className="text-sm text-gray-500">
            Scores par catégorie : Technique, Contenu, Performance, Mobile
          </p>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-4">🛠</div>
          <h3 className="font-semibold text-gray-900 mb-2">Recommandations</h3>
          <p className="text-sm text-gray-500">
            Actions prioritaires pour améliorer votre SEO
          </p>
        </div>
      </div>

      {/* Platforms */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-center">Plateformes supportées</h2>
        <div className="flex justify-center gap-8 text-gray-500">
          <div className="text-center">
            <div className="text-3xl mb-2">🛒</div>
            <span className="text-sm">Shopify</span>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📝</div>
            <span className="text-sm">WordPress</span>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⚛️</div>
            <span className="text-sm">React/Next.js</span>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🌐</div>
            <span className="text-sm">Custom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
