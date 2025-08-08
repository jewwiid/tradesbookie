# Find My Product – AI-Powered Recommendation Tool for Tracebook.ie

## Overview
This document provides step-by-step instructions to implement an **AI-powered product recommendation tool** for Tracebook.ie, designed for in-store customers in Ireland and the EU. The tool asks the user for a **product category**, a few **category-specific questions**, and then returns **live product recommendations** from Harvey Norman.

---

## User Flow
1. **Select Category** – User chooses from a list of product categories.
2. **Answer 3 Quick Questions** – Questions are dynamic based on the chosen category.
3. **AI Processes Answers** – LLM converts answers into a structured filter set.
4. **Live Product Lookup** – Server queries Harvey Norman’s product API or feed.
5. **Rank & Display Results** – Top 3 matching products shown with reasons and compare option.

---

## Architecture

### Frontend (React / Next.js)
- Stepper UI: **Category → Questions → Results**.
- State management for answers.
- Call backend API endpoint `/api/recommend` after questions.

### Backend (Node.js / Next.js API Routes)
- Endpoint `/api/recommend`:
  1. Validates category & answers.
  2. Sends data to LLM with **function-calling schema** to convert answers to filters.
  3. Queries **Harvey Norman live API** for matching products.
  4. Ranks results and returns top 3 matches with reasoning.

### Data Source
Choose one:
- **Official Harvey Norman API** (best for live prices & stock).
- Merchant feed synced from Harvey Norman (Google Merchant Center API).
- Harvey Norman sitemaps or public feeds + live availability check.

Avoid scraping where possible; if scraping is necessary, do it server-side with caching.

---

## Question Bank
Keep category questions in JSON for easy updates.

Example:
```json
{
  "categories": {
    "soundbar": {
      "questions": [
        {
          "id": "room_profile",
          "label": "Where will you use it?",
          "type": "single",
          "options": [
            {"id":"small_tv","label":"Small room / bedroom"},
            {"id":"living_tv","label":"Living room"},
            {"id":"open_plan","label":"Open-plan / large space"}
          ],
          "mapsTo": "roomSize"
        }
      ]
    }
  }
}
```

---

## LLM Function Schema
The AI should output filters in a strict format for the backend to query the catalog.

**System Prompt Example:**
> Convert customer answers into a ProductFilter JSON. Use EU terms (energy labels A–G). If unsure, pick defaults. Output only valid JSON.

**Example Output:**
```json
{
  "category": "soundbar",
  "must": {
    "price": { "lte": 600 },
    "attributes": {
      "connection": ["eARC", "ARC"],
      "roomSize": "living",
      "soundProfile": ["dialogue", "balanced"]
    }
  },
  "prefer": {
    "wirelessSub": 0.3,
    "heightUnder60mm": 0.2
  }
}
```

---

## Backend Example (`/api/recommend`)
```ts
async function searchHarveyNorman(filters) {
  // Build query from filters
  // Call live API
  // Rank products
  return [
    {
      sku: "SB-XYZ123",
      name: "Brand X 3.1 Soundbar",
      price: 499,
      energyLabel: null,
      availability: { inStock: true, stores: ["Carrickmines"], deliveryDays: 2 },
      url: "https://www.harveynorman.ie/...",
      image: "https://cdn..."
    }
  ];
}
```

---

## Ranking Logic
- Hard filters: Must-have criteria (price, connection type, load size).
- Soft filters: Preferences weighted by importance.
- Score products and return top matches.

---

## Example API Request
```http
POST /api/recommend
{
  "category": "dishwasher",
  "answers": {
    "size_install": "slimline_built_in",
    "noise": "very_quiet",
    "features": ["adjustable_racks","enhanced_drying"]
  },
  "maxBudgetEUR": 600,
  "store": "Carrickmines"
}
```

---

## Output to User
- **Top 3 products** with:
  - Name & image
  - Live price
  - Energy label (EU A–G)
  - Store availability
  - Delivery ETA
  - 2–3 bullet points explaining why it matches

---

## Compliance & UX
- Show EU energy labels clearly.
- GDPR: No personal data stored.
- Accessibility: Keyboard-friendly, ARIA roles, high contrast.
- Cache catalog for 5–10 minutes; always get live price/stock.
- Fallback: Show “Seen in stock today” if API fails.

---

## Next Steps
1. Set up category question JSON file.
2. Build React stepper UI for question flow.
3. Implement `/api/recommend` with LLM function-calling.
4. Integrate Harvey Norman product feed/API.
5. Test with real in-store scenarios.
