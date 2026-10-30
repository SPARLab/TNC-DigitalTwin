// ============================================================================
// Species the SDM picker leaves out because they are not land species.
//
// The SDM is for terrestrial species and its land mask only removes records on
// cells that are mostly open water, so seals on a beach or dolphins seen from the
// shore still count as land records. Marine mammals cannot be told apart by class
// or order (a sea lion is a Carnivora, like a bobcat), so they are listed here by
// scientific name. Fish are left out by class in speciesNamesService.ts.
//
// Built from the "Species Common Names" table (Mammalia, 149 species) in Oct 2026.
// Add a name here when a new marine species shows up in the picker; nothing else
// needs to change.
// ============================================================================

export const MARINE_MAMMALS: { species: string; commonName: string }[] = [
  // Seals, sea lions and the sea otter
  { species: 'Arctocephalus philippii', commonName: 'Juan Fernández Fur Seal' },
  { species: 'Callorhinus ursinus', commonName: 'Northern Fur Seal' },
  { species: 'Enhydra lutris', commonName: 'Sea Otter' },
  { species: 'Eumetopias jubatus', commonName: 'Steller Sea Lion' },
  { species: 'Mirounga angustirostris', commonName: 'Northern Elephant Seal' },
  { species: 'Mirounga leonina', commonName: 'Southern Elephant Seal' },
  { species: 'Phoca vitulina', commonName: 'Harbor Seal' },
  { species: 'Zalophus californianus', commonName: 'Californian Sea Lion' },

  // Baleen whales
  { species: 'Balaenoptera acutorostrata', commonName: 'Common Minke Whale' },
  { species: 'Balaenoptera musculus', commonName: 'Blue Whale' },
  { species: 'Balaenoptera physalus', commonName: 'Fin Whale' },
  { species: 'Eschrichtius robustus', commonName: 'Gray Whale' },
  { species: 'Eubalaena japonica', commonName: 'North Pacific Right Whale' },
  { species: 'Megaptera novaeangliae', commonName: 'Humpback Whale' },

  // Toothed whales, dolphins and porpoises
  { species: 'Delphinus delphis', commonName: 'Common Dolphin' },
  { species: 'Globicephala macrorhynchus', commonName: 'Short-finned Pilot Whale' },
  { species: 'Grampus griseus', commonName: "Risso's Dolphin" },
  { species: 'Kogia breviceps', commonName: 'Pygmy Sperm Whale' },
  { species: 'Kogia sima', commonName: 'Dwarf Sperm Whale' },
  { species: 'Lagenorhynchus obliquidens', commonName: 'Pacific White-sided Dolphin' },
  { species: 'Lissodelphis borealis', commonName: 'Northern Right Whale Dolphin' },
  { species: 'Mesoplodon carlhubbsi', commonName: "Hubbs' Beaked Whale" },
  { species: 'Mesoplodon densirostris', commonName: "Blainville's Beaked Whale" },
  { species: 'Mesoplodon ginkgodens', commonName: 'Ginkgo-toothed Beaked Whale' },
  { species: 'Orcinus orca', commonName: 'Killer Whale' },
  { species: 'Phocoena phocoena', commonName: 'Common Porpoise' },
  { species: 'Phocoenoides dalli', commonName: "Dall's Porpoise" },
  { species: 'Physeter macrocephalus', commonName: 'Sperm Whale' },
  { species: 'Pseudorca crassidens', commonName: 'False Killer Whale' },
  { species: 'Stenella coeruleoalba', commonName: 'Striped Dolphin' },
  { species: 'Steno bredanensis', commonName: 'Rough-toothed Dolphin' },
  { species: 'Tursiops truncatus', commonName: 'Bottle-nosed Dolphin' },
  { species: 'Ziphius cavirostris', commonName: "Cuvier's Beaked Whale" },
];

/** Scientific names the species picker hides. */
export const NON_TERRESTRIAL_SPECIES: string[] = MARINE_MAMMALS.map((entry) => entry.species);
