"""
Prompt builder for text generation
Constructs prompts using templates and RAG context
"""
from typing import Optional
from loguru import logger

from ..config.prompts import (
    build_generation_prompt as config_build_prompt,
    build_humanization_prompt as config_build_humanization,
    SYSTEM_PROMPTS,
    BASE_GENERATION_TEMPLATE,
    HUMANIZATION_PROMPT
)


class PromptBuilder:
    """
    Builds prompts for text generation using templates and context
    """

    def __init__(self):
        """Initialize prompt builder"""
        logger.info("Initialized PromptBuilder")

    def build_generation_prompt(
        self,
        instruction: str,
        discipline: str,
        context: str = None,
        target_words: int = 1000,
        use_rag_context: bool = True
    ) -> str:
        """
        Build complete generation prompt with RAG context

        Args:
            instruction: User's generation instruction
            discipline: Academic discipline
            context: RAG context (retrieved documents)
            target_words: Target word count
            use_rag_context: Whether to include RAG context

        Returns:
            Complete prompt string
        """
        # Use context if provided and RAG is enabled
        final_context = ""
        if use_rag_context and context:
            final_context = context
            logger.info(f"Including RAG context ({len(context)} chars)")
        else:
            final_context = "No hay contexto específico adicional."
            logger.debug("No RAG context provided")

        # Use the prompt builder from config
        prompt = config_build_prompt(
            instruction=instruction,
            discipline=discipline,
            context=final_context,
            target_words=target_words
        )

        logger.info(
            f"Built generation prompt: "
            f"discipline={discipline}, "
            f"target_words={target_words}, "
            f"rag_enabled={use_rag_context}"
        )

        return prompt

    def build_humanization_prompt(self, text: str) -> str:
        """
        Build prompt for humanizing existing text

        Args:
            text: Text to humanize

        Returns:
            Humanization prompt
        """
        logger.info(f"Built humanization prompt for text ({len(text)} chars)")
        return config_build_humanization(text)

    def build_system_prompt(self, discipline: str) -> str:
        """
        Get system prompt for a discipline

        Args:
            discipline: Academic discipline

        Returns:
            System prompt string
        """
        system_prompt = SYSTEM_PROMPTS.get(
            discipline,
            SYSTEM_PROMPTS["INGENIERIA"]  # Default fallback
        )

        logger.debug(f"Retrieved system prompt for discipline: {discipline}")
        return system_prompt

    def inject_rag_context(
        self,
        base_prompt: str,
        rag_context: str,
        max_context_length: int = 2000
    ) -> str:
        """
        Inject RAG context into a prompt

        Args:
            base_prompt: Base prompt template
            rag_context: RAG retrieved context
            max_context_length: Maximum length for context

        Returns:
            Prompt with injected context
        """
        # Truncate context if too long
        if len(rag_context) > max_context_length:
            rag_context = rag_context[:max_context_length] + "..."
            logger.warning(f"Truncated RAG context to {max_context_length} chars")

        # Replace context placeholder
        if "{context}" in base_prompt:
            result = base_prompt.replace("{context}", rag_context)
        else:
            # If no placeholder, append context
            result = f"{base_prompt}\n\nCONTEXTO RELEVANTE:\n{rag_context}\n"

        logger.info(f"Injected RAG context ({len(rag_context)} chars)")
        return result

    def build_few_shot_prompt(
        self,
        instruction: str,
        examples: list,
        discipline: str,
        target_words: int = 1000
    ) -> str:
        """
        Build few-shot prompt with examples

        Args:
            instruction: User instruction
            examples: List of example input/output pairs
            discipline: Academic discipline
            target_words: Target word count

        Returns:
            Few-shot prompt
        """
        system_prompt = self.build_system_prompt(discipline)

        # Build examples section
        examples_text = ""
        for i, example in enumerate(examples, 1):
            examples_text += f"\nEJEMPLO {i}:\n"
            examples_text += f"Instrucción: {example.get('input', '')}\n"
            examples_text += f"Respuesta: {example.get('output', '')}\n"

        prompt = f"{system_prompt}\n\n{examples_text}\n\nAHORA TU TURNO:\n{instruction}\n"

        logger.info(f"Built few-shot prompt with {len(examples)} examples")
        return prompt

    def validate_prompt(self, prompt: str, max_length: int = 8000) -> bool:
        """
        Validate prompt length and content

        Args:
            prompt: Prompt to validate
            max_length: Maximum allowed prompt length

        Returns:
            True if valid, False otherwise
        """
        if not prompt or not prompt.strip():
            logger.error("Empty prompt")
            return False

        if len(prompt) > max_length:
            logger.error(f"Prompt too long: {len(prompt)} > {max_length}")
            return False

        logger.debug("Prompt validation passed")
        return True

    def get_template_variables(self, template: str) -> list:
        """
        Extract template variables from a prompt template

        Args:
            template: Prompt template string

        Returns:
            List of variable names found in template
        """
        import re
        variables = re.findall(r'\{(\w+)\}', template)
        logger.debug(f"Found template variables: {variables}")
        return variables


# Global instance
_prompt_builder = None


def get_prompt_builder() -> PromptBuilder:
    """
    Get or create global PromptBuilder instance

    Returns:
        PromptBuilder instance
    """
    global _prompt_builder
    if _prompt_builder is None:
        _prompt_builder = PromptBuilder()
    return _prompt_builder
