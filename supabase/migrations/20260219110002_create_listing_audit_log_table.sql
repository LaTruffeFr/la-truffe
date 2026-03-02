-- Create listing_audit_log table for tracking modifications
CREATE TABLE public.listing_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  modified_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'published', 'unpublished', 'promoted', 'deleted'
  previous_values JSONB, -- Store old values for updates
  new_values JSONB, -- Store new values
  change_description TEXT, -- Human-readable description (e.g., "Title changed from X to Y")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_log_listing_id ON public.listing_audit_log(listing_id);
CREATE INDEX idx_audit_log_modified_by ON public.listing_audit_log(modified_by);
CREATE INDEX idx_audit_log_created_at ON public.listing_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON public.listing_audit_log(action);

-- Enable RLS
ALTER TABLE public.listing_audit_log ENABLE ROW LEVEL SECURITY;

-- Sellers can view audit log for their own listings
CREATE POLICY "Sellers view own audit logs"
ON public.listing_audit_log FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.cars WHERE id = listing_id
  )
);

-- System can insert audit entries
CREATE POLICY "System inserts audit logs"
ON public.listing_audit_log FOR INSERT
WITH CHECK (true);

-- Admins can view all audit logs
CREATE POLICY "Admins view all audit logs"
ON public.listing_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND public.is_admin(auth.uid())
  )
);

-- Function to log listing creation
CREATE OR REPLACE FUNCTION log_listing_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.listing_audit_log (
    listing_id,
    modified_by,
    action,
    new_values,
    change_description
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'created',
    jsonb_build_object(
      'title', NEW.title,
      'price', NEW.price,
      'mileage', NEW.mileage,
      'year', NEW.year,
      'image_url', NEW.image_url
    ),
    'Listing created'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log listing updates
CREATE OR REPLACE FUNCTION log_listing_update()
RETURNS TRIGGER AS $$
DECLARE
  changes TEXT := '';
  old_data JSONB := row_to_json(OLD)::jsonb;
  new_data JSONB := row_to_json(NEW)::jsonb;
BEGIN
  -- Build description of changes
  IF OLD.title != NEW.title THEN
    changes := changes || 'Title: "' || OLD.title || '" → "' || NEW.title || '"; ';
  END IF;
  IF OLD.price != NEW.price THEN
    changes := changes || 'Price: €' || OLD.price || ' → €' || NEW.price || '; ';
  END IF;
  IF OLD.mileage != NEW.mileage THEN
    changes := changes || 'Mileage: ' || OLD.mileage || 'km → ' || NEW.mileage || 'km; ';
  END IF;
  IF OLD.year != NEW.year THEN
    changes := changes || 'Year: ' || OLD.year || ' → ' || NEW.year || '; ';
  END IF;
  IF OLD.description != NEW.description THEN
    changes := changes || 'Description updated; ';
  END IF;

  -- Only log if something actually changed
  IF changes != '' THEN
    INSERT INTO public.listing_audit_log (
      listing_id,
      modified_by,
      action,
      previous_values,
      new_values,
      change_description
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'updated',
      old_data - ARRAY['updated_at', 'created_at'],
      new_data - ARRAY['updated_at', 'created_at'],
      'Changes: ' || changes
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for audit logging
CREATE TRIGGER trigger_log_listing_creation
AFTER INSERT ON public.cars
FOR EACH ROW
EXECUTE FUNCTION log_listing_creation();

CREATE TRIGGER trigger_log_listing_update
AFTER UPDATE ON public.cars
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION log_listing_update();
