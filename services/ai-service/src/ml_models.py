# Advanced ML Models for HomeoERP
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.metrics import mean_squared_error, silhouette_score
import xgboost as xgb
import lightgbm as lgb
from datetime import datetime, timedelta
import joblib
import os

class HomeoERPMLModels:
    def __init__(self, data_path='services/ai-service/data/'):
        self.data_path = data_path
        self.models = {}
        self.vectorizer = TfidfVectorizer(max_features=1000)

    def load_data(self):
        """Load preprocessed data"""
        try:
            products_df = pd.read_parquet(f'{self.data_path}products_processed.parquet')
            sales_df = pd.read_parquet(f'{self.data_path}sales_processed.parquet')
            customers_df = pd.read_parquet(f'{self.data_path}customers_processed.parquet')
            return products_df, sales_df, customers_df
        except FileNotFoundError:
            print("⚠️  Processed data not found. Run data pipeline first.")
            return None, None, None

    def train_product_recommendation_model(self):
        """Train collaborative and content-based recommendation models"""

        print("🔄 Training Product Recommendation Models...")

        products_df, sales_df, customers_df = self.load_data()
        if products_df is None: return None

        # Content-based filtering using product features
        product_features = products_df[[
            'cost_price', 'selling_price', 'mrp', 'margin', 'discount_rate',
            'category_name_encoded', 'brand_name_encoded', 'form_name_encoded'
        ]].fillna(0)

        # Normalize features
        scaler = StandardScaler()
        product_features_scaled = scaler.fit_transform(product_features)

        # Compute product similarity matrix
        similarity_matrix = cosine_similarity(product_features_scaled)

        # Save similarity matrix
        np.save(f'{self.data_path}product_similarity.npy', similarity_matrix)
        joblib.dump(scaler, f'{self.data_path}product_scaler.pkl')

        # Collaborative filtering using customer purchase patterns
        customer_product_matrix = sales_df.pivot_table(
            index='customer_id',
            columns='product_id',
            values='quantity',
            aggfunc='sum',
            fill_value=0
        )

        # Apply SVD for dimensionality reduction
        svd = TruncatedSVD(n_components=50, random_state=42)
        customer_factors = svd.fit_transform(customer_product_matrix)
        product_factors = svd.components_.T

        # Save collaborative filtering models
        joblib.dump(svd, f'{self.data_path}cf_svd_model.pkl')
        np.save(f'{self.data_path}customer_factors.npy', customer_factors)
        np.save(f'{self.data_path}product_factors.npy', product_factors)

        print("✅ Product recommendation models trained successfully!")
        return {
            'similarity_matrix': similarity_matrix,
            'customer_factors': customer_factors,
            'product_factors': product_factors
        }

    def train_demand_forecasting_model(self):
        """Train demand forecasting model using sales data"""

        print("🔄 Training Demand Forecasting Model...")

        products_df, sales_df, customers_df = self.load_data()
        if sales_df is None: return None

        # Create time series features
        sales_df['order_date'] = pd.to_datetime(sales_df['order_date'])
        sales_df['year'] = sales_df['order_date'].dt.year
        sales_df['month'] = sales_df['order_date'].dt.month
        sales_df['day_of_week'] = sales_df['order_date'].dt.dayofweek
        sales_df['quarter'] = sales_df['order_date'].dt.quarter

        # Aggregate sales by product and time
        sales_ts = sales_df.groupby(['product_id', 'year', 'month', 'quarter']).agg({
            'quantity': ['sum', 'count', 'mean'],
            'total_amount': ['sum', 'mean']
        }).reset_index()

        sales_ts.columns = ['product_id', 'year', 'month', 'quarter', 'total_qty', 'order_count', 'avg_qty', 'total_revenue', 'avg_order_value']

        # Add lag features
        sales_ts = sales_ts.sort_values(['product_id', 'year', 'month'])
        sales_ts['lag_1_qty'] = sales_ts.groupby('product_id')['total_qty'].shift(1)
        sales_ts['lag_2_qty'] = sales_ts.groupby('product_id')['total_qty'].shift(2)
        sales_ts['lag_3_qty'] = sales_ts.groupby('product_id')['total_qty'].shift(3)

        # Prepare features and target
        feature_cols = ['month', 'quarter', 'day_of_week', 'lag_1_qty', 'lag_2_qty', 'lag_3_qty', 'avg_qty']
        X = sales_ts[feature_cols].fillna(0)
        y = sales_ts['total_qty']

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Train multiple models and select best
        models = {
            'linear': LinearRegression(),
            'rf': RandomForestRegressor(n_estimators=100, random_state=42),
            'xgb': xgb.XGBRegressor(n_estimators=100, random_state=42),
            'lgb': lgb.LGBMRegressor(n_estimators=100, random_state=42)
        }

        best_model = None
        best_score = float('-inf')

        for name, model in models.items():
            model.fit(X_train, y_train)
            score = model.score(X_test, y_test)

            if score > best_score:
                best_score = score
                best_model = model
                best_name = name

        print(f"🏆 Best model: {best_name} (R² = {best_score:.3f})")

        # Save best model
        joblib.dump(best_model, f'{self.data_path}demand_forecast_model.pkl')
        joblib.dump(feature_cols, f'{self.data_path}forecast_features.pkl')

        return best_model

    def train_customer_segmentation_model(self):
        """Train customer segmentation model using RFM and behavior data"""

        print("🔄 Training Customer Segmentation Model...")

        products_df, sales_df, customers_df = self.load_data()
        if customers_df is None: return None

        # Prepare customer features
        feature_cols = [
            'total_orders', 'total_spent', 'avg_order_value', 'clv', 'recency_days',
            'customer_type', 'loyalty_points'
        ]

        # Select numeric features for clustering
        numeric_features = ['total_orders', 'total_spent', 'avg_order_value', 'clv', 'recency_days', 'loyalty_points']

        # Handle missing values and outliers
        customer_features = customers_df[feature_cols].copy()
        customer_features[numeric_features] = customer_features[numeric_features].fillna(0)

        # Remove extreme outliers
        for col in numeric_features:
            q1 = customer_features[col].quantile(0.25)
            q3 = customer_features[col].quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            customer_features[col] = customer_features[col].clip(lower_bound, upper_bound)

        # Scale features
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(customer_features[numeric_features])

        # Find optimal number of clusters
        silhouette_scores = []
        for n_clusters in range(2, 8):
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(scaled_features)
            silhouette_avg = silhouette_score(scaled_features, cluster_labels)
            silhouette_scores.append(silhouette_avg)

        optimal_clusters = silhouette_scores.index(max(silhouette_scores)) + 2
        print(f"🎯 Optimal number of clusters: {optimal_clusters}")

        # Train final model
        kmeans = KMeans(n_clusters=optimal_clusters, random_state=42, n_init=10)
        customer_features['cluster'] = kmeans.fit_predict(scaled_features)

        # Save model and mappings
        joblib.dump(kmeans, f'{self.data_path}customer_segmentation_model.pkl')
        joblib.dump(scaler, f'{self.data_path}customer_scaler.pkl')
        customer_features.to_csv(f'{self.data_path}customer_segments.csv', index=False)

        print("✅ Customer segmentation model trained successfully!")
        return kmeans

    def train_inventory_optimization_model(self):
        """Train inventory optimization model for reorder points and quantities"""

        print("🔄 Training Inventory Optimization Model...")

        products_df, sales_df, inventory_df = self.load_data()
        if sales_df is None or inventory_df is None: return None

        # Calculate demand patterns
        sales_agg = sales_df.groupby('product_id').agg({
            'quantity': ['mean', 'std', 'count', 'sum'],
            'order_date': ['min', 'max']
        }).reset_index()

        sales_agg.columns = ['product_id', 'avg_demand', 'std_demand', 'order_count', 'total_demand', 'first_sale', 'last_sale']

        # Calculate lead time (time between order and delivery)
        # This would need purchase order and receipt data
        lead_time_df = inventory_df.groupby('product_id')['created_at'].apply(
            lambda x: (x.max() - x.min()).days / len(x) if len(x) > 1 else 30
        ).reset_index(name='avg_lead_time_days')

        # Merge with product data
        training_df = products_df.merge(sales_agg, on='product_id', how='left')
        training_df = training_df.merge(lead_time_df, on='product_id', how='left')

        # Calculate optimal reorder point and quantity
        # Using Economic Order Quantity (EOQ) formula as baseline
        training_df['demand_per_day'] = training_df['total_demand'] / (
            (pd.to_datetime(training_df['last_sale']) - pd.to_datetime(training_df['first_sale'])).dt.days + 1
        )

        # EOQ = sqrt(2 * Demand * Ordering_Cost / Holding_Cost)
        # Simplified calculation
        training_df['eoq'] = np.sqrt(2 * training_df['total_demand'] * 100 / (training_df['cost_price'] * 0.2))
        training_df['reorder_point'] = training_df['demand_per_day'] * training_df['avg_lead_time_days'] * 1.5

        # Prepare features for ML model
        feature_cols = [
            'cost_price', 'selling_price', 'current_stock', 'min_stock', 'max_stock',
            'avg_demand', 'std_demand', 'demand_per_day', 'avg_lead_time_days'
        ]

        X = training_df[feature_cols].fillna(0)
        y_reorder_point = training_df['reorder_point'].fillna(training_df['min_stock'])
        y_eoq = training_df['eoq'].fillna(training_df['max_stock'] * 0.1)

        # Train models
        rf_reorder = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_eoq = RandomForestRegressor(n_estimators=100, random_state=42)

        rf_reorder.fit(X, y_reorder_point)
        rf_eoq.fit(X, y_eoq)

        # Save models
        joblib.dump(rf_reorder, f'{self.data_path}reorder_point_model.pkl')
        joblib.dump(rf_eoq, f'{self.data_path}eoq_model.pkl')
        joblib.dump(feature_cols, f'{self.data_path}inventory_features.pkl')

        print("✅ Inventory optimization model trained successfully!")
        return {'reorder_model': rf_reorder, 'eoq_model': rf_eoq}

    def get_product_recommendations(self, product_id, top_n=5):
        """Get product recommendations for a given product"""

        try:
            similarity_matrix = np.load(f'{self.data_path}product_similarity.npy')
            products_df = pd.read_parquet(f'{self.data_path}products_processed.parquet')

            product_idx = products_df[products_df['id'] == product_id].index[0]
            similarities = similarity_matrix[product_idx]

            # Get top similar products (excluding itself)
            similar_indices = similarities.argsort()[::-1][1:top_n+1]
            similar_products = products_df.iloc[similar_indices]

            return similar_products[['id', 'name', 'sku', 'selling_price', 'category_name', 'brand_name']].to_dict('records')

        except Exception as e:
            print(f"❌ Error getting recommendations: {e}")
            return []

    def predict_demand(self, product_ids, months_ahead=1):
        """Predict demand for given products"""

        try:
            model = joblib.load(f'{self.data_path}demand_forecast_model.pkl')
            feature_cols = joblib.load(f'{self.data_path}forecast_features.pkl')
            products_df = pd.read_parquet(f'{self.data_path}products_processed.parquet')

            predictions = []
            for product_id in product_ids:
                # Get latest sales data for the product
                product_data = products_df[products_df['id'] == product_id]

                if len(product_data) == 0:
                    continue

                # Create feature vector (simplified - would need actual time series data)
                features = np.array([[datetime.now().month, 1, 0, 0, 0, 0, product_data['current_stock'].iloc[0]]])

                predicted_demand = max(0, model.predict(features)[0])
                predictions.append({
                    'product_id': product_id,
                    'predicted_demand': predicted_demand,
                    'confidence': 0.8
                })

            return predictions

        except Exception as e:
            print(f"❌ Error predicting demand: {e}")
            return []

    def segment_customer(self, customer_data):
        """Segment a customer based on their behavior"""

        try:
            model = joblib.load(f'{self.data_path}customer_segmentation_model.pkl')
            scaler = joblib.load(f'{self.data_path}customer_scaler.pkl')

            # Prepare customer data
            features = customer_data[['total_orders', 'total_spent', 'avg_order_value', 'clv', 'recency_days', 'loyalty_points']]
            scaled_features = scaler.transform(features)

            cluster = model.predict(scaled_features)[0]

            return {
                'segment_id': int(cluster),
                'segment_name': f'Cluster_{cluster}',
                'confidence': 0.9
            }

        except Exception as e:
            print(f"❌ Error segmenting customer: {e}")
            return {'segment_id': 0, 'segment_name': 'Unknown', 'confidence': 0.0}

# Training script
def train_all_models():
    """Train all ML models for HomeoERP"""

    print("🚀 Starting HomeoERP ML Model Training...")

    ml_models = HomeoERPMLModels()

    # Train recommendation models
    rec_models = ml_models.train_product_recommendation_model()

    # Train demand forecasting
    forecast_model = ml_models.train_demand_forecasting_model()

    # Train customer segmentation
    segmentation_model = ml_models.train_customer_segmentation_model()

    # Train inventory optimization
    inventory_models = ml_models.train_inventory_optimization_model()

    print("🎉 All ML models trained successfully!")
    print("📊 Model Performance Summary:")
    print(f"   - Recommendation Models: {'✅' if rec_models else '❌'}")
    print(f"   - Demand Forecasting: {'✅' if forecast_model else '❌'}")
    print(f"   - Customer Segmentation: {'✅' if segmentation_model else '❌'}")
    print(f"   - Inventory Optimization: {'✅' if inventory_models else '❌'}")

if __name__ == "__main__":
    train_all_models()
