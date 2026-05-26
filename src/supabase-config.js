// Supabase configuration and fallback manager for Nova Flow AI
// Automatically switches between live Supabase connection and a robust client-side simulation.

const SUPABASE_URL_KEY = "novaflow_supabase_url";
const SUPABASE_ANON_KEY_KEY = "novaflow_supabase_key";

let supabaseClient = null;
let isMockActive = true;

// Check if credentials exist in localStorage or custom overrides
const getSupabaseCredentials = () => {
  const url = localStorage.getItem(SUPABASE_URL_KEY) || window.SUPABASE_URL || "";
  const key = localStorage.getItem(SUPABASE_ANON_KEY_KEY) || window.SUPABASE_ANON_KEY || "";
  return { url, key };
};

const initializeSupabase = () => {
  const { url, key } = getSupabaseCredentials();
  if (url && key && typeof supabase !== 'undefined') {
    try {
      supabaseClient = supabase.createClient(url, key);
      isMockActive = false;
      console.log("🌐 Nova Flow AI: Successfully connected to Supabase!");
    } catch (e) {
      console.warn("⚠️ Nova Flow AI: Supabase init failed, falling back to simulator.", e);
      isMockActive = true;
    }
  } else {
    console.log("🛠️ Nova Flow AI: Running on Local Simulator Mode. Connect real Supabase anytime in developer settings.");
    isMockActive = true;
  }
};

