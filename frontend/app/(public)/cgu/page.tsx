import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "CGU de RentaWay Maroc — plateforme de location de véhicules.",
};

export default function CguPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-secondary-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold">Conditions Générales d'Utilisation</h1>
          <p className="mt-2 text-sm text-gray-300">Dernière mise à jour : {new Date().toLocaleDateString("fr-MA")}</p>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-sm prose-gray">
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 space-y-6 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-secondary-700">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation
              de la plateforme RentaWay Maroc (le « Service »), éditée par RentaWay SARL, immatriculée au
              Registre du Commerce de Casablanca. Le Service met en relation des particuliers (« Clients »)
              et des agences de location professionnelles (« Loueurs ») pour la location de véhicules
              (voitures, motos, bateaux, jet-skis) sur le territoire marocain.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">2. Inscription</h2>
            <p>
              L'inscription est gratuite. L'utilisateur s'engage à fournir des informations exactes,
              à maintenir leur exactitude et à ne pas créer plusieurs comptes. Les Loueurs doivent
              fournir un Registre de Commerce valide et une attestation d'assurance en cours de validité.
              RentaWay se réserve le droit de refuser ou suspendre toute inscription non conforme.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">3. Réservations</h2>
            <p>
              Le Client peut réserver un véhicule via la plateforme. La réservation est confirmée après
              paiement en ligne sécurisé. Le Client doit présenter au Loueur, lors de la prise du véhicule,
              une pièce d'identité (CIN ou passeport) ainsi qu'un permis de conduire en cours de validité
              correspondant à la catégorie du véhicule. La caution est bloquée le jour de la prise et
              libérée sous 5 jours ouvrés après restitution sans dommage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">4. Paiements & commission</h2>
            <p>
              Les paiements sont effectués via Stripe et sont sécurisés (norme PCI-DSS). RentaWay perçoit
              une commission de service de 15 % sur le montant de chaque location, prélevée automatiquement
              au moment du transfert au Loueur. Les prix affichés incluent toutes taxes applicables (TVA Maroc).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">5. Annulation</h2>
            <p>
              <strong>Par le Client :</strong> annulation gratuite jusqu'à 24 h avant le début de la location.
              Au-delà, 50 % du montant est retenu. En cas de non-présentation, 100 % est retenu.
              <br />
              <strong>Par le Loueur :</strong> si le Loueur annule, le Client est remboursé intégralement
              et reçoit un bon de réduction de 10 % sur sa prochaine réservation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">6. Responsabilités</h2>
            <p>
              RentaWay agit uniquement en tant qu'intermédiaire technique. Le Loueur est seul responsable
              de l'état du véhicule, de son assurance et du respect de la législation marocaine
              (Code de la route, assurance obligatoire, vignette, contrôle technique). Le Client est
              responsable du véhicule pendant toute la durée de location et doit respecter les conditions
              de restitution (état, niveau de carburant, kilométrage si non-illimité).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">7. Litiges</h2>
            <p>
              En cas de litige entre Client et Loueur, RentaWay propose une médiation gratuite via son
              service client (contact@rentaway.ma). À défaut d'accord amiable dans un délai de 30 jours,
              les parties pourront saisir le tribunal compétent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">8. Comportement prohibé</h2>
            <p>
              Sont interdits : la création de comptes frauduleux, l'utilisation du véhicule en dehors du
              Maroc sans accord écrit du Loueur, le sous-louage du véhicule, la conduite sous l'emprise
              d'alcool ou de stupéfiants, et toute publication de contenus illégaux ou diffamatoires
              dans les avis et messages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">9. Données personnelles</h2>
            <p>
              Le traitement des données personnelles est régi par notre{" "}
              <a href="/confidentialite" className="text-primary-600 underline">Politique de Confidentialité</a>,
              conforme à la loi 09-08 marocaine relative à la protection des personnes physiques à l'égard
              du traitement des données à caractère personnel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">10. Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit marocain. Tout litige relatif à leur interprétation
              ou exécution sera soumis aux tribunaux de Casablanca, sauf disposition légale impérative
              contraire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">11. Modifications</h2>
            <p>
              RentaWay se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
              sont informés par email 30 jours avant l'entrée en vigueur de toute modification substantielle.
              L'usage continu du Service vaut acceptation des CGU modifiées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">Contact</h2>
            <p>
              Pour toute question relative aux CGU : <a href="mailto:contact@rentaway.ma" className="text-primary-600 underline">contact@rentaway.ma</a>
            </p>
          </section>

        </div>
      </article>
    </div>
  );
}
