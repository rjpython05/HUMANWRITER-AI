#!/bin/bash

set -e

echo "📦 Installing Ollama..."
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected Linux"
    curl -fsSL https://ollama.com/install.sh | sh
    
    # Start and enable service
    sudo systemctl start ollama
    sudo systemctl enable ollama
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS"
    if command -v brew &> /dev/null; then
        brew install ollama
    else
        echo "Homebrew not found. Please install from: https://ollama.com/download"
        exit 1
    fi
else
    echo "Unsupported OS. Please install manually from: https://ollama.com/download"
    exit 1
fi

echo ""
echo "✅ Ollama installed successfully!"
echo ""
echo "📥 Downloading LLaMA 3.1 8B model..."
echo "This may take 10-30 minutes depending on your connection..."
ollama pull llama3.1:8b

echo ""
echo "✅ Model downloaded successfully!"
echo ""
echo "🧪 Testing Ollama..."
ollama list

echo ""
echo "✅ All done! Ollama is ready to use."
