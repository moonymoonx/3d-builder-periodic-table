// Where the "why it matters" lines of Patterns and Side by side come from. Each hook names its sources
// (REDESIGN-PLAN §4, DESIGN-STUDY §3); every claim was checked against the page cited (NOTES-patterns.md,
// PLAN-CRITIQUE.md §1). Numbers on screen come from our data and open their own source when tapped;
// these are the sources of the sentences around them. `data` points at a source of elements.json.
export const REFS = {
  'periodic-trends': { name: 'Wikipedia: Periodic trends', url: 'https://en.wikipedia.org/wiki/Periodic_trends' },
  'atomic-radius': { name: 'Wikipedia: Atomic radius', url: 'https://en.wikipedia.org/wiki/Atomic_radius' },
  'ionization-energy': { name: 'Wikipedia: Ionization energy', url: 'https://en.wikipedia.org/wiki/Ionization_energy' },
  'nchem-2161': { name: 'Mason et al. (2015), Nature Chemistry 7: the Coulomb explosion of alkali metals in water', url: 'https://www.nature.com/articles/nchem.2161' },
  electronegativity: { name: 'Wikipedia: Electronegativity', url: 'https://en.wikipedia.org/wiki/Electronegativity' },
  'properties-of-water': { name: 'Wikipedia: Properties of water', url: 'https://en.wikipedia.org/wiki/Properties_of_water' },
  'electron-affinity': { name: 'Wikipedia: Electron affinity', url: 'https://en.wikipedia.org/wiki/Electron_affinity' },
  'effective-nuclear-charge': { name: 'Wikipedia: Effective nuclear charge', url: 'https://en.wikipedia.org/wiki/Effective_nuclear_charge' },
  'density-of-air': { name: 'Wikipedia: Density of air (1.2041 kg/m³ at 20 °C, 1 atm)', url: 'https://en.wikipedia.org/wiki/Density_of_air' },
  'ionic-bonding': { name: 'Wikipedia: Ionic bonding (table salt is sodium chloride)', url: 'https://en.wikipedia.org/wiki/Ionic_bonding' },
  'allotropes-of-carbon': { name: 'Wikipedia: Allotropes of carbon', url: 'https://en.wikipedia.org/wiki/Allotropes_of_carbon' },
  'chemworld-hg': { name: 'Chemistry World: Relativity behind mercury’s liquidity', url: 'https://www.chemistryworld.com/news/relativity-behind-mercurys-liquidity/6297.article' },
  'rsc-w': { name: 'Royal Society of Chemistry periodic table: Tungsten', url: 'https://periodic-table.rsc.org/element/74/tungsten' },
  'rsc-ga': { name: 'Royal Society of Chemistry periodic table: Gallium', url: 'https://periodic-table.rsc.org/element/31/gallium' },
  'rsc-he': { name: 'Royal Society of Chemistry periodic table: Helium', url: 'https://periodic-table.rsc.org/element/2/helium' },
  'rsc-hg': { name: 'Royal Society of Chemistry periodic table: Mercury', url: 'https://periodic-table.rsc.org/element/80/mercury' },
  'rsc-c': { name: 'Royal Society of Chemistry periodic table: Carbon', url: 'https://periodic-table.rsc.org/element/6/carbon' },
  // our own data sources (elements.json), named the way the value popovers name them
  pubchem: { data: 'pc' }, cordero: { data: 'mdl-cordero' }, alvarez: { data: 'mdl-alvarez' }, nist: { data: 'nist-ie' },
  ciaaw: { data: 'ciaaw' }, crc: { data: 'mdl-crc' }, synthetic: { data: 'wp-syn' }, clementi: { data: 'mdl-clementi' },
  nubase: { data: 'nubase' }, cod: { data: 'cod-2300702' }, crystal: { data: 'wp' },
};

/** The sources behind each pattern's question and answer. */
export const PATTERN_REFS = {
  mp: ['rsc-w', 'pubchem'],
  bp: ['pubchem'],
  density: ['density-of-air', 'rsc-he', 'pubchem'],
  rCov: ['periodic-trends', 'atomic-radius', 'cordero'],
  rVdw: ['periodic-trends', 'alvarez', 'cordero'],
  ie1: ['ionization-energy', 'nchem-2161', 'periodic-trends', 'nist'],
  en: ['electronegativity', 'properties-of-water', 'pubchem'],
  ea: ['electron-affinity', 'pubchem'],
  aw: ['periodic-trends', 'ciaaw'],
  abund: ['crc'],
  year: ['pubchem', 'synthetic'],
  zeff: ['effective-nuclear-charge', 'periodic-trends', 'clementi'],
  wave: ['periodic-trends', 'rsc-ga'],
};
