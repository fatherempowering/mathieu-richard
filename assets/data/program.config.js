// Programme Mathieu Richard - Legacy Protocol Reconstruction
function _e(name, note, sets, reps, key, target, unit, inputType) {
  return { name, note, sets, reps, key: key || null, target: target || null, unit: unit || 'lbs', inputType: inputType || 'number' };
}

const WU = {
  lower: 'Marche inclinee legere 5-10 min · Respiration diaphragmatique 2 min · Mobilite hanches et thoracique · Monter graduellement sans douleur',
  recovery: 'Marche legere 5 min · Respiration lente · Mobilite douce epaules/thoracique · Objectif: calmer le systeme nerveux',
  bike: 'Velo leger 5-10 min · Respiration controlee · Activation hanches/fessiers · 1-2 series legeres du premier exercice'
};

const MSG = {
  1: "Le but n'est pas d'aller vite. Le but est de recommencer a avancer sans peur.",
  2: "La constance reconstruira ton corps bien avant l'intensite.",
  3: "Tu ne reconstruis pas seulement ton epaule. Tu reconstruis tes capacites.",
  4: "Chaque seance completee est une preuve que ton corps peut encore progresser.",
  5: "Le momentum commence a revenir. Continue de batir sans bruler les etapes.",
  6: "Le corps retrouve tranquillement sa capacite de travail. Reste patient et precis.",
  7: "Tu es plus solide aujourd'hui qu'il y a 8 semaines. Continue de construire.",
  8: "La progression durable vient du controle, pas de l'urgence."
};

function lowerA(setsBelt, repsBelt, beltTarget, splitSets, rdlSets, sledSets, sledNote) {
  return {
    day: 'LUNDI · FORCE BAS DU CORPS',
    title: 'SEANCE A',
    warmup: WU.lower,
    blocs: [
      { label: 'BLOC 1 — FORCE CONTROLEE', exs: [
        _e('Belt Squat', 'Tempo controle · aucune douleur · respirer entre les reps', setsBelt, repsBelt, 'a_belt_squat', beltTarget, 'lbs'),
        _e('Split Squat', 'Controle et stabilite · amplitude tolerable · pas de compensation', splitSets, 10, 'a_split_squat', 'A determiner', 'lbs')
      ]},
      { label: 'BLOC 2 — CHAINE POSTERIEURE', exs: [
        _e('Romanian Deadlift avec straps', 'Tension legere/moderee · straps permis · epaule relachee', rdlSets, 10, 'a_rdl_straps', 'A determiner', 'lbs'),
        _e('Bird Dog', 'Lent · bassin stable · respiration calme', 2, '8 / côté', 'a_bird_dog', 'Reps reelles', 'reps')
      ]}
    ],
    finisher: { label: 'FINISHER CAPACITE', exs: [
      _e('Sled Push', sledNote, sledSets, '20m', 'a_sled_push', 'Poids a noter', 'lbs')
    ]}
  };
}

function recoveryB(breathingRounds, physioNote, includeOptionalDay) {
  const blocs = [
    { label: 'BLOC 1 — PHYSIO', exs: [
      _e('Routine Physio Complete', physioNote, 1, 'Routine', 'b_physio_complete', 'A completer', '', 'checkbox')
    ]},
    { label: 'BLOC 2 — SYSTEME NERVEUX', exs: [
      _e('Marche', 'Rythme stable · respiration nasale si possible', 1, 30, 'b_marche_min', '30 min', 'min'),
      _e('Respiration Wim Hof', 'Effectuer le nombre de rounds indique · assis ou couche · jamais debout, en voiture ou dans l eau · arreter si etourdissement', '—', breathingRounds + ' rounds', 'b_respiration_rounds', breathingRounds + ' rounds a completer', 'rounds', 'rounds')
    ]}
  ];
  const finisher = includeOptionalDay
    ? { label: 'JOUR 5 OPTIONNEL — RECUPERATION', exs: [
        _e('Marche facile', 'Optionnel · seulement si energie correcte · ne pas transformer en workout', 1, '20-30', null, 'Facile', 'min'),
        _e('Mobilite douce', 'Hanches, thoracique, respiration · objectif recuperation', 1, '8-10', null, 'Facile', 'min')
      ]}
    : { label: 'FINISHER', exs: [] };
  return {
    day: includeOptionalDay ? 'MERCREDI · RECOVERY + JOUR 5 OPTIONNEL' : 'MERCREDI · RECOVERY',
    title: 'SEANCE B',
    warmup: WU.recovery,
    blocs,
    finisher
  };
}

