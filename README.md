# E-Invoicing Readiness & Gap Analyzer

A full-stack web application that analyzes invoice data against the GETS v0.1 standard and provides actionable insights for e-invoicing readiness.

## Features

### Core Functionality (P0)

- **3-step wizard**: Context → Upload → Results
- **Data upload**: Supports CSV and JSON files (up to 5MB, first 200 rows analyzed)
- **Field mapping**: Intelligent field detection with similarity matching
- **Rule validation**: 5 comprehensive checks (totals balance, line math, date format, currency, TRN presence)
- **Scoring system**: Weighted scoring across 4 categories (Data 25%, Coverage 35%, Rules 30%, Posture 10%)
- **Persistent storage**: SQLite database with 7-day report retention
- **Export & sharing**: JSON download and shareable report URLs

### Technical Implementation

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and React components
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: SQLite for development (easily configurable for production databases)
- **File processing**: Support for CSV (Papa Parse) and JSON formats
- **Analysis engine**: Custom field mapping and rule validation logic

## API Endpoints

### `POST /api/upload`

Upload invoice data via file or JSON payload.

**Multipart form:**

```bash
curl -X POST -F "file=@sample_clean.json" http://localhost:3000/api/upload
```

**JSON payload:**

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"<CSV or JSON string>","country":"AE","erp":"SAP"}' \
  http://localhost:3000/api/upload
```

**Response:**

```json
{ "uploadId": "u_xxx" }
```

### `POST /api/analyze`

Analyze uploaded data with questionnaire responses.

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"uploadId":"u_xxx","questionnaire":{"webhooks":true,"sandbox_env":true,"retries":false}}' \
  http://localhost:3000/api/analyze
```

### `GET /api/report/:reportId`

Retrieve a saved report by ID.

```bash
curl http://localhost:3000/api/report/r_xxx
```

### `GET /api/reports?limit=10`

Get recent reports list.

## Scoring Methodology

The overall readiness score is calculated using weighted averages:

- **Data Quality (25%)**: Percentage of successfully parsed fields with valid types
- **Field Coverage (35%)**: Matched required GETS fields (header/seller/buyer weighted higher than lines)
- **Rule Compliance (30%)**: Equally weighted across 5 validation rules
- **Technical Posture (10%)**: Based on questionnaire responses (webhooks, sandbox, retries)

**Readiness Labels:**

- High: 80-100%
- Medium: 60-79%
- Low: 0-59%

## Rule Validation Details

1. **TOTALS_BALANCE**: `total_excl_vat + vat_amount == total_incl_vat` (±0.01 tolerance)
2. **LINE_MATH**: `line_total == qty * unit_price` (±0.01 tolerance)
3. **DATE_ISO**: Invoice issue date matches `YYYY-MM-DD` format
4. **CURRENCY_ALLOWED**: Currency is one of [AED, SAR, MYR, USD]
5. **TRN_PRESENT**: Both buyer and seller TRN fields are non-empty

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up database:**

```bash
npx prisma generate
npx prisma db push
```

3. **Start development server:**

```bash
npm run dev
```

4. **Open browser:**
   Navigate to `http://localhost:3000`

### Testing with Sample Data

The application includes two test files:

- `public/sample_clean.json` - Should pass most validation rules
- `public/sample_flawed.csv` - Contains intentional errors (invalid currency, date, line math)

## Database Configuration

**Development:** Uses SQLite (`prisma/dev.db`)

**Production:** Update `DATABASE_URL` in `.env` for your preferred database:

- PostgreSQL: `postgresql://user:password@localhost:5432/dbname`
- MySQL: `mysql://user:password@localhost:3306/dbname`
- MongoDB: `mongodb://localhost:27017/dbname`

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── report/        # Report viewing pages
│   └── page.tsx       # Main wizard interface
├── components/
│   ├── ui/            # Reusable UI components
│   └── wizard/        # Wizard step components
└── lib/
    ├── field-mapper.ts    # Field mapping logic
    ├── rule-validator.ts  # Rule validation engine
    ├── scoring.ts         # Scoring algorithms
    └── gets-schema.ts     # GETS schema definition
```

## Performance

- Analysis completes in <5 seconds for provided samples
- Processes up to 200 rows per upload
- Reports cached in database for 7 days
- Optimized field mapping with similarity algorithms

## License

Built for GETS v0.1 compliance assessment.
