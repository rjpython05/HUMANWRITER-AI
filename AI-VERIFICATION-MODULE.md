# AI Detection Verification Module

Complete implementation of AI Detection Verification system for HumanWriter AI.

## Overview

This module integrates with external AI detection services to verify that generated text appears sufficiently human-like before export. It provides:

- **Multi-detector verification** - Integrates with GPTZero, ZeroGPT, Copyleaks, and Winston AI
- **Safety scoring** - Calculates an overall safety score (0-100) based on aggregated results
- **Risk assessment** - Classifies text as LOW, MEDIUM, or HIGH risk
- **Actionable recommendations** - Provides specific suggestions for improvement
- **Pre-export verification** - Optional dialog before exporting generated text

## Architecture

### 1. AI Engine (Python/FastAPI)

**Location:** `/home/user/HUMANWRITER-AI/ai-engine/src/verification/`

#### Files Created:

1. **`ai_detectors.py`** - External AI detector integrations
   - GPTZero API integration
   - ZeroGPT API integration
   - Copyleaks API integration
   - Winston AI API integration
   - Parallel execution for fast results
   - Comprehensive error handling

2. **`safety_score.py`** - Safety score calculator
   - Calculates weighted safety score from multiple factors
   - Risk level classification (LOW/MEDIUM/HIGH)
   - Confidence scoring
   - Recommendation generation

3. **`/api/routes/verification.py`** - FastAPI endpoints
   - `POST /verification/verify` - Run full verification
   - `POST /verification/safety-score` - Calculate safety score
   - `GET /verification/detectors` - List available detectors
   - `GET /verification/health` - Health check

**Key Features:**
- Async/await for parallel detector calls
- Configurable via environment variables
- Graceful degradation when detectors unavailable
- Detailed logging with loguru

### 2. Backend API (TypeScript/Express)

**Location:** `/home/user/HUMANWRITER-AI/backend-api/src/`

#### Files Created:

1. **`services/verification.service.ts`** - Verification service
   - Proxies requests to AI Engine
   - Stores verification results in PostgreSQL
   - Associates verifications with generations
   - Provides verification history and stats

2. **`controllers/verification.controller.ts`** - Route controllers
   - Request validation
   - Error handling
   - Response formatting

3. **`routes/verification.routes.ts`** - Express routes
   - `POST /api/verify` - Verify text
   - `POST /api/verify/safety-score` - Calculate safety score
   - `GET /api/verify/history` - Get user verification history
   - `GET /api/verify/stats` - Get user statistics
   - `GET /api/verify/:id` - Get verification by ID
   - `GET /api/verify/detectors` - List available detectors
   - `GET /api/verify/health` - Health check

**Database Schema** (Prisma):

```prisma
model VerificationResult {
  id              String    @id @default(cuid())
  userId          String?
  generationId    String?
  generation      Generation? @relation(fields: [generationId], references: [id])
  text            String    @db.Text

  // Individual detector scores
  gptZeroScore    Float?
  zeroGptScore    Float?
  copyleaksScore  Float?
  winstonScore    Float?

  // Aggregated scores
  averageScore    Float?
  weightedScore   Float?
  consensusScore  Float?

  // Safety assessment
  safetyScore     Float
  riskLevel       RiskLevel
  confidence      Float     @default(0.5)
  recommendations Json

  // Metadata
  detectorsUsed   Int       @default(0)
  successfulDetections Int  @default(0)
  createdAt       DateTime  @default(now())
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}
```

### 3. Web Application (Next.js/React)

**Location:** `/home/user/HUMANWRITER-AI/webapp/src/`

#### Files Created:

1. **`components/verification/verification-dialog.tsx`**
   - Pre-export verification dialog
   - Auto-runs verification when opened
   - Shows individual detector results
   - Displays safety score and risk level
   - Provides recommendations
   - Options to re-humanize or export anyway

2. **`components/verification/safety-score-badge.tsx`**
   - Visual safety score badge component
   - Color-coded by risk level (green/yellow/red)
   - Multiple size variants (sm/md/lg)
   - Safety score card variant
   - Mini score variant for compact displays

3. **`app/(dashboard)/verify/page.tsx`**
   - Dedicated verification page
   - Text input or file upload
   - Real-time verification status
   - Detailed results display
   - Verification history view
   - Export report functionality