function lowerPullC(legSets, legReps, hipSets, rowSets, carrySets, extras) {
  const blocs = [
    { label: 'BLOC 1 — BAS DU CORPS', exs: [
      _e('Leg Press', 'Controle complet · amplitude tolerable · aucune compensation hanche/dos', legSets, legReps, 'c_leg_press', 'A determiner', 'lbs'),
      _e('Hip Thrust', 'Controle et stabilite bassin · pause courte en haut', hipSets, 10, 'c_hip_thrust', 'A determiner', 'lbs')
    ]},
    { label: 'BLOC 2 — TIRAGE TOLERE', exs: [
      _e('Chest Supported Row', 'Aucune douleur epaule · leger/modere · omoplates controlees', rowSets, 12, 'c_chest_supported_row', 'Leger', 'lbs'),
      _e('Face Pull', 'Tres leger · controle scapulaire · arreter si irritation', 2, 15, 'c_face_pull', 'Tres leger', 'lbs')
    ]}
  ];
  if(extras) blocs.push(extras);
  return {
    day: 'VENDREDI · LOWER + PULL TOLERE',
    title: 'SEANCE C',
    warmup: WU.bike,
    blocs,
    finisher: { label: 'FINISHER POSTURE', exs: [
      _e('Farmer Carry', 'Charge legere/moderee · posture haute · aucune irritation epaule', carrySets, '10m', 'c_farmer_carry', 'Poids a noter', 'lbs')
    ]}
  };
}

