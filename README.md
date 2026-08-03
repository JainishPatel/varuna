# Varuna

Varuna is a web application for visualizing crop water requirements and groundwater sustainability across Gujarat's districts. It allows users to simulate crop allocation scenarios and see their impact on water levels and farmer income.

## Features

- **Interactive Map:** District-level visualization of groundwater depth and crop distribution.
- **Scenario Simulator:** Adjust crop areas (Cotton, Groundnut, Wheat, Pearl Millet) to calculate net water demand and economic yield.
- **Pareto Optimizer:** Quick optimization sweeps across crop combinations.
- **Data Explorer:** View underlying historical groundwater and agricultural datasets.

## Getting Started

### Prerequisites
- Node.js (v18+)

### Installation & Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

## Data & Scripts

Raw and processed datasets are located in `dataset/` and `src/data/`.

If you want to re-run the data processing or ML model training scripts (requires Python 3):

```bash
pip install pandas numpy scikit-learn
python scripts/process_data.py
python scripts/train_models.py
```