// Seed Mock Data in localStorage if not already present
const seedMockDatabase = () => {
  if (!localStorage.getItem("novaflow_mock_leads")) {
    const defaultLeads = [
      { id: "1", name: "Sarah Connor", whatsapp: "+155501992", email: "sarah.c@sky.net", budget: "$5,000", timeline: "Immediate", service_needed: "AI Customer Agent", stage: "Qualified", ai_score: 95, ai_summary: "Extremely hot lead. Ready for contract deployment.", notes: "Prefers WhatsApp chat broadcasts.", created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: "2", name: "Bruce Wayne", whatsapp: "+155501939", email: "bruce@wayne.corp", budget: "$25,000+", timeline: "1 month", service_needed: "CRM Automation Workflow", stage: "Contacted", ai_score: 88, ai_summary: "High budget lead. Seeking comprehensive workflow integration.", notes: "Needs custom security compliance policies.", created_at: new Date(Date.now() - 3600000 * 18).toISOString() },
      { id: "3", name: "Tony Stark", whatsapp: "+155501982", email: "tony@stark.industries", budget: "$50,000+", timeline: "Immediate", service_needed: "Full AI Multi-Agent CRM System", stage: "Closed", ai_score: 99, ai_summary: "Deal signed. Deploying custom strategist and analysis agent models.", notes: "Requested priority developer API hooks.", created_at: new Date(Date.now() - 3600000 * 40).toISOString() },
      { id: "4", name: "Peter Parker", whatsapp: "+155501928", email: "peter.p@dailybugle.com", budget: "Under $1,000", timeline: "Exploring", service_needed: "Basic Lead Capture Setup", stage: "New", ai_score: 42, ai_summary: "Low budget explorer. Shared starter plan templates.", notes: "Interested in WhatsApp direct chat widget.", created_at: new Date(Date.now() - 3600000 * 50).toISOString() }
    ];
    localStorage.setItem("novaflow_mock_leads", JSON.stringify(defaultLeads));
  }

  if (!localStorage.getItem("novaflow_mock_workflows")) {
    const defaultWorkflows = [
      { 
        id: "wf-1", 
        name: "Lead Capture & Qualifier Flow", 
        description: "Captures visitors from landing page, evaluates budget, alerts WhatsApp and saves to CRM.", 
        is_active: true, 
        execution_count: 384,
        nodes: [
          { id: "n1", type: "trigger", title: "Lead Captured", desc: "Triggered on form submit", x: 40, y: 150 },
          { id: "n2", type: "action", title: "AI Lead Classifier", desc: "Grades budget & timeline", x: 280, y: 150 },
          { id: "n3", type: "action", title: "Google Sheets CRM", desc: "Saves details dynamically", x: 520, y: 50 },
          { id: "n4", type: "action", title: "WhatsApp Notification", desc: "Sends alert callback", x: 520, y: 260 }
        ],
        edges: [
          { from: "n1", to: "n2" },
          { from: "n2", to: "n3" },
          { from: "n2", to: "n4" }
        ],
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
      },
      { 
        id: "wf-2", 
        name: "WhatsApp Campaign Followup", 
        description: "Triggers automated templates when custom WhatsApp auto-responder keywords match.", 
        is_active: false, 
        execution_count: 12,
        nodes: [
          { id: "wfn1", type: "trigger", title: "WhatsApp Message Recv", desc: "Matches pricing keyword", x: 60, y: 150 },
          { id: "wfn2", type: "action", title: "AI Auto Responder", desc: "Generates custom quote", x: 300, y: 150 },
          { id: "wfn3", type: "action", title: "Stripe Payment Link", desc: "Sends checkout redirect", x: 540, y: 150 }
        ],
        edges: [
          { from: "wfn1", to: "wfn2" },
          { from: "wfn2", to: "wfn3" }
        ],
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ];
    localStorage.setItem("novaflow_mock_workflows", JSON.stringify(defaultWorkflows));
  }

  if (!localStorage.getItem("novaflow_mock_campaigns")) {
    const defaultCampaigns = [
      { id: "cmp-1", name: "Summer Pro Upgrade Broadcast", template_body: "Hi {name}, we just launched our Advanced AI Automation Console! Upgrade your subscription to the Growth plan today and save 25%. Reply CONSOLE to get started.", status: "Completed", total_recipients: 150, sent_count: 150, delivered_count: 142, read_count: 110, created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: "cmp-2", name: "Real Estate Broker Blast", template_body: "Hello {name}, capture real estate leads 24/7 with the new AI Lead Qualifier Bot! Get a site visit booked automatically. Reply DEMO to try.", status: "Draft", total_recipients: 45, sent_count: 0, delivered_count: 0, read_count: 0, created_at: new Date().toISOString() }
    ];
    localStorage.setItem("novaflow_mock_campaigns", JSON.stringify(defaultCampaigns));
  }

  if (!localStorage.getItem("novaflow_mock_apikeys")) {
    const defaultApiKeys = [
      { id: "key-1", name: "Production CRM Sync", key_prefix: "nv_live_8f3d", created_at: new Date(Date.now() - 86400000 * 30).toISOString(), last_used_at: new Date(Date.now() - 600000).toISOString(), usage_count: 4292 },
      { id: "key-2", name: "Stripe Webhook Receiver", key_prefix: "nv_live_2a9c", created_at: new Date(Date.now() - 86400000 * 2).toISOString(), last_used_at: new Date(Date.now() - 1800000).toISOString(), usage_count: 14 }
    ];
    localStorage.setItem("novaflow_mock_apikeys", JSON.stringify(defaultApiKeys));
  }

  if (!localStorage.getItem("novaflow_mock_subscription")) {
    const defaultSub = {
      plan_tier: "Free",
      stripe_customer_id: "cus_mock_novaflow992",
      status: "active",
      current_period_end: new Date(Date.now() + 86400000 * 30).toISOString()
    };
    localStorage.setItem("novaflow_mock_subscription", JSON.stringify(defaultSub));
  }

  if (!localStorage.getItem("novaflow_mock_profile")) {
    const defaultProfile = {
      email: "guest@novaflow.ai",
      organization_name: "Stitch Automations Corp",
      avatar_url: ""
    };
    localStorage.setItem("novaflow_mock_profile", JSON.stringify(defaultProfile));
  }

  // --- PHASE 2 ADDITIONAL MOCK DATA SEEDING ---
  if (!localStorage.getItem("novaflow_mock_funnels")) {
    const defaultFunnels = [
      { id: "fn-1", name: "AI Consulting Funnel", template_name: "Modern Dark", subdomain: "consulting", page_title: "Free AI Automation Consulting Session", page_description: "We help agencies scale their operations with automated intelligence.", form_fields: ["name", "whatsapp", "email", "budget"], visitor_count: 1240, conversion_count: 248, created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
      { id: "fn-2", name: "Real Estate Lead Magnets", template_name: "Editorial Glass", subdomain: "properties", page_title: "Exclusive Premium Flat Pre-Launch Offers", page_description: "Book site visits, unlock discounted quotes, and view listings.", form_fields: ["name", "whatsapp"], visitor_count: 450, conversion_count: 90, created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
    ];
    localStorage.setItem("novaflow_mock_funnels", JSON.stringify(defaultFunnels));
  }

  if (!localStorage.getItem("novaflow_mock_call_logs")) {
    const defaultCalls = [
      { id: "call-1", name: "Sarah Connor", phone_number: "+155501992", status: "Answered", duration: 84, recording_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg", call_script: "Introduce the custom CRM automation model, qualify their operational budgets, and book a free demo call.", created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
      { id: "call-2", name: "Bruce Wayne", phone_number: "+155501939", status: "Ringing", duration: 0, recording_url: "", call_script: "Follow up on flat listings quote, secure site visit confirmation, and push payment gateway link.", created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
      { id: "call-3", name: "Tony Stark", phone_number: "+155501982", status: "Voice Mail", duration: 18, recording_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg", call_script: "Introduce multi-agent instructions and API hashed credentials dashboard.", created_at: new Date(Date.now() - 3600000 * 24).toISOString() }
    ];
    localStorage.setItem("novaflow_mock_call_logs", JSON.stringify(defaultCalls));
  }

  if (!localStorage.getItem("novaflow_mock_courses")) {
    const defaultCourses = [
      { id: "crs-1", title: "AI Automation Masterclass", description: "Complete visual guide to building active lead qualifiers and AI WhatsApp agents.", cover_image: "🤖", price: 4999, student_count: 128, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
      { id: "crs-2", title: "SaaS Workflow Architecture", description: "Design secure CRM tables, configure RLS rules, and deploy Stripe transactions.", cover_image: "⚙️", price: 9999, student_count: 42, created_at: new Date(Date.now() - 86400000 * 15).toISOString() }
    ];
    localStorage.setItem("novaflow_mock_courses", JSON.stringify(defaultCourses));
  }

  if (!localStorage.getItem("novaflow_mock_lessons")) {
    const defaultLessons = [
      { id: "lsn-1", course_id: "crs-1", title: "Setup visual workflow triggers on drag nodes", duration: 14, sort_order: 1 },
      { id: "lsn-2", course_id: "crs-1", title: "Configure CRM tables with Supabase client-side JS", duration: 22, sort_order: 2 },
      { id: "lsn-3", course_id: "crs-2", title: "Secure database tables using RLS policies", duration: 18, sort_order: 1 }
    ];
    localStorage.setItem("novaflow_mock_lessons", JSON.stringify(defaultLessons));
  }

  if (!localStorage.getItem("novaflow_mock_community_channels")) {
    const defaultChannels = [
      { id: "chn-1", name: "General Discussions", description: "Share your CRM funnels and chatbot systems." },
      { id: "chn-2", name: "Announcements & Hacks", description: "Product updates and custom automation scripts." }
    ];
    localStorage.setItem("novaflow_mock_community_channels", JSON.stringify(defaultChannels));
  }

  if (!localStorage.getItem("novaflow_mock_community_posts")) {
    const defaultPosts = [
      { id: "pst-1", channel_id: "chn-1", author_name: "Sarah Connor", author_avatar: "🤖", content: "Successfully deployed the WhatsApp campaign qualifier! Got a 92% read score and already cataloged 14 new CRM leads.", likes: 8, created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
      { id: "pst-2", channel_id: "chn-1", author_name: "Tony Stark", author_avatar: "⚡", content: "Unlocking Stripe simulator checkouts inside the billing tab is incredibly smooth. Next step is visual workflow node connects.", likes: 14, created_at: new Date(Date.now() - 3600000 * 12).toISOString() }
    ];
    localStorage.setItem("novaflow_mock_community_posts", JSON.stringify(defaultPosts));
  }

  if (!localStorage.getItem("novaflow_mock_appointments")) {
    const defaultApps = [
      { id: "app-1", client_name: "John Connor", client_whatsapp: "+155501992", client_email: "john@connor.net", start_time: new Date(Date.now() + 3600000 * 24).toISOString(), duration: 30, status: "Scheduled", notes: "Qualify automation budget models." },
      { id: "app-2", client_name: "Selina Kyle", client_whatsapp: "+155501933", client_email: "selina@wayne.corp", start_time: new Date(Date.now() + 3600000 * 48).toISOString(), duration: 45, status: "Scheduled", notes: "Review CRM leads spreadsheet structure." }
    ];
    localStorage.setItem("novaflow_mock_appointments", JSON.stringify(defaultApps));
  }

  if (!localStorage.getItem("novaflow_mock_social_channels")) {
    const defaultSocials = [
      { id: "soc-1", platform: "Facebook", account_name: "Nova Flow AI Global Page", is_connected: true, follower_count: 4290, scheduled_posts_count: 5, auto_reply_rules: [{ keyword: "info", reply: "Hi! Check out our funnels at https://consulting.novaflow.ai" }] },
      { id: "soc-2", platform: "Instagram", account_name: "@novaflow.ai", is_connected: true, follower_count: 12840, scheduled_posts_count: 8, auto_reply_rules: [{ keyword: "pricing", reply: "Our Starter plans begin at ₹2,999!" }] },
      { id: "soc-3", platform: "LinkedIn", account_name: "Nova Flow Automation Systems", is_connected: false, follower_count: 0, scheduled_posts_count: 0, auto_reply_rules: [] }
    ];
    localStorage.setItem("novaflow_mock_social_channels", JSON.stringify(defaultSocials));
  }
};

// SIMULATOR MOCK METHODS GATEWAY
const supabaseSimulator = {
  auth: {
    signUp: async ({ email, password }) => {
      const profile = { email, organization_name: "My Organization", avatar_url: "" };
      localStorage.setItem("novaflow_mock_profile", JSON.stringify(profile));
      localStorage.setItem("novaflow_session_active", "true");
      return { data: { user: { id: "mock-user-123", email } }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      const profile = JSON.parse(localStorage.getItem("novaflow_mock_profile")) || { email, organization_name: "Stitch Automations Corp" };
      localStorage.setItem("novaflow_mock_profile", JSON.stringify({ ...profile, email }));
      localStorage.setItem("novaflow_session_active", "true");
      return { data: { user: { id: "mock-user-123", email } }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem("novaflow_session_active");
      return { error: null };
    },
    getSession: async () => {
      const active = localStorage.getItem("novaflow_session_active");
      if (active === "true") {
        const profile = JSON.parse(localStorage.getItem("novaflow_mock_profile")) || { email: "guest@novaflow.ai" };
        return { data: { session: { user: { id: "mock-user-123", email: profile.email } } }, error: null };
      }
      return { data: { session: null }, error: null };
    }
  },
  
  from: (tableName) => {
    let mockStorageKey = "";
    if (tableName === "leads") mockStorageKey = "novaflow_mock_leads";
    else if (tableName === "workflows") mockStorageKey = "novaflow_mock_workflows";
    else if (tableName === "whatsapp_campaigns") mockStorageKey = "novaflow_mock_campaigns";
    else if (tableName === "api_keys") mockStorageKey = "novaflow_mock_apikeys";
    else if (tableName === "subscriptions") mockStorageKey = "novaflow_mock_subscription";
    else if (tableName === "profiles") mockStorageKey = "novaflow_mock_profile";
    // Phase 2 tables
    else if (tableName === "funnels") mockStorageKey = "novaflow_mock_funnels";
    else if (tableName === "call_logs") mockStorageKey = "novaflow_mock_call_logs";
    else if (tableName === "courses") mockStorageKey = "novaflow_mock_courses";
    else if (tableName === "lessons") mockStorageKey = "novaflow_mock_lessons";
    else if (tableName === "community_channels") mockStorageKey = "novaflow_mock_community_channels";
    else if (tableName === "community_posts") mockStorageKey = "novaflow_mock_community_posts";
    else if (tableName === "appointments") mockStorageKey = "novaflow_mock_appointments";
    else if (tableName === "social_integrations") mockStorageKey = "novaflow_mock_social_channels";

    const getItems = () => {
      try {
        return JSON.parse(localStorage.getItem(mockStorageKey));
      } catch(e) { return []; }
    };
    
    const setItems = (arr) => {
      localStorage.setItem(mockStorageKey, JSON.stringify(arr));
    };

    return {
      select: () => ({
        eq: (col, val) => {
          const items = getItems();
          if (tableName === "profiles" || tableName === "subscriptions") {
            return { data: items, error: null };
          }
          if (Array.isArray(items)) {
            const filtered = items.filter(item => item[col] === val);
            return { data: filtered, error: null };
          }
          return { data: items, error: null };
        },
        order: (col, { ascending } = { ascending: false }) => {
          const items = getItems() || [];
          const sorted = [...items].sort((a,b) => {
            const timeA = new Date(a[col]).getTime();
            const timeB = new Date(b[col]).getTime();
            return ascending ? timeA - timeB : timeB - timeA;
          });
          return { data: sorted, error: null };
        },
        data: getItems(),
        error: null
      }),
      
      insert: async (newData) => {
        const items = getItems() || [];
        const payload = Array.isArray(newData) ? newData : [newData];
        const withIds = payload.map(item => ({
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          ...item
        }));
        
        const updated = [...withIds, ...items];
        setItems(updated);
        return { data: withIds, error: null };
      },

      update: async (updatedFields) => {
        return {
          eq: (col, val) => {
            if (tableName === "profiles" || tableName === "subscriptions") {
              const current = getItems();
              const merged = { ...current, ...updatedFields };
              setItems(merged);
              return { data: merged, error: null };
            } else {
              const items = getItems() || [];
              const updated = items.map(item => {
                if (item[col] === val) {
                  return { ...item, ...updatedFields };
                }
                return item;
              });
              setItems(updated);
              return { data: updated.filter(item => item[col] === val), error: null };
            }
          }
        };
      },

      delete: async () => {
        return {
          eq: (col, val) => {
            const items = getItems() || [];
            const filtered = items.filter(item => item[col] !== val);
            setItems(filtered);
            return { data: { deleted: val }, error: null };
          }
        };
      }
    };
  }
};

// Export active client wrapper globally
const getSupabase = () => {
  if (isMockActive) {
    return supabaseSimulator;
  }
  return supabaseClient;
};

window.getSupabase = getSupabase;
window.initializeSupabase = initializeSupabase;

// Initialize
seedMockDatabase();
initializeSupabase();
