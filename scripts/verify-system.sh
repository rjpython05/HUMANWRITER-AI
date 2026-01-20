#!/bin/bash

# HUMANWRITER AI - System Verification Script
# This script verifies the integrity and functionality of all system components

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}HUMANWRITER AI - System Verification${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print section header
print_section() {
    echo -e "\n${BLUE}==== $1 ====${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNING_CHECKS++))
    ((TOTAL_CHECKS++))
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ==========================================
# 1. CHECK DEPENDENCIES
# ==========================================
print_section "Checking System Dependencies"

if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
fi

if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed"
fi

if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python 3 installed: $PYTHON_VERSION"
else
    print_error "Python 3 is not installed"
fi

if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"
else
    print_warning "Docker is not installed (optional)"
fi

# ==========================================
# 2. VERIFY FILE STRUCTURE
# ==========================================
print_section "Verifying Project Structure"

REQUIRED_DIRS=(
    "backend-api"
    "ai-engine"
    "webapp"
    "database"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        print_success "Directory exists: $dir"
    else
        print_error "Directory missing: $dir"
    fi
done

# ==========================================
# 3. VERIFY BACKEND API
# ==========================================
print_section "Verifying Backend API (TypeScript)"

cd "$PROJECT_ROOT/backend-api"

# Check if package.json exists
if [ -f "package.json" ]; then
    print_success "Backend package.json exists"
else
    print_error "Backend package.json missing"
fi

# Check TypeScript files
echo -e "\nChecking TypeScript syntax..."
if npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error TS"; then
    print_error "TypeScript compilation has errors"
    npx tsc --noEmit --skipLibCheck 2>&1 | grep "error TS" | head -10
else
    print_success "TypeScript syntax is valid"
fi

# Check critical backend files
BACKEND_FILES=(
    "src/app.ts"
    "src/index.ts"
    "src/middleware/security-headers.middleware.ts"
    "src/middleware/input-sanitization.middleware.ts"
    "src/config/security.config.ts"
    "src/services/verification.service.ts"
    "src/services/plagiarism.service.ts"
    "src/routes/verification.routes.ts"
    "src/routes/plagiarism.routes.ts"
    "src/controllers/verification.controller.ts"
)

for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Backend file exists: $file"
    else
        print_error "Backend file missing: $file"
    fi
done

# ==========================================
# 4. VERIFY AI ENGINE
# ==========================================
print_section "Verifying AI Engine (Python)"

cd "$PROJECT_ROOT/ai-engine"

# Check if requirements.txt exists
if [ -f "requirements.txt" ]; then
    print_success "AI Engine requirements.txt exists"
else
    print_warning "AI Engine requirements.txt missing"
fi

# Check Python syntax for critical files
echo -e "\nChecking Python syntax..."

AI_ENGINE_FILES=(
    "src/verification/ai_detectors.py"
    "src/verification/safety_score.py"
    "src/plagiarism/similarity_checker.py"
    "src/plagiarism/source_finder.py"
    "src/plagiarism/report_generator.py"
    "src/api/routes/verification.py"
    "src/api/routes/plagiarism.py"
)

for file in "${AI_ENGINE_FILES[@]}"; do
    if [ -f "$file" ]; then
        if python3 -m py_compile "$file" 2>/dev/null; then
            print_success "Python file valid: $file"
        else
            print_error "Python syntax error in: $file"
        fi
    else
        print_error "Python file missing: $file"
    fi
done

# ==========================================
# 5. VERIFY WEBAPP
# ==========================================
print_section "Verifying Webapp (Next.js)"

cd "$PROJECT_ROOT/webapp"

# Check if package.json exists
if [ -f "package.json" ]; then
    print_success "Webapp package.json exists"
else
    print_error "Webapp package.json missing"
fi

# Check critical frontend files
WEBAPP_FILES=(
    "src/components/verification/verification-dialog.tsx"
    "src/components/verification/safety-score-badge.tsx"
    "src/components/plagiarism/plagiarism-report.tsx"
    "src/components/plagiarism/source-matches.tsx"
)

for file in "${WEBAPP_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Frontend file exists: $file"
    else
        print_error "Frontend file missing: $file"
    fi
done

# ==========================================
# 6. VERIFY CONFIGURATION FILES
# ==========================================
print_section "Verifying Configuration Files"

cd "$PROJECT_ROOT"

CONFIG_FILES=(
    ".env.example"
    "docker-compose.yml"
    "docker-compose.prod.yml"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Config file exists: $file"
    else
        print_warning "Config file missing: $file"
    fi
done

# ==========================================
# 7. VERIFY PRISMA SCHEMA
# ==========================================
print_section "Verifying Prisma Schema"

cd "$PROJECT_ROOT/webapp"

if [ -f "prisma/schema.prisma" ]; then
    print_success "Prisma schema exists"

    # Check if schema has required models
    REQUIRED_MODELS=(
        "User"
        "Generation"
        "VerificationResult"
        "PlagiarismReport"
        "Document"
    )

    for model in "${REQUIRED_MODELS[@]}"; do
        if grep -q "model $model" prisma/schema.prisma; then
            print_success "Prisma model defined: $model"
        else
            print_error "Prisma model missing: $model"
        fi
    done
else
    print_error "Prisma schema missing"
fi

# ==========================================
# 8. VERIFY IMPORTS AND DEPENDENCIES
# ==========================================
print_section "Verifying Imports and Dependencies"

cd "$PROJECT_ROOT/backend-api"

# Check for common import errors
echo -e "\nChecking for import issues..."

# Check if plagiarism routes are imported in app.ts
if grep -q "import plagiarismRoutes from './routes/plagiarism.routes'" src/app.ts; then
    print_success "Plagiarism routes imported in app.ts"
else
    print_error "Plagiarism routes not imported in app.ts"
fi

# Check if plagiarism routes are registered
if grep -q "app.use('/api/plagiarism', plagiarismRoutes)" src/app.ts; then
    print_success "Plagiarism routes registered in app.ts"
else
    print_error "Plagiarism routes not registered in app.ts"
fi

# Check if verification routes are imported
if grep -q "import verificationRoutes from './routes/verification.routes'" src/app.ts; then
    print_success "Verification routes imported in app.ts"
else
    print_error "Verification routes not imported in app.ts"
fi

# ==========================================
# 9. VERIFY SECURITY MIDDLEWARE
# ==========================================
print_section "Verifying Security Implementation"

cd "$PROJECT_ROOT/backend-api"

# Check if security headers are applied
if grep -q "allSecurityHeaders" src/app.ts; then
    print_success "Security headers middleware applied"
else
    print_error "Security headers middleware not applied"
fi

# Check if input sanitization is applied
if grep -q "sanitizeAllInputs" src/app.ts; then
    print_success "Input sanitization middleware applied"
else
    print_error "Input sanitization middleware not applied"
fi

# Check if suspicious pattern detection is applied
if grep -q "detectSuspiciousPatterns" src/app.ts; then
    print_success "Suspicious pattern detection applied"
else
    print_error "Suspicious pattern detection not applied"
fi

# ==========================================
# 10. FINAL SUMMARY
# ==========================================
print_section "Verification Summary"

echo -e "\n${BLUE}Results:${NC}"
echo -e "  ${GREEN}Passed:${NC}  $PASSED_CHECKS"
echo -e "  ${RED}Failed:${NC}  $FAILED_CHECKS"
echo -e "  ${YELLOW}Warnings:${NC} $WARNING_CHECKS"
echo -e "  ${BLUE}Total:${NC}   $TOTAL_CHECKS"

echo -e "\n${BLUE}========================================${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ System verification PASSED${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    exit 0
else
    echo -e "${RED}✗ System verification FAILED${NC}"
    echo -e "${RED}Please fix the errors above${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    exit 1
fi
