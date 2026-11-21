import type { Translate } from '../types'

export function translateSpecies(
  species: string | null,
  t: Translate
) {
  if (!species) return 'Unknown'

  const normalized = species.trim().toLowerCase()

  const speciesTranslations: Record<string, string> = {
    'chestnut munia': 'chestnutMunia',
  }

  const translationKey = speciesTranslations[normalized]

  return translationKey ? t(translationKey) : species
}