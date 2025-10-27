#!/bin/bash
# Enhanced ML Environment Setup Script

echo "🚀 Setting up Enhanced ML Development Environment for HomeoERP..."

# 1. Install additional ML libraries
pip install tensorflow==2.15.0
pip install xgboost==2.0.2
pip install lightgbm==4.1.0
pip install catboost==1.2
pip install mlflow==2.8.1
pip install optuna==3.5.0  # Hyperparameter optimization
pip install shap==0.44.0   # Model explainability
pip install streamlit==1.28.1  # ML dashboard

# 2. Set up Jupyter environment
pip install jupyterlab==4.0.8
pip install jupyterlab-widgets
pip install ipywidgets

# 3. Create ML project structure
mkdir -p services/ai-service/notebooks
mkdir -p services/ai-service/models
mkdir -p services/ai-service/data
mkdir -p services/ai-service/pipelines

echo "✅ Enhanced ML environment setup complete!"