## Setup and Configuration

### 1. Environment Variables

Add the following to your `.env` files:

**AI Engine** (`.env` in `/ai-engine`):
```bash
# GPTZero
GPTZERO_API_KEY=your_gptzero_api_key

# ZeroGPT
ZEROGPT_API_KEY=your_zerogpt_api_key

# Copyleaks
COPYLEAKS_API_KEY=your_copyleaks_api_key
COPYLEAKS_API_EMAIL=your_copyleaks_email

# Winston AI
WINSTON_API_KEY=your_winston_api_key
```

**Note:** The module works with any subset of detectors configured. If no API keys are provided, verification will return a warning.

### 2. Database Migration

Run Prisma migration to create the `VerificationResult` table:

```bash
cd webapp
npx prisma migrate dev --name add_verification_result
npx prisma generate
```

### 3. Install Dependencies

**AI Engine:**
```bash
cd ai-engine
pip install aiohttp  # For async HTTP requests
```

**Backend API:**
```bash
cd backend-api
# Dependencies already in package.json
npm install
```

**Web App:**
```bash
cd webapp
# Dependencies already in package.json
npm install
```

## Usage

### API Endpoints

#### 1. Verify Text

```bash
POST /api/verify
Content-Type: application/json

{
  "text": "Your text to verify...",
  "generationId": "optional-generation-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "verification-id",
    "text_preview": "Your text to verify...",
    "text_length": 1523,
    "results": [
      {
        "detector": "GPTZero",
        "score": 23.5,
        "confidence": 0.85,
        "success": true
      }
    ],
    "safety_score": 78.5,
    "risk_level": "MEDIUM",
    "confidence": 0.82,
    "recommendations": [
      "Consider re-humanizing for safer results",
      "Add more transitional phrases"
    ]
  }
}
```

#### 2. Calculate Safety Score

```bash
POST /api/verify/safety-score
Content-Type: application/json

{
  "average_ai_score": 25.3,
  "weighted_ai_score": 24.1,
  "consensus_score": 87.5,
  "detector_count": 3
}
```

#### 3. Get Verification History

```bash
GET /api/verify/history?limit=20&offset=0
Authorization: Bearer <token>
```

#### 4. Get Available Detectors

```bash
GET /api/verify/detectors
```

**Response:**
```json
{
  "detectors": {
    "GPTZero": {
      "name": "GPTZero",
      "configured": true,
      "description": "AI content detection by GPTZero"
    }
  },
  "total": 4,
  "available": 3,
  "configured": true
}
```

### React Components

#### VerificationDialog

Pre-export verification dialog:

```tsx
import { VerificationDialog } from '@/components/verification/verification-dialog';

function ExportButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        Export
      </Button>

      <VerificationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        text={generatedText}
        onReHumanize={() => {
          // Re-run humanization pipeline
        }}
        onExport={() => {
          // Proceed with export
        }}
      />
    </>
  );
}
```

#### SafetyScoreBadge

Display safety scores:

```tsx
import { SafetyScoreBadge } from '@/components/verification/safety-score-badge';

<SafetyScoreBadge
  score={78.5}
  riskLevel="MEDIUM"
  size="lg"
  showLabel={true}
/>
```

#### Verification Page

Access at `/dashboard/verify` - standalone verification tool for checking any text.

## Scoring System

### Safety Score (0-100)

**Higher is better** - indicates how safe the text is from AI detection.

Calculated from weighted factors:
- **35%** - Inverted average AI detection score
- **25%** - Inverted confidence-weighted detection score
- **20%** - Consensus between detectors
- **15%** - Detector coverage (number of successful detections)
- **5%** - Worst-case score (highest individual detection)

### Risk Levels

- **LOW** (80-100): Safe to use, text appears sufficiently human-like
- **MEDIUM** (50-79): Some AI signals present, consider re-humanizing
- **HIGH** (0-49): Strong AI detection signals, re-humanize recommended

### AI Detection Scores

Individual detector scores are **0-100, where higher means more AI-like**.

The safety score inverts these to provide an intuitive "higher is better" metric.

## External AI Detectors

### GPTZero
- **API:** https://gptzero.me/docs
- **Features:** Perplexity and burstiness analysis
- **Confidence:** High

### ZeroGPT
- **API:** https://zerogpt.com/api
- **Features:** Fake percentage detection
- **Confidence:** Medium-High

