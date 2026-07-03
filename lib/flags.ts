// Mapea nombres de equipo (en español, como se cargan en Supabase) a códigos
// de país para armar la URL de la bandera en flagcdn.com (gratis, sin API key).
// La búsqueda ignora tildes y mayúsculas para tolerar variaciones de tipeo.

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const FLAG_CODES: Record<string, string> = {
  // Sudamérica
  argentina: "ar",
  brasil: "br",
  brazil: "br",
  uruguay: "uy",
  colombia: "co",
  chile: "cl",
  peru: "pe",
  ecuador: "ec",
  paraguay: "py",
  bolivia: "bo",
  venezuela: "ve",

  // Norte y Centroamérica / Caribe
  mexico: "mx",
  "estados unidos": "us",
  eeuu: "us",
  usa: "us",
  canada: "ca",
  "costa rica": "cr",
  panama: "pa",
  honduras: "hn",
  jamaica: "jm",
  haiti: "ht",
  curazao: "cw",
  "el salvador": "sv",
  guatemala: "gt",
  "trinidad y tobago": "tt",
  surinam: "sr",

  // Europa
  alemania: "de",
  francia: "fr",
  espana: "es",
  italia: "it",
  inglaterra: "gb-eng",
  portugal: "pt",
  holanda: "nl",
  "paises bajos": "nl",
  belgica: "be",
  croacia: "hr",
  serbia: "rs",
  suiza: "ch",
  austria: "at",
  polonia: "pl",
  suecia: "se",
  noruega: "no",
  dinamarca: "dk",
  escocia: "gb-sct",
  gales: "gb-wls",
  irlanda: "ie",
  ucrania: "ua",
  rumania: "ro",
  hungria: "hu",
  "republica checa": "cz",
  chequia: "cz",
  eslovaquia: "sk",
  eslovenia: "si",
  grecia: "gr",
  turquia: "tr",

  // África
  marruecos: "ma",
  argelia: "dz",
  algeria: "dz",
  tunez: "tn",
  egipto: "eg",
  nigeria: "ng",
  senegal: "sn",
  ghana: "gh",
  camerun: "cm",
  "costa de marfil": "ci",
  sudafrica: "za",
  mali: "ml",
  "cabo verde": "cv",
  "rd congo": "cd",
  "r d congo": "cd",
  "congo rd": "cd",
  "republica democratica del congo": "cd",

  // Europa (continuación)
  bosnia: "ba",
  "bosnia y herzegovina": "ba",
  "bosnia-herzegovina": "ba",

  // Asia / Oceanía
  japon: "jp",
  "corea del sur": "kr",
  australia: "au",
  "arabia saudita": "sa",
  iran: "ir",
  irak: "iq",
  qatar: "qa",
  "emiratos arabes unidos": "ae",
  jordania: "jo",
  uzbekistan: "uz",
  "nueva zelanda": "nz",
  china: "cn",
}

/**
 * Devuelve la URL de la bandera (flagcdn.com) para un nombre de equipo, o
 * null si no está en el diccionario (o el nombre es null/vacío).
 */
export function getFlagUrl(
  teamName: string | null | undefined,
  size: "w40" | "w80" | "w160" = "w80",
): string | null {
  if (!teamName) return null
  const code = FLAG_CODES[normalize(teamName)]
  if (!code) return null
  return `https://flagcdn.com/${size}/${code}.png`
}