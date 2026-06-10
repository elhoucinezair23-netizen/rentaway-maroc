import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  description: "Politique de confidentialité de RentaWay Maroc — conforme à la loi 09-08 et à la CNDP.",
};

export default function ConfidentialitePage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-secondary-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold">Politique de Confidentialité</h1>
          <p className="mt-2 text-sm text-gray-300">Conforme à la loi 09-08 et à la CNDP — {new Date().toLocaleDateString("fr-MA")}</p>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-secondary-700">1. Identité du responsable de traitement</h2>
            <p>
              RentaWay SARL, immatriculée au Registre du Commerce de Casablanca, est le responsable
              du traitement des données personnelles collectées via la plateforme rentaway.ma. La
              déclaration auprès de la CNDP (Commission Nationale de contrôle de la protection
              des Données à caractère Personnel) a été effectuée conformément à la loi 09-08.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">2. Données collectées</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Identification :</strong> nom, prénom, email, téléphone, date de naissance</li>
              <li><strong>Documents officiels :</strong> photocopie CIN et permis de conduire</li>
              <li><strong>Paiement :</strong> traités exclusivement par Stripe (norme PCI-DSS) — aucun numéro de carte n'est stocké sur nos serveurs</li>
              <li><strong>Réservations :</strong> historique des locations, avis, messages</li>
              <li><strong>Techniques :</strong> adresse IP, navigateur, pages visitées (cookies)</li>
              <li><strong>Géolocalisation :</strong> uniquement si vous l'autorisez explicitement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">3. Finalités du traitement</h2>
            <p>Les données sont utilisées pour :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Créer et gérer votre compte</li>
              <li>Traiter vos réservations et paiements</li>
              <li>Vérifier votre identité et votre permis (obligation légale)</li>
              <li>Vous envoyer des emails transactionnels et notifications</li>
              <li>Améliorer le service (statistiques anonymisées)</li>
              <li>Prévenir la fraude et garantir la sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">4. Base légale</h2>
            <p>
              Le traitement repose sur (i) l'exécution du contrat de service entre vous et RentaWay,
              (ii) le respect des obligations légales (vérification d'identité, lutte anti-blanchiment),
              et (iii) votre consentement explicite pour les communications marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">5. Destinataires des données</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Loueurs :</strong> reçoivent votre nom, téléphone et copies CIN/permis pour la durée de la location</li>
              <li><strong>Stripe :</strong> pour le traitement sécurisé des paiements</li>
              <li><strong>Hébergeurs :</strong> serveurs situés en Europe (OVH/Hostinger) avec garanties RGPD</li>
              <li><strong>Autorités :</strong> uniquement sur réquisition judiciaire conformément à la loi</li>
            </ul>
            <p className="mt-2">
              <strong>Nous ne vendons jamais vos données à des tiers commerciaux.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">6. Durée de conservation</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Compte utilisateur : durée de vie du compte + 3 ans après suppression</li>
              <li>Données de réservation : 10 ans (obligation comptable)</li>
              <li>Documents d'identité : supprimés 6 mois après la dernière location</li>
              <li>Logs techniques : 12 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">7. Vos droits</h2>
            <p>Conformément à la loi 09-08, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
              <li><strong>Droit d'opposition :</strong> refuser le traitement à des fins marketing</li>
              <li><strong>Droit à l'effacement :</strong> supprimer votre compte et vos données (sauf obligations légales)</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, écrivez à <a href="mailto:dpo@rentaway.ma" className="text-primary-600 underline">dpo@rentaway.ma</a>{" "}
              en joignant une copie de votre CIN. Réponse sous 30 jours maximum.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">8. Cookies</h2>
            <p>
              Le site utilise uniquement les cookies strictement nécessaires (session, panier, préférences).
              Aucun cookie publicitaire tiers n'est déposé sans votre consentement explicite. Vous pouvez
              désactiver les cookies dans les paramètres de votre navigateur, mais cela peut affecter
              le bon fonctionnement du site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">9. Sécurité</h2>
            <p>
              Toutes les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Les mots
              de passe sont hashés avec bcrypt (12 rounds). Les sauvegardes quotidiennes de la base
              sont chiffrées et conservées 30 jours. Toute violation est notifiée à la CNDP dans les
              72 h et aux utilisateurs concernés sans délai.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-secondary-700">10. Contact DPO</h2>
            <p>
              Délégué à la Protection des Données : <a href="mailto:dpo@rentaway.ma" className="text-primary-600 underline">dpo@rentaway.ma</a>
              <br />
              En cas de réclamation non résolue, vous pouvez saisir la CNDP : <a href="https://www.cndp.ma" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">cndp.ma</a>
            </p>
          </section>

        </div>
      </article>
    </div>
  );
}
