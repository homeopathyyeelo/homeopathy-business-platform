# HomeoERP Data Preparation Pipeline
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import json
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler, LabelEncoder
import warnings
import os
import random
warnings.filterwarnings('ignore')

class HomeoERPDataPipeline:
    def __init__(self, database_url):
        self.engine = create_engine(database_url)
        self.scaler = StandardScaler()
        self.label_encoders = {}

    def extract_business_data(self):
        """Extract all relevant data for ML training"""

        # 1. Product data with embeddings
        products_df = pd.read_sql("""
            SELECT p.*,
                   c.name as category_name,
                   b.name as brand_name,
                   pot.name as potency_name,
                   f.name as form_name,
                   u.name as unit_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN potencies pot ON p.potency_id = pot.id
            LEFT JOIN forms f ON p.form_id = f.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE p.is_active = true
        """, self.engine)

        # 2. Sales transaction data
        sales_df = pd.read_sql("""
            SELECT soi.*,
                   so.order_number, so.order_date, so.customer_id,
                   p.name as product_name, p.sku,
                   c.name as customer_name, c.customer_type
            FROM sales_order_items soi
            JOIN sales_orders so ON soi.sales_order_id = so.id
            JOIN products p ON soi.product_id = p.id
            LEFT JOIN customers c ON so.customer_id = c.id
            WHERE so.status = 'delivered'
            AND so.order_date >= NOW() - INTERVAL '2 years'
        """, self.engine)

        # 3. Customer purchase patterns
        customer_patterns = pd.read_sql("""
            SELECT c.*,
                   COUNT(DISTINCT so.id) as total_orders,
                   SUM(so.total_amount) as total_spent,
                   AVG(so.total_amount) as avg_order_value,
                   MAX(so.order_date) as last_purchase_date,
                   MIN(so.order_date) as first_purchase_date
            FROM customers c
            LEFT JOIN sales_orders so ON c.id = so.customer_id
            WHERE so.order_date >= NOW() - INTERVAL '2 years'
            GROUP BY c.id
        """, self.engine)

        # 4. Inventory movement data
        inventory_df = pd.read_sql("""
            SELECT ib.*,
                   p.name as product_name, p.sku,
                   v.name as vendor_name
            FROM inventory_batches ib
            JOIN products p ON ib.product_id = p.id
            LEFT JOIN vendors v ON ib.supplier_id = v.id
            WHERE ib.created_at >= NOW() - INTERVAL '2 years'
        """, self.engine)

        return {
            'products': products_df,
            'sales': sales_df,
            'customers': customer_patterns,
            'inventory': inventory_df
        }

    def create_product_features(self, products_df):
        """Create ML features for products"""

        # Text features for product similarity
        products_df['combined_text'] = (
            products_df['name'].fillna('') + ' ' +
            products_df['description'].fillna('') + ' ' +
            products_df['category_name'].fillna('') + ' ' +
            products_df['brand_name'].fillna('') + ' ' +
            products_df['potency_name'].fillna('') + ' ' +
            products_df['form_name'].fillna('')
        )

        # Numeric features
        feature_cols = [
            'cost_price', 'selling_price', 'mrp', 'current_stock',
            'reorder_level', 'min_stock', 'max_stock'
        ]

        # Handle missing values
        for col in feature_cols:
            products_df[col] = products_df[col].fillna(0)

        # Create price features
        products_df['margin'] = (products_df['selling_price'] - products_df['cost_price']) / products_df['cost_price']
        products_df['discount_rate'] = (products_df['mrp'] - products_df['selling_price']) / products_df['mrp']
        products_df['stock_ratio'] = products_df['current_stock'] / products_df['max_stock']

        # Encode categorical features
        categorical_cols = ['category_name', 'brand_name', 'form_name', 'potency_name']
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                products_df[col + '_encoded'] = self.label_encoders[col].fit_transform(
                    products_df[col].fillna('Unknown')
                )
            else:
                products_df[col + '_encoded'] = self.label_encoders[col].transform(
                    products_df[col].fillna('Unknown')
                )

        return products_df

    def create_customer_features(self, customers_df, sales_df):
        """Create customer behavior features"""

        # Recency, Frequency, Monetary (RFM) analysis
        customers_df['recency_days'] = (datetime.now() - pd.to_datetime(customers_df['last_purchase_date'])).dt.days
        customers_df['frequency_score'] = pd.qcut(customers_df['total_orders'].rank(method='first'), 5, labels=[1,2,3,4,5])
        customers_df['monetary_score'] = pd.qcut(customers_df['total_spent'].rank(method='first'), 5, labels=[1,2,3,4,5])

        # Customer lifetime value
        customers_df['customer_lifetime_days'] = (
            pd.to_datetime(customers_df['last_purchase_date']) -
            pd.to_datetime(customers_df['first_purchase_date'])
        ).dt.days
        customers_df['clv'] = customers_df['total_spent'] / (customers_df['customer_lifetime_days'] / 30)

        # Purchase patterns by product category
        category_pivot = sales_df.pivot_table(
            index='customer_id',
            columns='product_category',
            values='quantity',
            aggfunc='sum',
            fill_value=0
        )

        customers_df = customers_df.merge(category_pivot, left_on='id', right_index=True, how='left')

        return customers_df

    def create_mock_product_features(self):
        """Create features for mock product data"""
        mock_data = self.create_mock_data()
        return self.create_product_features(mock_data['products'])

    def create_mock_customer_features(self):
        """Create features for mock customer data"""
        mock_data = self.create_mock_data()
        return self.create_customer_features(mock_data['customers'], mock_data['sales'])

    def prepare_training_data(self):
        """Main pipeline to prepare all training data"""

        print("🔄 Extracting business data...")

        try:
            data = self.extract_business_data()
            print("✅ Real data extracted successfully!")
        except Exception as e:
            print(f"⚠️  Real data extraction failed: {e}")
            print("🔄 Creating mock data for development...")
            data = self.create_mock_data()

        print("🔄 Creating product features...")
        if 'products' in data and not data['products'].empty:
            data['products'] = self.create_product_features(data['products'])
        else:
            data['products'] = self.create_mock_product_features()

        print("🔄 Creating customer features...")
        if 'customers' in data and not data['customers'].empty:
            data['customers'] = self.create_customer_features(data['customers'], data.get('sales', pd.DataFrame()))
        else:
            data['customers'] = self.create_mock_customer_features()

        # Save processed data
        os.makedirs('data', exist_ok=True)
        for name, df in data.items():
            if not df.empty:
                df.to_csv(f'data/{name}_processed.csv', index=False)
                df.to_parquet(f'data/{name}_processed.parquet')
                print(f"💾 Saved {name}: {len(df)} records")

        print("✅ Data preparation complete!")
        return data

    def create_mock_data(self):
        """Create realistic mock data for development"""

        print("🔄 Generating mock homeopathy business data...")

        # Mock products data
        products_data = {
            'id': [f'prod_{i}' for i in range(1, 51)],
            'sku': [f'SBL-ARN-{i}C' for i in range(30, 80, 1)][:50],
            'name': [
                'Arnica Montana 30C', 'Arnica Montana 200C', 'Belladonna 30C', 'Belladonna 200C',
                'Nux Vomica 30C', 'Nux Vomica 1M', 'Rhus Toxicodendron 30C', 'Rhus Toxicodendron 200C',
                'Sulphur 30C', 'Sulphur 200C', 'Calcarea Carbonica 30C', 'Calcarea Carbonica 200C',
                'Lycopodium 30C', 'Lycopodium 200C', 'Natrum Mur 30C', 'Natrum Mur 200C',
                'Pulsatilla 30C', 'Pulsatilla 200C', 'Sepia 30C', 'Sepia 200C',
                'Arsenicum Album 30C', 'Arsenicum Album 200C', 'Bryonia 30C', 'Bryonia 200C',
                'Gelsemium 30C', 'Gelsemium 200C', 'Ignatia 30C', 'Ignatia 200C',
                'Staphysagria 30C', 'Staphysagria 200C', 'Thuja 30C', 'Thuja 200C',
                'Silicea 30C', 'Silicea 200C', 'Phosphorus 30C', 'Phosphorus 200C',
                'Mercurius 30C', 'Mercurius 200C', 'Hepar Sulph 30C', 'Hepar Sulph 200C',
                'Allium Cepa 30C', 'Allium Cepa 200C', 'Euphrasia 30C', 'Euphrasia 200C',
                'Kali Bich 30C', 'Kali Bich 200C', 'Ruta 30C', 'Ruta 200C',
                'Rhus Ven 30C', 'Rhus Ven 200C'
            ],
            'category_id': ['cat_dilutions'] * 50,
            'brand_id': ['brand_sbl'] * 50,
            'potency_id': ['pot_30c', 'pot_200c'] * 25,
            'form_id': ['form_liquid'] * 50,
            'unit_id': ['unit_bottle'] * 50,
            'cost_price': [45, 50, 42, 48, 44, 52, 46, 51, 43, 49] * 5,
            'selling_price': [85, 95, 82, 92, 84, 94, 86, 96, 83, 93] * 5,
            'mrp': [100, 110, 98, 108, 99, 109, 101, 111, 97, 107] * 5,
            'current_stock': [150, 120, 180, 110, 160, 100, 140, 130, 170, 115] * 5,
            'reorder_level': [20] * 50,
            'min_stock': [10] * 50,
            'max_stock': [200] * 50,
            'description': [
                'For injuries and trauma', 'For high potency injuries', 'For fever and inflammation',
                'For high potency fever', 'For digestive issues', 'For chronic digestive problems',
                'For joint pain and stiffness', 'For chronic joint issues', 'For skin conditions',
                'For chronic skin problems'
            ] * 5
        }

        products_df = pd.DataFrame(products_data)

        # Add category and brand names
        products_df['category_name'] = 'Dilutions'
        products_df['brand_name'] = 'SBL'
        products_df['potency_name'] = ['30C', '200C'] * 25
        products_df['form_name'] = 'Liquid Dilution'
        products_df['unit_name'] = 'Bottle'

        # Mock sales data
        sales_data = []
        for i in range(1000):
            sales_data.append({
                'id': f'sale_{i}',
                'product_id': np.random.choice(products_df['id']),
                'customer_id': f'cust_{np.random.randint(1, 101)}',
                'quantity': np.random.randint(1, 5),
                'unit_price': np.random.choice([85, 95, 82, 92, 84, 94, 86, 96, 83, 93]),
                'total_amount': 0,  # Will calculate
                'order_date': (datetime.now() - timedelta(days=np.random.randint(0, 365))).strftime('%Y-%m-%d'),
                'order_number': f'ORD-{1000+i}',
                'status': 'delivered',
                'product_name': '',
                'sku': '',
                'customer_name': f'Customer {np.random.randint(1, 101)}',
                'customer_type': np.random.choice(['retail', 'wholesale', 'doctor'], p=[0.7, 0.2, 0.1])
            })

        sales_df = pd.DataFrame(sales_data)
        sales_df['total_amount'] = sales_df['quantity'] * sales_df['unit_price']

        # Mock customers data
        customers_data = []
        for i in range(100):
            customers_data.append({
                'id': f'cust_{i+1}',
                'customer_code': f'CUST-{i+1:03d}',
                'name': f'Customer {i+1}',
                'email': f'customer{i+1}@example.com',
                'phone': f'+91-9{random.randint(100000000, 999999999)}',
                'address': f'Address {i+1}, City',
                'city': np.random.choice(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']),
                'state': np.random.choice(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal']),
                'country': 'India',
                'customer_type': np.random.choice(['retail', 'wholesale', 'doctor'], p=[0.7, 0.2, 0.1]),
                'total_orders': random.randint(1, 20),
                'total_spent': random.randint(500, 5000),
                'avg_order_value': random.randint(100, 500),
                'last_purchase_date': (datetime.now() - timedelta(days=random.randint(1, 180))).strftime('%Y-%m-%d'),
                'first_purchase_date': (datetime.now() - timedelta(days=random.randint(200, 365))).strftime('%Y-%m-%d'),
                'loyalty_points': random.randint(0, 1000),
                'is_active': True
            })

        customers_df = pd.DataFrame(customers_data)

        return {
            'products': products_df,
            'sales': sales_df,
            'customers': customers_df,
            'inventory': pd.DataFrame()  # Empty for now
        }

# Usage example
if __name__ == "__main__":
    DATABASE_URL = "postgresql://user:pass@localhost:5432/homeoerp"

    pipeline = HomeoERPDataPipeline(DATABASE_URL)
    training_data = pipeline.prepare_training_data()

    print(f"📊 Dataset sizes:")
    for name, df in training_data.items():
        print(f"  {name}: {len(df)} records")
