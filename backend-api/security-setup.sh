#!/bin/bash

##############################################################
# HUMANWRITER AI - Security Setup Script
#
# This script installs additional security dependencies
# and configures security best practices
##############################################################

set -e

echo "=================================================="
echo "HUMANWRITER AI - Security Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${RED}Error: Do not run this script as root${NC}"
   exit 1
fi

echo -e "${GREEN}Step 1: Installing additional security dependencies...${NC}"

# Install security-focused npm packages
npm install --save express-mongo-sanitize
npm install --save hpp
npm install --save validator
npm install --save rate-limiter-flexible
npm install --save express-slow-down

# Install development/security tools
npm install --save-dev snyk
npm install --save-dev eslint-plugin-security
npm install --save-dev @types/validator

echo -e "${GREEN}✓ Security dependencies installed${NC}"
echo ""

echo -e "${GREEN}Step 2: Running security audit...${NC}"

# Run npm audit
npm audit || echo -e "${YELLOW}⚠ Some vulnerabilities found. Review npm audit output.${NC}"
echo ""

echo -e "${GREEN}Step 3: Setting up security checks...${NC}"

# Create git pre-commit hook for security checks
cat > ../.git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "Running security checks..."

# Run npm audit
npm audit --audit-level=high || {
    echo "Security vulnerabilities found! Fix them before committing."
    exit 1
}

# Check for sensitive data in commits
if git diff --cached --name-only | grep -E '\.(env|pem|key|p12)$'; then
    echo "Error: Attempting to commit sensitive files!"
    exit 1
fi

# Check for hardcoded secrets
if git diff --cached | grep -iE '(password|secret|api_key|private_key)\s*=\s*["\047][^"\047]+["\047]'; then
    echo "Warning: Possible hardcoded secrets detected!"
    echo "Review your changes carefully."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Security checks passed!"
EOF

chmod +x ../.git/hooks/pre-commit

echo -e "${GREEN}✓ Git pre-commit hook created${NC}"
echo ""

echo -e "${GREEN}Step 4: Creating security documentation...${NC}"

# Create .npmrc for security settings
cat > .npmrc << 'EOF'
# Security settings
audit=true
audit-level=high
package-lock=true

# Registry settings
registry=https://registry.npmjs.org/
EOF

echo -e "${GREEN}✓ .npmrc created with security settings${NC}"
echo ""

echo -e "${GREEN}Step 5: Environment variable check...${NC}"

# Check if critical environment variables are set
if [ -f "../.env" ]; then
    echo "Checking .env file..."

    # Check JWT_SECRET
    if grep -q "JWT_SECRET=\"your-jwt-secret-change-this\"" ../.env; then
        echo -e "${RED}⚠ CRITICAL: JWT_SECRET is using default value!${NC}"
        echo "Generate a secure secret with: openssl rand -base64 32"
    fi

    # Check NEXTAUTH_SECRET
    if grep -q "NEXTAUTH_SECRET=\"generate-with-openssl-rand-base64-32\"" ../.env; then
        echo -e "${RED}⚠ CRITICAL: NEXTAUTH_SECRET is using default value!${NC}"
        echo "Generate a secure secret with: openssl rand -base64 32"
    fi

    # Check database password
    if grep -q "dev_password" ../.env; then
        echo -e "${YELLOW}⚠ WARNING: Database using development password${NC}"
    fi
else
    echo -e "${YELLOW}⚠ WARNING: .env file not found!${NC}"
    echo "Copy .env.example to .env and configure it"
fi

echo ""

echo -e "${GREEN}Step 6: Optional - Snyk setup...${NC}"
echo "To enable Snyk vulnerability scanning:"
echo "1. Create account at https://snyk.io"
echo "2. Run: npx snyk auth"
echo "3. Run: npx snyk test"
echo ""

echo "=================================================="
echo -e "${GREEN}Security Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review and fix any npm audit vulnerabilities"
echo "2. Generate secure secrets for .env file"
echo "3. Run 'npm run security:check' before deploying"
echo "4. Review SECURITY.md for complete security guidelines"
echo ""
echo "Additional commands:"
echo "  npm audit                  - Check for vulnerabilities"
echo "  npm audit fix              - Auto-fix vulnerabilities"
echo "  npx snyk test              - Deep security scan (requires Snyk)"
echo "  npm run lint               - Check code quality"
echo ""
