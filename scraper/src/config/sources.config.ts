import { Discipline } from '@prisma/client';

export interface SourceConfig {
  id: string;
  name: string;
  url: string;
  category: 'universidades' | 'instituciones' | 'organismos' | 'journals';
  country: string;
  discipline?: Discipline;
  enabled: boolean;
  rateLimitMs: number;
  maxPages?: number;
  description: string;
}

/**
 * Configuration for all 20+ data sources
 */
export const SOURCES: SourceConfig[] = [
  // ==========================================
  // UNIVERSIDADES (6)
  // ==========================================
  {
    id: 'uasd',
    name: 'Universidad Autónoma de Santo Domingo (UASD)',
    url: 'https://repositoriovip.uasd.edu.do',
    category: 'universidades',
    country: 'DO',
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Repositorio institucional de la UASD con tesis y trabajos de grado',
  },
  {
    id: 'pucmm',
    name: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)',
    url: 'https://repositorio.pucmm.edu.do',
    category: 'universidades',
    country: 'DO',
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Repositorio académico de la PUCMM',
  },
  {
    id: 'intec',
    name: 'Instituto Tecnológico de Santo Domingo (INTEC)',
    url: 'https://biblioteca.intec.edu.do',
    category: 'universidades',
    country: 'DO',
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Biblioteca digital del INTEC',
  },
  {
    id: 'unphu',
    name: 'Universidad Nacional Pedro Henríquez Ureña (UNPHU)',
    url: 'https://repositorio.unphu.edu.do',
    category: 'universidades',
    country: 'DO',
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Repositorio institucional de la UNPHU',
  },
  {
    id: 'uapa',
    name: 'Universidad Abierta Para Adultos (UAPA)',
    url: 'https://rai.uapa.edu.do',
    category: 'universidades',
    country: 'DO',
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Repositorio Académico Institucional de la UAPA',
  },
  {
    id: 'unibe',
    name: 'Universidad Iberoamericana (UNIBE)',
    url: 'https://repositorio.unibe.edu.do',
    category: 'universidades',
    country: 'DO',
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Repositorio institucional de la UNIBE',
  },

  // ==========================================
  // INSTITUCIONES DOMINICANAS (3)
  // ==========================================
  {
    id: 'bcrd',
    name: 'Banco Central de la República Dominicana',
    url: 'https://www.bancentral.gov.do',
    category: 'instituciones',
    country: 'DO',
    discipline: 'CIENCIAS_SOCIALES' as Discipline,
    enabled: true,
    rateLimitMs: 4000,
    maxPages: 50,
    description: 'Publicaciones económicas y estadísticas del Banco Central',
  },
  {
    id: 'one',
    name: 'Oficina Nacional de Estadística (ONE)',
    url: 'https://www.one.gob.do',
    category: 'instituciones',
    country: 'DO',
    discipline: 'CIENCIAS_SOCIALES' as Discipline,
    enabled: true,
    rateLimitMs: 4000,
    maxPages: 50,
    description: 'Censos, encuestas y estadísticas oficiales de República Dominicana',
  },
  {
    id: 'ministerios',
    name: 'Ministerios de República Dominicana',
    url: 'https://www.gob.do',
    category: 'instituciones',
    country: 'DO',
    enabled: true,
    rateLimitMs: 4000,
    maxPages: 50,
    description: 'Publicaciones de ministerios dominicanos (Educación, Salud, Agricultura, etc.)',
  },

  // ==========================================
  // ORGANISMOS INTERNACIONALES (6)
  // ==========================================
  {
    id: 'cepal',
    name: 'CEPAL (Comisión Económica para América Latina y el Caribe)',
    url: 'https://repositorio.cepal.org',
    category: 'organismos',
    country: 'LATAM',
    discipline: 'CIENCIAS_SOCIALES' as Discipline,
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 200,
    description: 'Estudios económicos y sociales de América Latina (filtrar por República Dominicana)',
  },
  {
    id: 'bid',
    name: 'BID (Banco Interamericano de Desarrollo)',
    url: 'https://publications.iadb.org',
    category: 'organismos',
    country: 'LATAM',
    discipline: 'CIENCIAS_SOCIALES' as Discipline,
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 150,
    description: 'Publicaciones sobre desarrollo económico en América Latina',
  },
  {
    id: 'banco-mundial',
    name: 'Banco Mundial',
    url: 'https://openknowledge.worldbank.org',
    category: 'organismos',
    country: 'GLOBAL',
    discipline: 'CIENCIAS_SOCIALES' as Discipline,
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 150,
    description: 'Documentos sobre desarrollo económico global (filtrar por República Dominicana)',
  },
  {
    id: 'fmi',
    name: 'FMI (Fondo Monetario Internacional)',
    url: 'https://www.imf.org/en/Publications',
    category: 'organismos',
    country: 'GLOBAL',
    discipline: 'CIENCIAS_SOCIALES' as Discipline,
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Informes económicos y fiscales (filtrar por República Dominicana)',
  },
  {
    id: 'fao',
    name: 'FAO (Organización de las Naciones Unidas para la Alimentación y la Agricultura)',
    url: 'https://www.fao.org/documents',
    category: 'organismos',
    country: 'GLOBAL',
    discipline: 'AGRARIAS' as Discipline,
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Documentos sobre agricultura y alimentación (filtrar por República Dominicana)',
  },
  {
    id: 'ops',
    name: 'OPS/OMS (Organización Panamericana de la Salud)',
    url: 'https://iris.paho.org',
    category: 'organismos',
    country: 'LATAM',
    discipline: 'CIENCIAS_SOCIALES' as Discipline,
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 100,
    description: 'Publicaciones sobre salud pública en las Américas (filtrar por República Dominicana)',
  },

  // ==========================================
  // JOURNALS ACADÉMICOS (3)
  // ==========================================
  {
    id: 'latindex',
    name: 'Latindex',
    url: 'https://www.latindex.org',
    category: 'journals',
    country: 'LATAM',
    enabled: true,
    rateLimitMs: 4000,
    maxPages: 200,
    description: 'Sistema regional de información para revistas científicas de América Latina (filtrar República Dominicana)',
  },
  {
    id: 'scielo',
    name: 'SciELO (Scientific Electronic Library Online)',
    url: 'https://scielo.org',
    category: 'journals',
    country: 'LATAM',
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 200,
    description: 'Biblioteca electrónica de revistas científicas (filtrar República Dominicana)',
  },
  {
    id: 'redalyc',
    name: 'Redalyc',
    url: 'https://www.redalyc.org',
    category: 'journals',
    country: 'LATAM',
    enabled: true,
    rateLimitMs: 3000,
    maxPages: 200,
    description: 'Red de Revistas Científicas de América Latina y el Caribe (filtrar República Dominicana)',
  },
];

