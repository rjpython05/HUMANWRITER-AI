#!/bin/bash

set -e

echo "📤 Exporting fine-tuned model to Ollama..."
echo ""

MODEL_PATH=${1}

if [ -z "$MODEL_PATH" ]; then
    echo "Usage: ./export-model.sh <path-to-gguf-model>"
    echo "Example: ./export-model.sh ~/Downloads/humanwriter-base.gguf"
    exit 1
fi

if [ ! -f "$MODEL_PATH" ]; then
    echo "Error: Model file not found: $MODEL_PATH"
    exit 1
fi

MODEL_NAME=$(basename "$MODEL_PATH" .gguf)

echo "Model: $MODEL_NAME"
echo "Path: $MODEL_PATH"
echo ""

# Create Modelfile
cat > /tmp/Modelfile << EOL
FROM $MODEL_PATH

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40

SYSTEM """
Eres un experto académico dominicano. Escribes textos académicos naturales con el estilo
característico de profesores e investigadores de República Dominicana.
"""
EOL

echo "📦 Creating Ollama model..."
ollama create "$MODEL_NAME" -f /tmp/Modelfile

echo ""
echo "✅ Model exported successfully!"
echo "🧪 Testing model..."
ollama run "$MODEL_NAME" "Escribe un párrafo académico sobre ingeniería."

echo ""
echo "✅ Model is ready to use!"
echo "🎯 Model name: $MODEL_NAME"
