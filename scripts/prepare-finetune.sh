#!/bin/bash

set -e

echo "🎓 Preparing dataset for fine-tuning..."
echo ""

cd ai-engine

# Activate virtual environment
source venv/bin/activate

# Run preparation script
python src/fine_tuning/prepare_dataset.py

echo ""
echo "✅ Dataset prepared!"
echo "📁 Dataset location: ai-engine/data/finetune_dataset.jsonl"
echo ""
echo "📝 Next steps:"
echo "1. Upload dataset to Google Colab"
echo "2. Open the fine-tuning notebook"
echo "3. Follow the instructions to train the model"
echo "4. Download the trained model"
echo "5. Run ./scripts/export-model.sh to integrate it"

deactivate