/**
 * Get sources by category
 */
export function getSourcesByCategory(
  category: 'universidades' | 'instituciones' | 'organismos' | 'journals'
): SourceConfig[] {
  return SOURCES.filter(s => s.category === category && s.enabled);
}

/**
 * Get source by ID
 */
export function getSourceById(id: string): SourceConfig | undefined {
  return SOURCES.find(s => s.id === id);
}

/**
 * Get enabled sources
 */
export function getEnabledSources(): SourceConfig[] {
  return SOURCES.filter(s => s.enabled);
}

/**
 * Get sources by discipline
 */
export function getSourcesByDiscipline(discipline: Discipline): SourceConfig[] {
  return SOURCES.filter(s => s.discipline === discipline && s.enabled);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(SOURCES.map(s => s.category)));
}

/**
 * Get statistics
 */
export function getSourcesStats(): {
  total: number;
  enabled: number;
  byCategory: Record<string, number>;
  byCountry: Record<string, number>;
} {
  const enabled = SOURCES.filter(s => s.enabled).length;
  const byCategory: Record<string, number> = {};
  const byCountry: Record<string, number> = {};

  for (const source of SOURCES) {
    byCategory[source.category] = (byCategory[source.category] || 0) + 1;
    byCountry[source.country] = (byCountry[source.country] || 0) + 1;
  }

  return {
    total: SOURCES.length,
    enabled,
    byCategory,
    byCountry,
  };
}

export default SOURCES;
