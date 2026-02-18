-- Create access_logs table
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL, -- 'LOGIN', 'LOGOUT'
    status TEXT NOT NULL, -- 'SUCCESS', 'FAILURE'
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    module TEXT NOT NULL, -- 'ESCOLA', 'VISITA', 'COORDENADOR', etc.
    record_id TEXT,
    details JSONB, -- Stores old_value, new_value, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for access_logs
-- Only admins can view logs (implementation depends on how 'admin' is defined in auth.users or a separate profile table)
-- For now, we'll allow authenticated users to INSERT, but only specific users to SELECT if we had a role system.
-- Assuming a simple 'authenticated' role for now for insertion.
CREATE POLICY "Enable insert for authenticated users" ON public.access_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for authenticated users" ON public.access_logs
    FOR SELECT USING (auth.role() = 'authenticated'); -- Ideally restricted to admins

-- Policies for audit_logs
CREATE POLICY "Enable insert for authenticated users" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for authenticated users" ON public.audit_logs
    FOR SELECT USING (auth.role() = 'authenticated'); -- Ideally restricted to admins

-- Optional: Create index for faster querying
CREATE INDEX idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_module ON public.audit_logs(module);
