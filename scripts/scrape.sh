#!/bin/bash

set -e

echo "🕷️  Starting HumanWriter AI Scraper..."
echo ""

# Parse arguments
CATEGORY=${1:-all}

cd scraper

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "🎯 Scraping category: $CATEGORY"
echo ""

case $CATEGORY in
    universidades)
        npm run scrape:universidades
        ;;
    instituciones)
        npm run scrape:instituciones
        ;;
    organismos)
        npm run scrape:organismos
        ;;
    journals)
        npm run scrape:journals
        ;;
    all)
        echo "Scraping all sources..."
        npm run scrape
        ;;
    *)
        echo "Unknown category: $CATEGORY"
        echo "Usage: ./scrape.sh [universidades|instituciones|organismos|journals|all]"
        exit 1
        ;;
esac

cd ..

echo ""
echo "✅ Scraping complete!"
echo "📊 Check data/processed/ for extracted documents"
