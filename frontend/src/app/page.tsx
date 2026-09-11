import Link from "next/link";
import { TopoLines } from "@/components/topo-lines";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone">
        <TopoLines className="absolute inset-0 h-full w-full text-laterite" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="max-w-xl text-sm text-ink-soft">Une plateforme née à Fianarantsoa</p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight text-balance md:text-6xl">
            Comprendre une ville. Décider plus intelligemment.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            MadaFlow transforme les données géographiques en informations exploitables pour les
            citoyens, les entreprises et les collectivités.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="border border-ink bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:border-laterite hover:bg-laterite"
            >
              Signaler un problème
            </Link>
            <Link
              href="/map"
              className="border border-ink px-6 py-3 text-sm font-medium transition-colors hover:border-laterite hover:text-laterite"
            >
              Explorer la carte
            </Link>
          </div>
        </div>
      </section>

      {/* Problème */}
      <section className="border-b border-stone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <h2 className="text-2xl font-semibold tracking-tight">Le problème</h2>
            <div className="max-w-2xl space-y-4 text-ink-soft">
              <p>
                Un nid-de-poule, une fuite d&apos;eau, un lampadaire hors service : ces problèmes
                existent dans chaque quartier, mais l&apos;information reste dispersée entre les
                habitants qui les vivent et les services qui pourraient les régler.
              </p>
              <p>
                Les collectivités disposent de peu d&apos;outils pour prioriser leurs interventions,
                les entreprises manquent de données locales fiables pour évaluer une zone, et les
                citoyens n&apos;ont souvent aucun moyen simple de signaler ce qu&apos;ils constatent
                au quotidien.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="border-b border-stone bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <h2 className="text-2xl font-semibold tracking-tight">La solution</h2>
            <div className="max-w-2xl space-y-4 text-ink-soft">
              <p>
                MadaFlow réunit sur une même carte les signalements des citoyens, les données
                géographiques d&apos;un territoire et un moteur qui analyse et priorise ces
                informations — pour que chaque problème remonte à la bonne personne, avec le bon
                niveau d&apos;urgence.
              </p>
              <p>
                La plateforme reste utilisable sans expertise technique : signaler un problème prend
                moins d&apos;une minute, et l&apos;information qui en ressort est directement
                exploitable par une collectivité ou une entreprise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section className="border-b border-stone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Comment ça marche</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {[
              {
                n: "1",
                title: "Un citoyen signale",
                body: "Catégorie, description, photo et localisation — en moins d'une minute, depuis un téléphone.",
              },
              {
                n: "2",
                title: "L'IA analyse",
                body: "Le signalement est classé et comparé aux signalements proches pour repérer les doublons d'un même événement.",
              },
              {
                n: "3",
                title: "Un score de priorité se calcule",
                body: "Gravité, confirmations d'autres citoyens, ancienneté et récurrence dans le quartier — chaque facteur est visible, jamais une boîte noire.",
              },
              {
                n: "4",
                title: "La collectivité agit",
                body: "Un tableau de bord classe les zones par urgence réelle, pas par ordre d'arrivée.",
              },
            ].map((step) => (
              <li key={step.n} className="border-l-2 border-laterite pl-4">
                <span className="text-sm text-ink-soft">{step.n}</span>
                <h3 className="mt-1 font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="border-b border-stone bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Fonctionnalités</h2>
          <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-3">
            {[
              {
                title: "Carte interactive",
                body: "Signalements géolocalisés, filtrables par catégorie, statut et niveau de priorité.",
              },
              {
                title: "Signalement citoyen",
                body: "Catégorie, photo, gravité déclarée — confirmable par d'autres habitants du quartier.",
              },
              {
                title: "Détection de doublons",
                body: "Deux signalements décrivant le même événement sont automatiquement rapprochés, pas dupliqués.",
              },
              {
                title: "Score de priorité explicable",
                body: "Chaque score affiche le détail des facteurs qui y ont contribué et leur poids respectif.",
              },
              {
                title: "Tableau de bord par quartier",
                body: "Vue d'ensemble, évolution dans le temps et repérage des zones à forte concentration de problèmes actifs.",
              },
              {
                title: "API ouverte",
                body: "Toutes les données exposées par la plateforme sont accessibles via une API REST versionnée.",
              },
            ].map((feature) => (
              <div key={feature.title}>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cas d'utilisation */}
      <section className="border-b border-stone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Cas d&apos;utilisation</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            <div>
              <h3 className="font-medium">Un habitant</h3>
              <p className="mt-2 text-sm text-ink-soft">
                Signale un lampadaire cassé sur son trajet quotidien et suit son traitement sans
                avoir à relancer qui que ce soit.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Une collectivité</h3>
              <p className="mt-2 text-sm text-ink-soft">
                Repère qu&apos;un même quartier accumule des signalements de voirie depuis plusieurs
                semaines et programme une intervention groupée.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Une entreprise</h3>
              <p className="mt-2 text-sm text-ink-soft">
                Pourra bientôt analyser l&apos;activité d&apos;une zone avant d&apos;y ouvrir un
                commerce — fonctionnalité en préparation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ce que mesure la plateforme (plutôt que des statistiques fabriquées) */}
      <section className="border-b border-stone bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <h2 className="text-2xl font-semibold tracking-tight">Ce que la plateforme mesure</h2>
            <div className="max-w-2xl space-y-4 text-ink-soft">
              <p>
                MadaFlow ne remplace pas le jugement humain par des statistiques inventées. Chaque
                chiffre affiché — signalements actifs, temps moyen de résolution, quartiers les plus
                concernés — provient de données réellement soumises et est signalé comme
                indisponible plutôt qu&apos;estimé lorsqu&apos;il n&apos;y a pas encore assez de
                signalements pour être significatif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section className="border-b border-stone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <h2 className="text-2xl font-semibold tracking-tight">Sécurité</h2>
            <div className="max-w-2xl space-y-4 text-ink-soft">
              <p>
                Les échanges avec l&apos;API sont chiffrés et authentifiés par jeton, avec des
                permissions strictes par rôle : un citoyen ne peut modifier que ses propres
                signalements, et seule une collectivité peut changer leur statut.
              </p>
              <p>
                La localisation précise d&apos;un utilisateur n&apos;est jamais exposée publiquement
                — seule une adresse approximative associée à un signalement l&apos;est.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API */}
      <section className="border-b border-stone bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:items-start">
            <h2 className="text-2xl font-semibold tracking-tight">Une API ouverte</h2>
            <div className="max-w-2xl space-y-4 text-ink-soft">
              <p>
                Toutes les données consultables sur MadaFlow — signalements, catégories,
                statistiques par quartier — sont accessibles via une API REST versionnée, documentée
                et prête à être intégrée à vos propres outils.
              </p>
              <a
                href="/api/docs/"
                className="inline-block border border-ink px-5 py-2.5 text-sm font-medium transition-colors hover:border-laterite hover:text-laterite"
              >
                Consulter la documentation API
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="border-b border-stone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Tarifs</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink-soft">
            La carte et le signalement citoyen resteront toujours gratuits. Les formules Business,
            Enterprise et Government, pensées pour l&apos;analyse de zone et l&apos;usage API à
            grande échelle, sont en cours de mise en place.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Gratuit",
                body: "Carte, signalement et suivi personnel, sans limite, pour tout citoyen.",
                available: true,
              },
              {
                name: "Business",
                body: "Analyse de zone, export de données et alertes personnalisées pour les entreprises.",
                available: false,
              },
              {
                name: "Government",
                body: "Tableau de bord complet, gestion des interventions et API dédiée pour les collectivités.",
                available: false,
              },
            ].map((plan) => (
              <div key={plan.name} className="border border-stone p-6">
                <h3 className="font-medium">{plan.name}</h3>
                <p className="mt-2 text-sm text-ink-soft">{plan.body}</p>
                {!plan.available && (
                  <p className="mt-4 text-xs text-ink-soft">Bientôt disponible</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appel à l'action */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Un problème à signaler dans votre quartier ?
          </h2>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-block border border-ink bg-ink px-8 py-3 text-sm font-medium text-paper transition-colors hover:border-laterite hover:bg-laterite"
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
