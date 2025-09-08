-- Create families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_sharing_location BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Create policies for families table (allow anyone to read/create families for this demo)
CREATE POLICY "Allow anyone to view families" ON public.families FOR SELECT USING (true);
CREATE POLICY "Allow anyone to create families" ON public.families FOR INSERT WITH CHECK (true);

-- Create policies for family_members table (allow anyone to manage members for this demo)
CREATE POLICY "Allow anyone to view family members" ON public.family_members FOR SELECT USING (true);
CREATE POLICY "Allow anyone to create family members" ON public.family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to update family members" ON public.family_members FOR UPDATE USING (true);
CREATE POLICY "Allow anyone to delete family members" ON public.family_members FOR DELETE USING (true);
