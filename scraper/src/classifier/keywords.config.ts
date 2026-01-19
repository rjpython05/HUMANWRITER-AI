import { Discipline } from '@prisma/client';

/**
 * Keywords configuration for discipline classification
 * Each discipline has keywords in Spanish and English
 */

export interface DisciplineKeywords {
  discipline: Discipline;
  keywords: string[];
  subdisciplines: {
    name: string;
    keywords: string[];
  }[];
}

export const DISCIPLINE_KEYWORDS: DisciplineKeywords[] = [
  {
    discipline: 'INGENIERIA' as Discipline,
    keywords: [
      // General engineering
      'ingeniería', 'engineering', 'tecnología', 'technology',
      'diseño', 'design', 'desarrollo', 'development',
      'sistema', 'system', 'proceso', 'process',
      'optimización', 'optimization', 'modelado', 'modeling',
      'simulación', 'simulation', 'prototipo', 'prototype',

      // Computer Science & Software
      'software', 'hardware', 'algoritmo', 'algorithm',
      'programación', 'programming', 'código', 'code',
      'base de datos', 'database', 'red', 'network',
      'inteligencia artificial', 'artificial intelligence',
      'machine learning', 'aprendizaje automático',
      'blockchain', 'ciberseguridad', 'cybersecurity',
      'cloud computing', 'computación en la nube',
      'big data', 'datos masivos', 'IoT', 'internet of things',

      // Civil Engineering
      'construcción', 'construction', 'estructura', 'structure',
      'cemento', 'concrete', 'acero', 'steel',
      'puente', 'bridge', 'edificio', 'building',
      'infraestructura', 'infrastructure',
      'geotecnia', 'geotechnical', 'hidráulica', 'hydraulics',

      // Electrical Engineering
      'eléctrico', 'electrical', 'electrónica', 'electronics',
      'circuito', 'circuit', 'potencia', 'power',
      'energía', 'energy', 'voltaje', 'voltage',
      'transistor', 'microcontrolador', 'microcontroller',
      'automatización', 'automation', 'control', 'señal', 'signal',

      // Mechanical Engineering
      'mecánico', 'mechanical', 'térmico', 'thermal',
      'fluido', 'fluid', 'motor', 'engine',
      'turbina', 'turbine', 'transmisión', 'transmission',
      'vibración', 'vibration', 'dinámica', 'dynamics',

      // Industrial Engineering
      'industrial', 'manufactura', 'manufacturing',
      'producción', 'production', 'calidad', 'quality',
      'logística', 'logistics', 'cadena de suministro', 'supply chain',
      'lean', 'six sigma', 'kaizen', 'gestión', 'management',
    ],
    subdisciplines: [
      {
        name: 'Ingeniería de Software',
        keywords: ['software', 'programación', 'desarrollo', 'código', 'aplicación', 'web', 'móvil'],
      },
      {
        name: 'Ingeniería Civil',
        keywords: ['civil', 'construcción', 'estructura', 'puente', 'carretera', 'edificio'],
      },
      {
        name: 'Ingeniería Industrial',
        keywords: ['industrial', 'producción', 'manufactura', 'logística', 'calidad', 'procesos'],
      },
      {
        name: 'Ingeniería Eléctrica',
        keywords: ['eléctrica', 'circuito', 'potencia', 'energía', 'voltaje'],
      },
      {
        name: 'Ingeniería Mecánica',
        keywords: ['mecánica', 'motor', 'térmico', 'fluido', 'dinámica'],
      },
      {
        name: 'Ciencias de la Computación',
        keywords: ['computación', 'algoritmo', 'inteligencia artificial', 'datos', 'red'],
      },
    ],
  },

  {
    discipline: 'CIENCIAS_SOCIALES' as Discipline,
    keywords: [
      // General social sciences
      'social', 'sociedad', 'society', 'cultura', 'culture',
      'comunidad', 'community', 'población', 'population',
      'comportamiento', 'behavior', 'actitud', 'attitude',
      'percepción', 'perception', 'identidad', 'identity',

      // Economics
      'economía', 'economics', 'económico', 'economic',
      'mercado', 'market', 'comercio', 'trade',
      'PIB', 'GDP', 'inflación', 'inflation',
      'desarrollo económico', 'economic development',
      'pobreza', 'poverty', 'desigualdad', 'inequality',
      'fiscal', 'monetario', 'monetary', 'financiero', 'financial',
      'inversión', 'investment', 'exportación', 'export',

      // Business & Management
      'administración', 'administration', 'gestión', 'management',
      'empresa', 'business', 'organización', 'organization',
      'marketing', 'mercadeo', 'recursos humanos', 'human resources',
      'finanzas', 'finance', 'contabilidad', 'accounting',
      'estrategia', 'strategy', 'liderazgo', 'leadership',

      // Psychology
      'psicología', 'psychology', 'psicológico', 'psychological',
      'cognición', 'cognition', 'emoción', 'emotion',
      'conducta', 'conduct', 'mental', 'terapia', 'therapy',

      // Sociology
      'sociología', 'sociology', 'sociológico', 'sociological',
      'clase social', 'social class', 'movilidad social',
      'estructura social', 'social structure',
      'cambio social', 'social change',

      // Political Science
      'política', 'politics', 'político', 'political',
      'gobierno', 'government', 'democracia', 'democracy',
      'elección', 'election', 'partido', 'party',
      'legislación', 'legislation', 'política pública', 'public policy',

      // Law
      'derecho', 'law', 'legal', 'jurídico', 'juridical',
      'constitución', 'constitution', 'justicia', 'justice',
      'tribunal', 'court', 'sentencia', 'sentence',

      // Education
      'educación', 'education', 'educativo', 'educational',
      'enseñanza', 'teaching', 'aprendizaje', 'learning',
      'pedagogía', 'pedagogy', 'currículo', 'curriculum',
      'estudiante', 'student', 'docente', 'teacher',

      // Communication
      'comunicación', 'communication', 'medios', 'media',
      'periodismo', 'journalism', 'información', 'information',
      'redes sociales', 'social media', 'digital',
    ],
    subdisciplines: [
      {
        name: 'Economía',
        keywords: ['economía', 'económico', 'mercado', 'PIB', 'inflación', 'comercio'],
      },
      {
        name: 'Administración de Empresas',
        keywords: ['administración', 'empresa', 'gestión', 'management', 'negocios'],
      },
      {
        name: 'Psicología',
        keywords: ['psicología', 'conducta', 'cognición', 'mental', 'terapia'],
      },
      {
        name: 'Sociología',
        keywords: ['sociología', 'social', 'sociedad', 'clase', 'estructura'],
      },
      {
        name: 'Ciencias Políticas',
        keywords: ['política', 'gobierno', 'democracia', 'legislación', 'público'],
      },
      {
        name: 'Derecho',
        keywords: ['derecho', 'legal', 'ley', 'justicia', 'tribunal'],
      },
      {
        name: 'Educación',
        keywords: ['educación', 'enseñanza', 'aprendizaje', 'pedagogía', 'estudiante'],
      },
    ],
  },

  {
    discipline: 'EXACTAS_NATURALES' as Discipline,
    keywords: [
      // Mathematics
      'matemática', 'mathematics', 'matemático', 'mathematical',
      'ecuación', 'equation', 'función', 'function',
      'cálculo', 'calculus', 'álgebra', 'algebra',
      'geometría', 'geometry', 'estadística', 'statistics',
      'probabilidad', 'probability', 'teorema', 'theorem',
      'demostración', 'proof', 'variable', 'variable',

      // Physics
      'física', 'physics', 'físico', 'physical',
      'energía', 'energy', 'fuerza', 'force',
      'masa', 'mass', 'velocidad', 'velocity',
      'aceleración', 'acceleration', 'onda', 'wave',
      'partícula', 'particle', 'cuántico', 'quantum',
      'relatividad', 'relativity', 'termodinámica', 'thermodynamics',

      // Chemistry
      'química', 'chemistry', 'químico', 'chemical',
      'molécula', 'molecule', 'átomo', 'atom',
      'reacción', 'reaction', 'elemento', 'element',
      'compuesto', 'compound', 'orgánico', 'organic',
      'inorgánico', 'inorganic', 'síntesis', 'synthesis',
      'catálisis', 'catalysis', 'pH', 'solución', 'solution',

      // Biology
      'biología', 'biology', 'biológico', 'biological',
      'célula', 'cell', 'gen', 'gene', 'ADN', 'DNA',
      'proteína', 'protein', 'organismo', 'organism',
      'evolución', 'evolution', 'especie', 'species',
      'ecosistema', 'ecosystem', 'biodiversidad', 'biodiversity',
      'microbiología', 'microbiology', 'genética', 'genetics',

      // Environmental Science
      'ambiental', 'environmental', 'medio ambiente', 'environment',
      'ecología', 'ecology', 'ecológico', 'ecological',
      'contaminación', 'pollution', 'cambio climático', 'climate change',
      'sostenibilidad', 'sustainability', 'recursos naturales',
      'conservación', 'conservation',

      // Geology
      'geología', 'geology', 'geológico', 'geological',
      'roca', 'rock', 'mineral', 'suelo', 'soil',
      'tectónica', 'tectonic', 'sismo', 'earthquake',

      // Astronomy
      'astronomía', 'astronomy', 'astronómico', 'astronomical',
      'estrella', 'star', 'planeta', 'planet',
      'galaxia', 'galaxy', 'universo', 'universe',
    ],
    subdisciplines: [
      {
        name: 'Matemáticas',
        keywords: ['matemática', 'ecuación', 'cálculo', 'álgebra', 'estadística'],
      },
      {
        name: 'Física',
        keywords: ['física', 'energía', 'fuerza', 'partícula', 'cuántico'],
      },
      {
        name: 'Química',
        keywords: ['química', 'molécula', 'reacción', 'síntesis', 'compuesto'],
      },
      {
        name: 'Biología',
        keywords: ['biología', 'célula', 'gen', 'ADN', 'organismo'],
      },
      {
        name: 'Ciencias Ambientales',
        keywords: ['ambiental', 'ecología', 'contaminación', 'sostenibilidad'],
      },
      {
        name: 'Geología',
        keywords: ['geología', 'roca', 'mineral', 'tectónica', 'sismo'],
      },
    ],
  },

  {
    discipline: 'AGRARIAS' as Discipline,
    keywords: [
      // Agriculture
      'agricultura', 'agriculture', 'agrícola', 'agricultural',
      'cultivo', 'crop', 'siembra', 'planting',
      'cosecha', 'harvest', 'producción agrícola',
      'suelo', 'soil', 'fertilizante', 'fertilizer',
      'pesticida', 'pesticide', 'riego', 'irrigation',
      'agronomía', 'agronomy', 'agronómico', 'agronomic',

      // Animal Science
      'ganadería', 'livestock', 'ganado', 'cattle',
      'animal', 'veterinaria', 'veterinary',
      'producción animal', 'animal production',
      'reproducción', 'reproduction', 'nutrición animal',
      'sanidad animal', 'animal health',

      // Food Science
      'alimento', 'food', 'alimentario', 'alimentary',
      'nutrición', 'nutrition', 'nutricional', 'nutritional',
      'procesamiento', 'processing', 'conservación', 'preservation',
      'calidad alimentaria', 'food quality',
      'seguridad alimentaria', 'food security',
      'tecnología de alimentos', 'food technology',

      // Forestry
      'forestal', 'forestry', 'bosque', 'forest',
      'árbol', 'tree', 'madera', 'wood',
      'silvicultura', 'silviculture', 'deforestación', 'deforestation',
      'reforestación', 'reforestation',

      // Fisheries
      'pesca', 'fishing', 'pesquero', 'fishery',
      'acuicultura', 'aquaculture', 'piscicultura',
      'marino', 'marine', 'océano', 'ocean',

      // Rural Development
      'rural', 'campo', 'campesino', 'peasant',
      'desarrollo rural', 'rural development',
      'comunidad rural', 'rural community',
      'agricultura familiar', 'family farming',

      // Agribusiness
      'agroindustria', 'agribusiness', 'agroindustrial',
      'comercialización agrícola', 'agricultural marketing',
      'cadena agroalimentaria', 'agri-food chain',

      // Plant Science
      'planta', 'plant', 'botánica', 'botany',
      'fitosanitario', 'phytosanitary', 'fitopatología',
      'semilla', 'seed', 'variedad', 'variety',
      'mejoramiento genético', 'genetic improvement',
    ],
    subdisciplines: [
      {
        name: 'Agronomía',
        keywords: ['agronomía', 'cultivo', 'siembra', 'producción agrícola', 'suelo'],
      },
      {
        name: 'Ganadería',
        keywords: ['ganadería', 'ganado', 'animal', 'veterinaria', 'producción animal'],
      },
      {
        name: 'Ciencias de los Alimentos',
        keywords: ['alimento', 'nutrición', 'procesamiento', 'calidad alimentaria'],
      },
      {
        name: 'Ingeniería Forestal',
        keywords: ['forestal', 'bosque', 'silvicultura', 'madera'],
      },
      {
        name: 'Pesca y Acuicultura',
        keywords: ['pesca', 'acuicultura', 'marino', 'pesquero'],
      },
      {
        name: 'Desarrollo Rural',
        keywords: ['rural', 'desarrollo rural', 'comunidad rural', 'campesino'],
      },
    ],
  },
];

/**
 * Get keywords for a specific discipline
 */
export function getKeywordsForDiscipline(discipline: Discipline): string[] {
  const config = DISCIPLINE_KEYWORDS.find(d => d.discipline === discipline);
  return config ? config.keywords : [];
}

/**
 * Get subdisciplines for a discipline
 */
export function getSubdisciplines(discipline: Discipline): { name: string; keywords: string[] }[] {
  const config = DISCIPLINE_KEYWORDS.find(d => d.discipline === discipline);
  return config ? config.subdisciplines : [];
}

/**
 * Get all disciplines
 */
export function getAllDisciplines(): Discipline[] {
  return DISCIPLINE_KEYWORDS.map(d => d.discipline);
}

export default DISCIPLINE_KEYWORDS;
