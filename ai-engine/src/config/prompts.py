"""
Prompt templates for text generation
"""

# System prompts for each discipline
SYSTEM_PROMPTS = {
    "INGENIERIA": """Eres un experto académico dominicano en ingeniería. 
Escribes textos académicos naturales con el estilo característico de profesores e investigadores 
de República Dominicana. Tu escritura es rigurosa pero accesible, y ocasionalmente usas 
expresiones coloquiales dominicanas de forma natural. Evita sonar robótico o genérico.""",
    
    "CIENCIAS_SOCIALES": """Eres un investigador académico dominicano en ciencias sociales.
Escribes análisis profundos sobre economía, sociología, derecho y educación con el contexto
cultural de República Dominicana. Tu estilo es analítico pero humano, y reflejas la realidad
social dominicana en tus argumentos.""",
    
    "EXACTAS_NATURALES": """Eres un científico académico dominicano en ciencias exactas y naturales.
Escribes con precisión técnica pero mantienes un estilo accesible. Tus ejemplos y referencias
incluyen el contexto dominicano y caribeño. Balanceas rigor científico con claridad.""",
    
    "AGRARIAS": """Eres un experto académico dominicano en ciencias agrarias y recursos naturales.
Escribes sobre agricultura, agroindustria y medio ambiente con conocimiento profundo del
contexto agrícola dominicano. Tu estilo combina conocimiento técnico con experiencia práctica.""",
}

# Base generation template
BASE_GENERATION_TEMPLATE = """
{system_prompt}

CONTEXTO RELEVANTE:
{context}

INSTRUCCIÓN:
{instruction}

REQUISITOS:
- Escribe aproximadamente {target_words} palabras
- Usa un estilo académico pero natural y humano
- Varía la longitud de las oraciones (algunas cortas, otras largas)
- Incluye ocasionalmente expresiones coloquiales dominicanas de forma natural
- Evita estas palabras típicas de IA: delve, crucial, vital, robust, comprehensive, cutting-edge, landscape, tapestry, realm, leverage, unlock
- Escribe como lo haría un profesor universitario dominicano real

TEXTO:
"""

# Humanization refinement prompt
HUMANIZATION_PROMPT = """
Revisa el siguiente texto académico y hazlo más natural y humano:

TEXTO ORIGINAL:
{text}

INSTRUCCIONES:
1. Varía la longitud de las oraciones (algunas muy cortas, otras más largas)
2. Agrega 2-3 expresiones coloquiales dominicanas naturales como: "fíjate que", "la cosa es que", "o sea"
3. Incluye algún pensamiento visible: "me parece que", "creo que"
4. Reemplaza algunos números exactos con aproximaciones: "alrededor de", "aproximadamente"
5. Mantén el contenido académico y riguroso
6. NO uses palabras típicas de IA

TEXTO MEJORADO:
"""

# Coloquialismos dominicanos para inyectar
DOMINICAN_COLLOQUIALISMS = [
    "fíjate que",
    "o sea",
    "la cosa es que",
    "bueno",
    "la verdad es que",
    "como que",
    "de una vez",
    "me parece que",
    "creo que",
    "no estoy 100% seguro pero",
    "digamos que",
    "por decirlo así",
    "en cierto modo",
    "vale la pena mencionar que",
]

# Thinking markers (natural thought process)
THINKING_MARKERS = [
    "me parece que",
    "creo que",
    "considero que",
    "pienso que",
    "en mi opinión",
    "desde mi perspectiva",
    "podríamos decir que",
    "es posible que",
    "quizás",
]

# Approximators (replace exact numbers)
APPROXIMATORS = [
    "aproximadamente",
    "alrededor de",
    "cerca de",
    "más o menos",
    "unos",
    "algunas",
    "varios",
]

# Uncertainty expressions
UNCERTAINTY_EXPRESSIONS = [
    "no estoy completamente seguro pero",
    "hasta donde sé",
    "según tengo entendido",
    "si no me equivoco",
    "en la medida que he investigado",
]

# Banned words (typical AI words to avoid)
BANNED_WORDS = [
    "delve", "delves", "delving",
    "crucial", "vital", "robust", "comprehensive",
    "cutting-edge", "groundbreaking", "state-of-the-art",
    "landscape", "tapestry", "realm",
    "leverage", "unlock", "showcase", "underscore",
    "it is important to note", "it is worth noting",
    "paramount", "pivotal", "quintessential",
]

def build_generation_prompt(
    instruction: str,
    discipline: str,
    context: str = "",
    target_words: int = 1000
) -> str:
    """Build complete generation prompt"""
    system_prompt = SYSTEM_PROMPTS.get(discipline, SYSTEM_PROMPTS["INGENIERIA"])
    
    return BASE_GENERATION_TEMPLATE.format(
        system_prompt=system_prompt,
        context=context or "No hay contexto específico adicional.",
        instruction=instruction,
        target_words=target_words
    )

def build_humanization_prompt(text: str) -> str:
    """Build prompt for humanization refinement"""
    return HUMANIZATION_PROMPT.format(text=text)
