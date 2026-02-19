-- RLS Policies for 'cars' table to restrict seller access

-- Enable RLS on cars table
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Policy: Sellers can view their own listings
CREATE POLICY "Users can view their own listings"
  ON cars
  FOR SELECT
  USING (auth.uid() = user_id OR is_user_listing = false);

-- Policy: Sellers can insert their own listings
CREATE POLICY "Users can create listings"
  ON cars
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Sellers can update their own listings only
CREATE POLICY "Users can update their own listings"
  ON cars
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Sellers can delete their own listings only
CREATE POLICY "Users can delete their own listings"
  ON cars
  FOR DELETE
  USING (auth.uid() = user_id);
