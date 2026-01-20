-- =====================================================
-- DB SETUP SCRIPT FOR LA TRUFFE
-- =====================================================
-- Ce fichier contient les requêtes SQL pour configurer
-- manuellement la base de données si nécessaire.
-- =====================================================

-- 1. Table des profils utilisateurs (déjà créée via migration)
-- ============================================================
-- CREATE TABLE public.profiles (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
--   email TEXT NOT NULL,
--   credits INTEGER NOT NULL DEFAULT 0,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
-- );

-- 2. Politiques RLS pour profiles (déjà créées via migration)
-- ============================================================
-- Users can view their own profile
-- Users can update their own profile
-- Users can insert their own profile
-- Admins can view and manage all profiles

-- 3. Créer un profil pour un utilisateur existant
-- ============================================================
-- Remplacez 'USER_UUID_HERE' par l'UUID de l'utilisateur dans auth.users
-- et 'email@example.com' par son email

-- INSERT INTO public.profiles (user_id, email, credits)
-- SELECT id, email, 0
-- FROM auth.users
-- WHERE email = 'latruffe.consulting@gmail.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- 4. Forcer l'email admin avec 100 crédits
-- ============================================================
-- D'abord, créez le profil si inexistant, puis mettez à jour les crédits

-- Option A: Insérer ou mettre à jour via SQL (exécuter dans Supabase SQL Editor)
INSERT INTO public.profiles (user_id, email, credits)
SELECT id, email, 100
FROM auth.users
WHERE email = 'latruffe.consulting@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET credits = 100, updated_at = now();

-- 5. Ajouter le rôle admin à l'utilisateur
-- ============================================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'latruffe.consulting@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Vérifier la configuration
-- ============================================================
-- Vérifier que le profil existe avec les crédits
SELECT 
  p.user_id,
  p.email,
  p.credits,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
WHERE p.email = 'latruffe.consulting@gmail.com';

-- 7. Lister tous les profils (pour debug)
-- ============================================================
-- SELECT * FROM public.profiles;

-- 8. Lister tous les rôles (pour debug)
-- ============================================================
-- SELECT * FROM public.user_roles;

-- =====================================================
-- NOTES IMPORTANTES:
-- =====================================================
-- - La table profiles stocke les crédits des utilisateurs
-- - La table user_roles stocke les rôles (admin/user)
-- - Le role 'admin' donne accès à /admin
-- - Les crédits sont affichés dans le ClientDashboard
-- - Le trigger on_auth_user_created crée automatiquement
--   un profil avec 0 crédits pour chaque nouvel utilisateur
-- =====================================================
