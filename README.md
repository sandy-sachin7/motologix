# 🏍️ Motologix

> **AI assists. Math decides. Humans approve.**

An AI-powered, explainable motorcycle decision system that helps riders and families make rational, data-backed motorcycle choices through transparent scoring and AI-assisted explanations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

---

## 🎯 What is Motologix?

Unlike static motorcycle comparison websites, Motologix combines **deterministic scoring** with **controlled AI reasoning** to produce recommendations that are:

- ✅ **Transparent** - Every score is auditable with clear formulas
- ✅ **Explainable** - Plain-language explanations for non-enthusiasts
- ✅ **Adaptable** - Works with any motorcycle via real-time AI discovery
- ✅ **Balanced** - Weighs safety, comfort, enjoyment, and practicality

This system is built for **long-term ownership decisions**, not impulse purchases.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOTOLOGIX                                │
├─────────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER (Next.js App Router)                        │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ Bike      │ │ Weight    │ │ Results   │ │ Explain   │       │
│  │ Search    │ │ Config    │ │ Dashboard │ │ View      │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  AGENT LAYER                                                     │
│  BikeDiscovery → DataNormalization → ScoringEngine → AIReasoning│
├─────────────────────────────────────────────────────────────────┤
│  CORE ENGINE (Deterministic - No AI)                            │
│  ScoringEngine (Math Only) │ Normalizer (Rules) │ Validator     │
├─────────────────────────────────────────────────────────────────┤
│  AI LAYER (Gemini API - Labeled & Constrained)                  │
│  BikeDiscovery │ SpecExtraction │ ExplanationGenerator          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **AI assists** - Gemini helps discover bikes and generate explanations
2. **Math decides** - All scoring is deterministic with explicit formulas
3. **Humans approve** - Every recommendation is explainable to parents/non-enthusiasts

---

## 📊 Evaluation Factors

Each motorcycle is scored on a **1-10 scale** for these factors:

| Factor | Default Weight | Category |
|--------|---------------|----------|
| Daily Traffic Ease | 12% | Practicality |
| Braking & Safety Confidence | 15% | Safety |
| Pillion Comfort | 15% | Comfort |
| Highway Stability | 10% | Safety |
| Rider Comfort | 10% | Comfort |
| Suspension Compliance | 10% | Comfort |
| Fun & Engagement | 8% | Enjoyment |
| Heat Management | 5% | Practicality |
| Ownership Practicality | 8% | Practicality |
| Long-Term Suitability | 7% | Practicality |

**Total: 100%** (weights are fully customizable)

### Scoring Formula

```
Final Score = Σ(Factor Score × Factor Weight) × 10
```

All scores are normalized to a **0-100 scale** and fully auditable.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ or 22+
- npm or yarn
- Gemini API key ([get one here](https://aistudio.google.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/sandy-sachin7/motologix.git
cd motologix

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for bike discovery and explanations | Yes |

---

## 📁 Project Structure

```
motologix/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Main UI
│   │   ├── layout.tsx          # Root layout
│   │   └── api/                # API routes
│   │       └── discover/       # Gemini discovery endpoint
│   │
│   ├── components/             # UI Components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   └── motologix/          # App-specific components
│   │
│   ├── agents/                 # Agent Implementations
│   │   ├── discovery.ts        # Bike discovery via Gemini
│   │   ├── normalization.ts    # Spec → factor scores
│   │   ├── scoring.ts          # Weighted scoring
│   │   ├── reasoning.ts        # AI explanations
│   │   └── sanity.ts           # Validation
│   │
│   ├── engine/                 # Core Deterministic Logic
│   │   ├── scoring.ts          # Pure math scoring
│   │   ├── normalizer.ts       # Normalization rules
│   │   └── validator.ts        # Sanity checks
│   │
│   ├── lib/                    # Utilities
│   │   ├── gemini.ts           # Gemini API client
│   │   └── utils.ts            # Helpers
│   │
│   ├── store/                  # State Management
│   │   └── app-store.ts        # Zustand store
│   │
│   └── types/                  # TypeScript Interfaces
│       └── index.ts            # All type definitions
│
├── .env.example                # Environment template
├── .env.local                  # Local environment (gitignored)
└── package.json
```

---

## 🤖 AI Usage Constraints

### AI is allowed to:
- ✅ Aggregate and summarize reviews
- ✅ Infer qualitative comfort and stability trends
- ✅ Generate explanations and comparisons
- ✅ State uncertainty clearly

### AI is NOT allowed to:
- ❌ Invent specifications
- ❌ Override deterministic scoring
- ❌ Hide confidence levels
- ❌ Produce hype-driven language

**Every AI-generated insight includes a confidence label** (High/Medium/Low).

---

## 🎨 UI Features

- **Dynamic Bike Search** - Real-time discovery via Gemini
- **Weight Sliders** - Customize factor importance
- **Pillion Toggle** - Switch between primary/secondary pillion modes
- **Radar Charts** - Visual factor comparison
- **Score Breakdown** - Detailed per-bike analysis
- **"Why this bike?"** - Plain-language explanations
- **Parent Mode** - Simplified explanations for non-enthusiasts
- **PDF Export** - Downloadable comparison reports

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📝 How It Works

### 1. Enter Bike Names
Type one or more motorcycle names (e.g., "KTM Duke 390", "Royal Enfield Himalayan").

### 2. Gemini Discovery
The system uses Gemini Search to find real specifications:
- Engine, power, torque, weight
- Braking hardware and ABS type
- Suspension configuration
- Dimensions and ergonomics

### 3. Normalization
Raw specs are converted to human-relevant factor scores using deterministic rules:
- Weight + wheelbase → low-speed handling score
- Brake hardware + tyre size → braking confidence score
- Seat height + suspension → pillion comfort score

### 4. Scoring
Mathematical scoring using your custom weights:
```
finalScore = Σ(factorScore × factorWeight) × 10
```

### 5. AI Explanation
Gemini generates plain-language explanations:
- Why this bike scored higher
- What compromises exist
- Parent-friendly summary

---

## 🎯 Target User Profile

**Primary User:** Sandy, Bangalore
- **Daily Usage:** ~15 km in heavy traffic
- **Highway Usage:** Regular (Bangalore–Ooty, Chennai, Hyderabad, Goa)
- **Max Round Trip:** 1000+ km
- **Ownership Horizon:** 9+ years
- **Riding Style:** Smooth, assertive, control-focused

**Pillion Considerations:**
- Primary: Peer/girlfriend (comfort important)
- Secondary: Parents (stability and safety perception critical)

---

## 🛣️ Roadmap

- [x] Project setup with Next.js 14
- [x] TypeScript types and interfaces
- [ ] Core scoring engine
- [ ] Gemini API integration
- [ ] State management (Zustand)
- [ ] UI components
- [ ] Charts and visualizations
- [ ] AI explanations with Parent Mode
- [ ] PDF export
- [ ] Vercel deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow the atomic commit pattern:

```bash
git commit -m "feat(component): description of change"
```

Commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Gemini API** - For AI-powered bike discovery and explanations
- **shadcn/ui** - For beautiful, accessible UI components
- **Recharts** - For radar charts and visualizations
- **bikewale.com** - Reference source for Indian motorcycle data

---

<p align="center">
  <strong>AI assists. Math decides. Humans approve.</strong>
</p>
