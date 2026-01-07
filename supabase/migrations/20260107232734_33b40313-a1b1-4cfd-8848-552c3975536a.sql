-- Create report status enum
CREATE TYPE public.report_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create reports table for client requests
CREATE TABLE public.reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Vehicle criteria
    marque TEXT NOT NULL,
    modele TEXT NOT NULL,
    annee_min INTEGER,
    annee_max INTEGER,
    kilometrage_max INTEGER,
    prix_max INTEGER,
    carburant TEXT,
    transmission TEXT,
    notes TEXT,
    
    -- Report status
    status report_status NOT NULL DEFAULT 'pending',
    
    -- Admin fields
    report_url TEXT, -- URL to the generated PDF stored in storage
    admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own reports
CREATE POLICY "Users can create their own reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can update all reports
CREATE POLICY "Admins can update all reports"
ON public.reports
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete reports
CREATE POLICY "Admins can delete all reports"
ON public.reports
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_reports_updated_at();

-- Create storage bucket for report PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false);

-- Storage policies for reports bucket
CREATE POLICY "Users can view their own report files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can manage all report files
CREATE POLICY "Admins can manage all report files"
ON storage.objects
FOR ALL
USING (bucket_id = 'reports' AND public.is_admin(auth.uid()));