/*
  Legacy Portal - configuration client

  Pour creer un nouveau portail:
  1. Duplique le dossier legacy-portal-premium-clean.
  2. Modifie ce fichier.
  3. Garde index.html comme fichier principal GitHub Pages.
  4. Change storageKey et photoDbName seulement pour un nouveau client.
     Apres livraison, ne plus jamais les changer.
*/

window.LEGACY_PORTAL_CONFIG = {
  clientName: 'Mathieu Richard',
  clientSlug: 'mathieu-richard',
  coachName: 'Max',
  brandName: 'Father Empowering',
  programTitle: 'Legacy Protocol',
  programSubtitle: '8 semaines - reconstruction',
  appVersion: 'Mathieu V1',

  /*
    Important:
    - Chaque client doit avoir une cle unique.
    - Apres livraison client, ne plus jamais changer storageKey ou photoDbName.
  */
  storageKey: 'faem_mathieu_richard_v1',
  photoDbName: 'faem_mathieu_richard_photos_v1',

  reportEndpoint: 'https://legacy-telegram-backend.vercel.app/api/send-report',

  brand: {
    logoSrc: 'icon-512.png',
    appleTouchIcon: 'apple-touch-icon.png',
    favicon32: 'favicon-32x32.png',
    favicon16: 'favicon-16x16.png',
    manifest: 'site.webmanifest',
    themeColor: '#F4F3EF',
    colors: {
      bg: '#F4F3EF',
      card: '#FFFFFF',
      card2: '#F8F7F3',
      black: '#1C1C1C',
      black2: '#252525',
      orange: '#C85A00',
      ol: '#E8751A'
    }
  },

  copy: {
    homeProtocol: 'LEGACY PROTOCOL - RECONSTRUCTION 8 SEMAINES',
    sendCheckinSub: 'Sauvegarde, deverrouille la semaine suivante et envoie au coach',
    reportTitlePrefix: 'CHECK-IN HEBDOMADAIRE',
    reportFooter: 'Envoye depuis Legacy Protocol - Mathieu Richard',
    checkinSentAlert: 'Rapport envoye au coach!'
  },

  /*
    Laisse null pour partir avec le programme d'entrainement actuel comme modele.
    Plus tard, on pourra mettre ici un objet programWeeks complet pour remplacer
    toutes les semaines sans toucher au HTML.
  */
  programWeeks: null,

  /*
    Laisse null pour garder le fichier assets/data/nutrition.html.
    Pour un client, tu peux remplacer toute la section Nutrition avec du HTML simple
    ou modifier directement assets/data/nutrition.html.
  */
  nutritionHtml: null,

  /*
    Donnees initiales.
    Pour un vrai nouveau client, on garde vide pour ne pas precharger les seances
    du client precedent.
  */
  preloadData: {
    seances: {},
    checkins: [],
    photos: {}
  }
};
