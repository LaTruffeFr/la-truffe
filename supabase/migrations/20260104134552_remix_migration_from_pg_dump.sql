CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titre text NOT NULL,
    prix integer NOT NULL,
    kilometrage integer DEFAULT 0 NOT NULL,
    annee integer,
    carburant text DEFAULT 'autre'::text,
    transmission text DEFAULT 'autre'::text,
    puissance integer DEFAULT 0,
    lien text,
    image text,
    localisation text,
    marque text NOT NULL,
    modele text NOT NULL,
    prix_ajuste numeric,
    gain_potentiel numeric,
    score_confiance numeric,
    prix_median_segment numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: idx_vehicles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_created_at ON public.vehicles USING btree (created_at DESC);


--
-- Name: idx_vehicles_marque; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_marque ON public.vehicles USING btree (marque);


--
-- Name: vehicles Allow public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete" ON public.vehicles FOR DELETE USING (true);


--
-- Name: vehicles Allow public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert" ON public.vehicles FOR INSERT WITH CHECK (true);


--
-- Name: vehicles Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.vehicles FOR SELECT USING (true);


--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;