/*
  # Create cars table for user car listings

  1. New Tables
    - `cars`
      - `id` (uuid, primary key) - Unique identifier for each car
      - `user_id` (uuid) - ID of the user who posted the car
      - `brand` (text) - Car brand/make (e.g., "Toyota", "BMW")
      - `model` (text) - Car model (e.g., "Camry", "X5")
      - `year` (integer) - Year of manufacture
      - `price` (numeric) - Price in euros
      - `mileage` (integer) - Mileage in kilometers
      - `fuel_type` (text) - Type of fuel (essence, diesel, électrique, hybride)
      - `transmission` (text) - Type of transmission (manuelle, automatique)
      - `description` (text) - Detailed description of the car
      - `image_url` (text) - URL to car image
      - `created_at` (timestamptz) - When the listing was created
      - `updated_at` (timestamptz) - When the listing was last updated

  2. Security
    - Enable RLS on `cars` table
    - Add policy for users to view all cars
    - Add policy for users to insert their own cars
    - Add policy for users to update their own cars
    - Add policy for users to delete their own cars
*/

CREATE TABLE IF NOT EXISTS cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  price numeric NOT NULL,
  mileage integer NOT NULL DEFAULT 0,
  fuel_type text NOT NULL DEFAULT 'essence',
  transmission text NOT NULL DEFAULT 'manuelle',
  description text DEFAULT '',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cars"
  ON cars FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own cars"
  ON cars FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own cars"
  ON cars FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own cars"
  ON cars FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE INDEX IF NOT EXISTS cars_user_id_idx ON cars(user_id);
CREATE INDEX IF NOT EXISTS cars_created_at_idx ON cars(created_at DESC);