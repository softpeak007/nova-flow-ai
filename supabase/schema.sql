-- Supabase Database Schema for Nova Flow AI
-- Phase 2 Complete: Production-Ready structure with RLS and automatic profile triggers.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------
-- 1. PROFILES TABLE (Linked to Supabase Auth)
----------------------------------------------------
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    organization_name TEXT DEFAULT 'My Organization',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile." 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

----------------------------------------------------
-- 2. SUBSCRIPTIONS TABLE (Billing and Plans)
----------------------------------------------------
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_tier TEXT DEFAULT 'Free' CHECK (plan_tier IN ('Free', 'Starter', 'Growth', 'Premium')) NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active' NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions Policies
CREATE POLICY "Users can view their own subscription status." 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions." 
    ON public.subscriptions FOR ALL 
    USING (true);

----------------------------------------------------
-- 3. LEADS TABLE (CRM and Lead Management)
----------------------------------------------------
CREATE TABLE public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT,
    budget TEXT,
    timeline TEXT,
    service_needed TEXT,
    stage TEXT DEFAULT 'New' CHECK (stage IN ('New', 'Contacted', 'Qualified', 'Closed')) NOT NULL,
    ai_score INTEGER DEFAULT 0,
    ai_summary TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Leads Policies
CREATE POLICY "Users can manage their own leads." 
    ON public.leads FOR ALL 
    USING (auth.uid() = user_id);

----------------------------------------------------
-- 4. WORKFLOWS TABLE (Workflow Automation)
----------------------------------------------------
CREATE TABLE public.workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false NOT NULL,
    nodes JSONB DEFAULT '[]'::jsonb NOT NULL,
    edges JSONB DEFAULT '[]'::jsonb NOT NULL,
    execution_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Workflows Policies
CREATE POLICY "Users can manage their own workflows." 
    ON public.workflows FOR ALL 
    USING (auth.uid() = user_id);

----------------------------------------------------
-- 5. WHATSAPP CAMPAIGNS TABLE (WhatsApp Automation)
----------------------------------------------------
CREATE TABLE public.whatsapp_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    template_body TEXT NOT NULL,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Running', 'Completed')) NOT NULL,
    total_recipients INTEGER DEFAULT 0 NOT NULL,
    sent_count INTEGER DEFAULT 0 NOT NULL,
    delivered_count INTEGER DEFAULT 0 NOT NULL,
    read_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Campaigns
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies
CREATE POLICY "Users can manage their own campaigns." 
    ON public.whatsapp_campaigns FOR ALL 
    USING (auth.uid() = user_id);

----------------------------------------------------
-- 6. API KEYS TABLE (API Integration)
----------------------------------------------------
CREATE TABLE public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    hashed_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS on API Keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- API Keys Policies
CREATE POLICY "Users can manage their own API keys." 
    ON public.api_keys FOR ALL 
    USING (auth.uid() = user_id);

----------------------------------------------------
-- 8. AI FUNNELS TABLE (Funnel Builder)
----------------------------------------------------
CREATE TABLE public.funnels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    template_name TEXT DEFAULT 'Modern Dark' NOT NULL,
    subdomain TEXT UNIQUE,
    page_title TEXT,
    page_description TEXT,
    form_fields JSONB DEFAULT '["name", "whatsapp"]'::jsonb NOT NULL,
    visitor_count INTEGER DEFAULT 0 NOT NULL,
    conversion_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own funnels." ON public.funnels FOR ALL USING (auth.uid() = user_id);

----------------------------------------------------
-- 9. CALL LOGS TABLE (Auto Calling Dialer)
----------------------------------------------------
CREATE TABLE public.call_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Ringing', 'Answered', 'Voice Mail', 'Failed')) NOT NULL,
    duration INTEGER DEFAULT 0 NOT NULL, -- in seconds
    recording_url TEXT,
    call_script TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own call logs." ON public.call_logs FOR ALL USING (auth.uid() = user_id);

----------------------------------------------------
-- 10. COURSES TABLE (LMS Hosting)
----------------------------------------------------
CREATE TABLE public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    price INTEGER DEFAULT 0 NOT NULL,
    student_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own courses." ON public.courses FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT,
    duration INTEGER DEFAULT 0 NOT NULL, -- in minutes
    sort_order INTEGER DEFAULT 0 NOT NULL
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage lessons of their courses." ON public.lessons FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.courses 
        WHERE public.courses.id = public.lessons.course_id 
        AND public.courses.user_id = auth.uid()
    ));

----------------------------------------------------
-- 11. COMMUNITY TABLES (Discussion Forum)
----------------------------------------------------
CREATE TABLE public.community_channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own community channels." ON public.community_channels FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.community_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage posts of their channels." ON public.community_posts FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.community_channels 
        WHERE public.community_channels.id = public.community_posts.channel_id 
        AND public.community_channels.user_id = auth.uid()
    ));

----------------------------------------------------
-- 12. APPOINTMENTS TABLE (Calendar Booking)
----------------------------------------------------
CREATE TABLE public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL,
    client_whatsapp TEXT NOT NULL,
    client_email TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30 NOT NULL, -- in minutes
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own appointments." ON public.appointments FOR ALL USING (auth.uid() = user_id);

----------------------------------------------------
-- 13. SOCIAL INTEGRATIONS TABLE (Social Connect)
----------------------------------------------------
CREATE TABLE public.social_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    platform TEXT CHECK (platform IN ('Facebook', 'Instagram', 'LinkedIn', 'YouTube')) NOT NULL,
    account_name TEXT NOT NULL,
    is_connected BOOLEAN DEFAULT true NOT NULL,
    follower_count INTEGER DEFAULT 0 NOT NULL,
    scheduled_posts_count INTEGER DEFAULT 0 NOT NULL,
    auto_reply_rules JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.social_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own social integrations." ON public.social_integrations FOR ALL USING (auth.uid() = user_id);

----------------------------------------------------
-- 7. TRIGGERS & TRIGGERS FUNCTIONS (Automatic Actions)
----------------------------------------------------

-- Automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, organization_name)
    VALUES (new.id, new.email, 'My Organization');
    
    -- Automatically provision a Free tier subscription for the new profile
    INSERT INTO public.subscriptions (user_id, plan_tier)
    VALUES (new.id, 'Free');
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute when auth.users row is inserted
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper Function to update timestamps on updates
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to tables
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_subscriptions_timestamp BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_leads_timestamp BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_workflows_timestamp BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_whatsapp_campaigns_timestamp BEFORE UPDATE ON public.whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_funnels_timestamp BEFORE UPDATE ON public.funnels FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_call_logs_timestamp BEFORE UPDATE ON public.call_logs FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_courses_timestamp BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_appointments_timestamp BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_social_integrations_timestamp BEFORE UPDATE ON public.social_integrations FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