### Copyleaks
- **API:** https://api.copyleaks.com/documentation/v3/ai-content-detector
- **Features:** AI vs Human vs Mixed classification
- **Confidence:** High

### Winston AI
- **API:** https://docs.gowinston.ai/
- **Features:** Multi-language support, sentence-level analysis
- **Confidence:** Very High

## Error Handling

The module implements graceful degradation:

1. **No API keys configured:** Returns warning with safety_score=0
2. **Some detectors fail:** Uses successful detectors only
3. **All detectors fail:** Returns error with retry option
4. **Network timeout:** 30-second timeout per detector
5. **Rate limiting:** Handled by retry logic in backend service

## Best Practices

### 1. Pre-Export Verification

Always show the verification dialog before export:

```tsx
const handleExport = () => {
  setShowVerificationDialog(true);
};
```

### 2. Automatic Re-humanization

For HIGH risk results, automatically trigger re-humanization:

```tsx
onReHumanize={async () => {
  await rehumanizeText(text, { intensity: 1.5 });
  // Re-verify after humanization
  await verifyText(humanizedText);
}}
```

### 3. Verification History

Track user verification patterns:

```tsx
const stats = await getVerificationStats(userId);
// Track improvement over time
```

### 4. A/B Testing

Use verification to test humanization strategies:

```typescript
const results = await Promise.all([
  verifyText(humanizeMethod1(text)),
  verifyText(humanizeMethod2(text)),
  verifyText(humanizeMethod3(text))
]);

// Choose best method
const bestMethod = results.reduce((best, current) =>
  current.safety_score > best.safety_score ? current : best
);
```

## Monitoring and Analytics

### Key Metrics to Track

1. **Average Safety Score** - Overall system performance
2. **Risk Distribution** - % of LOW/MEDIUM/HIGH results
3. **Detector Success Rate** - Uptime of external services
4. **Re-humanization Rate** - % requiring additional humanization
5. **Export Conversion** - % proceeding despite warnings

### Database Queries

```typescript
// Average safety score by discipline
const avgScores = await prisma.verificationResult.groupBy({
  by: ['generation.discipline'],
  _avg: { safetyScore: true }
});

// High-risk generations
const highRisk = await prisma.verificationResult.findMany({
  where: { riskLevel: 'HIGH' },
  include: { generation: true }
});
```

## Testing

### AI Engine Tests

```bash
cd ai-engine
pytest tests/test_verification.py -v
```

### Backend API Tests

```bash
cd backend-api
npm test -- verification
```

### Integration Tests

```bash
# Test end-to-end verification flow
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"text": "Test text with at least 50 characters for verification..."}'
```

## Performance

- **Verification time:** 15-30 seconds (parallel detector calls)
- **Database storage:** ~2KB per verification result
- **API rate limits:** Respects external detector limits
- **Caching:** Consider implementing Redis cache for repeated verifications

## Future Enhancements

1. **Caching** - Cache results for identical text (Redis)
2. **Webhooks** - Async verification with callback URLs
3. **Custom Detectors** - Plugin system for additional detectors
4. **Batch Verification** - Verify multiple texts in one request
5. **Confidence Tuning** - Machine learning to improve confidence scores
6. **Detector Weights** - Configurable weights per detector
7. **Historical Analysis** - Trend detection over time
8. **Auto-Retry** - Automatic re-verification after humanization

## Troubleshooting

### No detectors configured

**Problem:** `"No AI detectors available - no API keys configured"`

**Solution:** Add at least one detector API key to `.env` file

### All detections failing

**Problem:** All detectors return `success: false`

**Solution:**
1. Check network connectivity
2. Verify API keys are valid
3. Check detector service status
4. Review rate limits

### Low consensus scores

**Problem:** Detectors disagree significantly

**Solution:**
1. Text may be borderline - re-humanize
2. Try with more detectors configured
3. Review individual detector details

## Support

For issues or questions:
1. Check logs in `ai-engine/logs/` and `backend-api/logs/`
2. Review detector API documentation
3. Test with `/api/verify/health` endpoint
4. Check database for stored results

## License

Part of HumanWriter AI system - proprietary software.

---

**Module Version:** 1.0.0
**Created:** 2024-01-19
**Last Updated:** 2024-01-19
