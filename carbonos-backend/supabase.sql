-- Copy and run this script inside your Supabase SQL Editor

-- 1. Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT
);

-- 2. Create production_data table
CREATE TABLE production_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  production_tons NUMERIC DEFAULT 0,
  energy_kwh NUMERIC DEFAULT 0,
  category TEXT
);

-- 3. Create obligations table
CREATE TABLE obligations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  total NUMERIC DEFAULT 0,
  fulfilled NUMERIC DEFAULT 0,
  deficit NUMERIC DEFAULT 0,
  status TEXT
);

-- 4. Create emissions table
CREATE TABLE emissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  emissions_value NUMERIC DEFAULT 0
);

-- 5. Create credits table
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT,
  quantity NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0,
  owner TEXT,
  trust_score NUMERIC DEFAULT 0,
  status TEXT
);

-- 6. Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES companies(id),
  seller_id TEXT,
  quantity NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0,
  status TEXT
);
