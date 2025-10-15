
// Database Configuration for Production and Development
interface DatabaseConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

const config: DatabaseConfig = {
  supabase: {
    url: "https://cjujwogpqahgsonwcxdf.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWp3b2dwcWFoZ3NvbndjeGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTU5MTYsImV4cCI6MjA1OTU3MTkxNn0.g2I-HSC-PKJ5eGzlqqX5hXkbVGgWxu9x2X5t7tI-bac"
  },
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DATABASE || 'yeelo_homeopathy',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres'
  }
};

export const getDatabaseConfig = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production') {
    return config.postgres;
  } else {
    return config.supabase;
  }
};

export default config;