window.LEGACY_WEEKS = {
  1: {
    label: 'SEMAINE 1',
    phase: 'PHASE 1 — REINTRODUCTION',
    protocol: 'LEGACY PROTOCOL — MATHIEU — SEMAINE 1',
    seancesKey: 's1',
    desc: 'Reintroduire structure et mouvement',
    msg: MSG[1],
    seances: {
      a: lowerA(3, 10, 'RPE 5-6', 2, 3, 5, 'Effort modere · respiration controlee · finir frais'),
      b: recoveryB(2, 'Controle complet du mouvement · rester sous le seuil d irritation', false),
      c: lowerPullC(3, 12, 3, 2, 3)
    }
  },
  2: {
    label: 'SEMAINE 2',
    phase: 'PHASE 1 — REINTRODUCTION',
    protocol: 'LEGACY PROTOCOL — MATHIEU — SEMAINE 2',
    seancesKey: 's2',
    desc: 'Constance, tolerance, aucune irritation inutile',
    msg: MSG[2],
    seances: {
      a: lowerA(3, 10, 'Meme charge si tolerance bonne', 2, 3, 5, 'Meme intensite · plus fluide que S1'),
      b: recoveryB(2, 'Controle complet · noter reaction 24h apres', false),
      c: lowerPullC(3, 12, 3, 2, 3)
    }
  },
  3: {
    label: 'SEMAINE 3',
    phase: 'PHASE 2 — STABILITE ET CONFIANCE',
    protocol: 'LEGACY PROTOCOL — MATHIEU — SEMAINE 3',
    seancesKey: 's3',
    desc: 'Augmenter legerement volume et stabilite',
    msg: MSG[3],
    seances: {
      a: lowerA(3, 10, '+5-10 lbs si tolerance parfaite', 3, 3, 6, 'Effort modere · ne pas chasser la fatigue'),
      b: recoveryB(3, 'Qualite avant quantite · epaule calme', false),
      c: lowerPullC(3, 12, 3, 3, 3, { label: 'BLOC 3 — STABILITE', exs: [
        _e('Reverse Sled Drag', 'Leger · genoux et hanches stables · respiration controlee', 4, 20, 'c_reverse_sled_drag', 'A determiner', 'metres')
      ]})
    }
  },
  4: {
    label: 'SEMAINE 4',
    phase: 'PHASE 2 — STABILITE ET CONFIANCE',
    protocol: 'LEGACY PROTOCOL — MATHIEU — SEMAINE 4',
    seancesKey: 's4',
    desc: 'Plus de capacite sans bruler les etapes',
    msg: MSG[4],
    seances: {
      a: lowerA(4, 10, 'RPE 6', 3, 3, 6, 'Modere · arreter avant fatigue nerveuse'),
      b: recoveryB(3, 'Routine propre · aucun flare-up recherche', true),
      c: lowerPullC(4, 10, 3, 3, 3, { label: 'BLOC 3 — CONTROLE', exs: [
        _e('Reverse Sled Drag', 'Leger/modere · controle continu', 4, 20, 'c_reverse_sled_drag', 'A determiner', 'metres')
      ]})
    }
  },
  5: {
    label: 'SEMAINE 5',
    phase: 'PHASE 3 — RECONDITIONNEMENT',
    protocol: 'LEGACY PROTOCOL — MATHIEU — SEMAINE 5',
    seancesKey: 's5',
    desc: 'Reaugmenter capacite physique globale',
    msg: MSG[5],
    seances: {
      a: lowerA(4, 8, 'Plus lourd, RPE 6-7 max', 3, 4, 6, 'Effort modere+ · garder respiration controlee'),
      b: recoveryB(4, 'Physio complete · maintenir calme epaule', true),
      c: lowerPullC(4, 10, 4, 3, 4, { label: 'BLOC 3 — CAPACITE', exs: [
        _e('Reverse Sled Drag', 'Modere · construire tolerance sans impact', 5, 20, 'c_reverse_sled_drag', 'A determiner', 'metres')
      ]})
    }
  },
  6: {
    label: 'SEMAINE 6',
    phase: 'PHASE 3 — RECONDITIONNEMENT',
    protocol: 'LEGACY PROTOCOL — MATHIEU — SEMAINE 6',
    seancesKey: 's6',
    desc: 'Consolider capacite de travail',
    msg: MSG[6],
    seances: {
      a: lowerA(4, 8, 'Maintenir si fatigue elevee', 3, 4, 6, 'Qualite stable · pas de grind'),
      b: recoveryB(4, 'Routine propre · noter sommeil/stress', true),
      c: lowerPullC(4, 10, 4, 3, 4, { label: 'BLOC 3 — ENDURANCE LEGERE', exs: [
        _e('Reverse Sled Drag', 'Controle · effort soutenable', 5, 20, 'c_reverse_sled_drag', 'A determiner', 'metres'),
        _e('Bird Dog', 'Stabilite tronc · lent', 2, '10 / côté', 'c_bird_dog', 'Reps reelles', 'reps')
      ]})
    }
  },
  7: {
    label: 'SEMAINE 7',
    phase: 'PHASE 4 — PREPARATION AU RETOUR COMPLET',
    protocol: 'LEGACY PROTOCOL — MATHIEU — SEMAINE 7',
    seancesKey: 's7',
    desc: 'Resilience, confiance, capacite generale',
    msg: MSG[7],
    seances: {
      a: lowerA(5, 8, 'RPE 6-7, technique parfaite', 3, 4, 7, 'Modere · posture solide · terminer capable'),
      b: recoveryB(4, 'Physio + marche · jour 5 optionnel seulement si frais', true),
      c: lowerPullC(4, 8, 4, 3, 4, { label: 'BLOC 3 — CAPACITE GENERALE', exs: [
        _e('Reverse Sled Drag', 'Modere · stable · aucun flare-up', 5, 20, 'c_reverse_sled_drag', 'A determiner', 'metres')
      ]})
    }
  },
  8: {
    label: 'SEMAINE 8',
    phase: 'PHASE 4 — PREPARATION AU RETOUR COMPLET',
    protocol: 'LEGACY PROTOCOL — MATHIEU — SEMAINE 8',
    seancesKey: 's8',
    desc: 'Stabilisation avant prochaine phase',
    msg: MSG[8],
    seances: {
      a: lowerA(4, 8, 'Stabilisation, RPE 6', 3, 3, 5, 'Finir frais · pas de test max'),
      b: recoveryB(5, 'Routine propre · bilan de tolerance', true),
      c: lowerPullC(3, 10, 3, 3, 3, { label: 'BLOC 3 — CONTROLE FINAL', exs: [
        _e('Reverse Sled Drag', 'Facile/modere · qualite avant volume', 4, 20, 'c_reverse_sled_drag', 'A determiner', 'metres')
      ]})
    }
  }
};
