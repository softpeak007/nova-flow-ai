// Nova Flow AI Central Application Controller
// Orchestrates all SaaS features: Authentication, CRM, SVG Analytics, AI chatbot, campaigns, billing, workflows, developer panels, and Phase 2 automation modules.

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Supabase/Simulation client
  const db = window.getSupabase();

  // --- SELECTORS ---
  const publicLayout = document.getElementById("public-layout");
  const consoleLayout = document.getElementById("console-layout");
  
  // Auth Triggers
  const btnSignIn = document.getElementById("btn-signin");
  const btnLaunchConsole = document.getElementById("btn-launch-console");
  const btnSignOut = document.getElementById("btn-signout");
  const authOverlay = document.getElementById("auth-overlay");
  const authClose = document.getElementById("auth-close");
  const authTitle = document.getElementById("auth-title");
  const authSubtitle = document.getElementById("auth-subtitle");
  const authForm = document.getElementById("auth-form");
  const authBtn = document.getElementById("auth-btn");
  const authToggleLink = document.getElementById("auth-toggle-link");
  const authToggleText = document.getElementById("auth-toggle-text");
  
  // Nav Links
  const sidebarLinks = document.querySelectorAll(".menu-item");
  const tabContents = document.querySelectorAll(".tab-content");
  
  // Floating Chatbot Selector
  const floatingTrigger = document.getElementById("floating-trigger");
  const floatingWindow = document.getElementById("floating-window");
  const floatingClose = document.getElementById("floating-close");

  // State Management
  let isLoginMode = true;
  let activeTab = "overview";
  let userSession = null;
  let leadsData = [];
  let workflowsData = [];
  let campaignsData = [];
  let apikeysData = [];
  let subscriptionData = {};
  let selectedNode = null;
  let offset = { x: 0, y: 0 };

  // Phase 2 State Management
  let funnelsData = [];
  let callingLogsData = [];
  let coursesData = [];
  let lessonsData = [];
  let communityChannelsData = [];
  let communityPostsData = [];
  let appointmentsData = [];
  let socialChannelsData = [];
  let activeCommunityChannelId = "chn-1";

  // --- TOAST NOTIFICATIONS ---
  const showToast = (message) => {
    const toast = document.getElementById("toast-notification");
    if (toast) {
      toast.textContent = message;
      toast.classList.add("open");
      setTimeout(() => {
        toast.classList.remove("open");
      }, 3000);
    }
  };

  // --- SESSION CHECK ---
  const checkSession = async () => {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
      userSession = session.user;
      showToast("Session recovered successfully!");
      switchToConsole();
    } else {
      switchToPublic();
    }
  };

  // --- TRANSITION STATES ---
  const switchToConsole = async () => {
    if (publicLayout) publicLayout.style.display = "none";
    if (consoleLayout) consoleLayout.style.display = "flex";
    
    // Sync all dashboard data
    await syncProfile();
    await syncAllData();
    renderAllViews();
  };

  const switchToPublic = () => {
    if (consoleLayout) consoleLayout.style.display = "none";
    if (publicLayout) publicLayout.style.display = "block";
    userSession = null;
  };

  // --- AUTH FORM ACTION ---
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-email").value;
      const password = document.getElementById("auth-password").value;

      if (!email || !password) {
        showToast("Please provide all email & password fields.");
        return;
      }

      if (isLoginMode) {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) {
          showToast("Error logging in: " + error.message);
        } else {
          userSession = data.user;
          authOverlay.classList.remove("open");
          showToast("Welcome back to Nova Flow AI!");
          switchToConsole();
        }
      } else {
        const { data, error } = await db.auth.signUp({ email, password });
        if (error) {
          showToast("Error registering: " + error.message);
        } else {
          userSession = data.user;
          authOverlay.classList.remove("open");
          showToast("Welcome to Nova Flow AI SaaS Platform!");
          switchToConsole();
        }
      }
    });
  }

  // Toggle Auth mode
  if (authToggleLink) {
    authToggleLink.addEventListener("click", () => {
      isLoginMode = !isLoginMode;
      if (isLoginMode) {
        authTitle.textContent = "Sign In Console";
        authSubtitle.textContent = "Access your visual automation and CRM dashboard";
        authBtn.textContent = "LAUNCH AUTOMATION CONSOLE";
        authToggleText.textContent = "New to Nova Flow AI?";
        authToggleLink.textContent = "Create an Account";
      } else {
        authTitle.textContent = "Create Sandbox Account";
        authSubtitle.textContent = "Deploy workflows, manage campaigns, & AI agents";
        authBtn.textContent = "CREATE MY SAAS PLATFORM";
        authToggleText.textContent = "Already have an account?";
        authToggleLink.textContent = "Sign In";
      }
    });
  }

  // Auth Button actions
  if (btnSignIn) {
    btnSignIn.addEventListener("click", () => {
      isLoginMode = true;
      authOverlay.classList.add("open");
    });
  }

  if (btnLaunchConsole) {
    btnLaunchConsole.addEventListener("click", () => {
      isLoginMode = true;
      authOverlay.classList.add("open");
    });
  }

  if (authClose) {
    authClose.addEventListener("click", () => {
      authOverlay.classList.remove("open");
    });
  }

  if (btnSignOut) {
    btnSignOut.addEventListener("click", async () => {
      await db.auth.signOut();
      showToast("Signed out successfully!");
      switchToPublic();
    });
  }

  // Sidebar link clicks
  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      sidebarLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      
      const tabId = link.getAttribute("data-tab");
      activeTab = tabId;
      
      tabContents.forEach(content => {
        content.classList.remove("active");
        if (content.id === `${tabId}-tab`) {
          content.classList.add("active");
        }
      });

      renderAllViews();
    });
  });

  // --- PROFILE MANAGEMENT ---
  const syncProfile = async () => {
    const { data: profile } = await db.from("profiles").select("*").eq("id", userSession.id);
    const { data: sub } = await db.from("subscriptions").select("*").eq("user_id", userSession.id);
    
    if (profile) {
      const nameEl = document.getElementById("user-display-name");
      const emailEl = document.getElementById("user-display-email");
      const avatarEl = document.getElementById("avatar-letter");
      
      if (nameEl) nameEl.textContent = profile.organization_name || "Stitch Automations Corp";
      if (emailEl) emailEl.textContent = userSession.email;
      if (avatarEl) avatarEl.textContent = (profile.organization_name || "S").charAt(0).toUpperCase();
    }
    
    if (sub) {
      subscriptionData = sub;
      const planEl = document.getElementById("user-display-plan");
      if (planEl) planEl.textContent = sub.plan_tier || "Free";
    }
  };

  // --- DATA SYNC ---
  const syncAllData = async () => {
    const leadsRes = await db.from("leads").select("*").order("created_at", { ascending: false });
    leadsData = leadsRes.data || [];

    const wfRes = await db.from("workflows").select("*").order("created_at", { ascending: false });
    workflowsData = wfRes.data || [];

    const campRes = await db.from("whatsapp_campaigns").select("*").order("created_at", { ascending: false });
    campaignsData = campRes.data || [];

    const keyRes = await db.from("api_keys").select("*").order("created_at", { ascending: false });
    apikeysData = keyRes.data || [];

    // Phase 2 Data sync
    const fnRes = await db.from("funnels").select("*").order("created_at", { ascending: false });
    funnelsData = fnRes.data || [];

    const callRes = await db.from("call_logs").select("*").order("created_at", { ascending: false });
    callingLogsData = callRes.data || [];

    const crsRes = await db.from("courses").select("*").order("created_at", { ascending: false });
    coursesData = crsRes.data || [];

    const lsnRes = await db.from("lessons").select("*").order("sort_order", { ascending: true });
    lessonsData = lsnRes.data || [];

    const chnRes = await db.from("community_channels").select("*");
    communityChannelsData = chnRes.data || [];

    const pstRes = await db.from("community_posts").select("*").order("created_at", { ascending: false });
    communityPostsData = pstRes.data || [];

    const appRes = await db.from("appointments").select("*").order("start_time", { ascending: true });
    appointmentsData = appRes.data || [];

    const socRes = await db.from("social_integrations").select("*");
    socialChannelsData = socRes.data || [];
  };

  // --- VIEW RENDERER DISPATCH ---
  const renderAllViews = () => {
    if (activeTab === "overview") renderOverviewTab();
    else if (activeTab === "crm") renderCRMTab();
    else if (activeTab === "chatbot") renderChatbotTab();
    else if (activeTab === "whatsapp") renderWhatsAppTab();
    else if (activeTab === "workflows") renderWorkflowsTab();
    // Phase 2 dispatchers
    else if (activeTab === "funnels") renderFunnelsTab();
    else if (activeTab === "calling") renderCallingTab();
    else if (activeTab === "courses") renderCoursesTab();
    else if (activeTab === "community") renderCommunityTab();
    else if (activeTab === "calendar") renderCalendarTab();
    else if (activeTab === "social") renderSocialTab();
    // Billing/API
    else if (activeTab === "billing") renderBillingTab();
    else if (activeTab === "api") renderAPITab();
  };

  // --- 1. OVERVIEW VIEW ---
  const renderOverviewTab = () => {
    const totalLeads = leadsData.length;
    const closedDeals = leadsData.filter(l => l.stage === "Closed").length;
    const activeWfs = workflowsData.filter(w => w.is_active).length;
    
    let deliveredMessages = 0;
    campaignsData.forEach(c => deliveredMessages += c.delivered_count);

    const totalLeadsEl = document.getElementById("stat-total-leads");
    const closedDealsEl = document.getElementById("stat-closed-deals");
    const activeWfsEl = document.getElementById("stat-active-wfs");
    const deliveredMsgsEl = document.getElementById("stat-delivered-msgs");

    if (totalLeadsEl) totalLeadsEl.textContent = totalLeads;
    if (closedDealsEl) closedDealsEl.textContent = closedDeals;
    if (activeWfsEl) activeWfsEl.textContent = activeWfs;
    if (deliveredMsgsEl) deliveredMsgsEl.textContent = deliveredMessages || 142;

    const svgChart = document.getElementById("analytics-svg-chart");
    if (svgChart) {
      svgChart.innerHTML = "";
      
      const dates = [];
      for(let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      }
      
      const values = [5, 12, totalLeads - 1, totalLeads + 2, totalLeads + 5, totalLeads + 10, totalLeads + 15];
      
      let points = "";
      let labelsHtml = "";
      const width = svgChart.clientWidth || 550;
      const height = 180;
      const maxVal = Math.max(...values, 20);
      
      values.forEach((val, idx) => {
        const x = (idx / 6) * (width - 40) + 20;
        const y = height - (val / maxVal) * (height - 40) - 20;
        points += `${x},${y} `;
        
        labelsHtml += `<div style="position:absolute; left:${x-15}px; bottom: 0px; font-size: 10px; color:#64748b;">${dates[idx]}</div>`;
      });
      
      svgChart.innerHTML = `
        <polyline points="${points}" fill="none" stroke="#00eaff" stroke-width="3" />
        ${values.map((val, idx) => {
          const x = (idx / 6) * (width - 40) + 20;
          const y = height - (val / maxVal) * (height - 40) - 20;
          return `
            <circle cx="${x}" cy="${y}" r="4" fill="#8b5cf6" stroke="#00eaff" stroke-width="2" />
            <text x="${x}" y="${y-10}" font-size="10" fill="white" text-anchor="middle">${val}</text>
          `;
        }).join("")}
      `;
      
      const container = document.getElementById("chart-labels-container");
      if (container) container.innerHTML = labelsHtml;
    }

    const actList = document.getElementById("activity-log-list");
    if (actList) {
      actList.innerHTML = leadsData.slice(0, 4).map(lead => `
        <div class="activity-item">
          <div class="activity-icon">👤</div>
          <div>
            <strong>New Lead Saved: ${lead.name}</strong> has submitted custom automation request.
            <div style="font-size:11px; color:#00eaff; margin-top:2px;">AI Grade Match: ${lead.ai_score}%</div>
          </div>
          <div class="activity-time">${new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `).join("") || `
        <div class="activity-item">
          <div class="activity-icon">⚙️</div>
          <div>No recent operations recorded. System online.</div>
        </div>
      `;
    }
  };

  // --- 2. CRM & LEADS VIEW ---
  const renderCRMTab = () => {
    const tableBody = document.getElementById("crm-table-body");
    if (!tableBody) return;
    
    tableBody.innerHTML = leadsData.map(lead => `
      <tr>
        <td><strong>${lead.name}</strong></td>
        <td>${lead.whatsapp}</td>
        <td>${lead.service_needed || "AI Consulting"}</td>
        <td>
          <span class="badge-status ${lead.stage.toLowerCase()}">${lead.stage}</span>
        </td>
        <td>
          <span style="color: ${lead.ai_score > 80 ? '#22c55e' : '#eab308'}; font-weight:700;">
            ${lead.ai_score}%
          </span>
        </td>
        <td>
          <select class="form-control" style="padding: 4px 8px; font-size:12px; width:120px;" onchange="window.updateLeadStage('${lead.id}', this.value)">
            <option value="New" ${lead.stage === "New" ? "selected" : ""}>New</option>
            <option value="Contacted" ${lead.stage === "Contacted" ? "selected" : ""}>Contacted</option>
            <option value="Qualified" ${lead.stage === "Qualified" ? "selected" : ""}>Qualified</option>
            <option value="Closed" ${lead.stage === "Closed" ? "selected" : ""}>Closed</option>
          </select>
        </td>
        <td>
          <button class="btn secondary" style="padding: 6px 12px; font-size:11px;" onclick="window.deleteLead('${lead.id}')">Delete</button>
        </td>
      </tr>
    `).join("") || `
      <tr>
        <td colspan="7" style="text-align:center; padding: 40px; color:#64748b;">
          No leads registered yet. Deploy your landing page to trigger integrations.
        </td>
      </tr>
    `;
  };

  window.updateLeadStage = async (id, newStage) => {
    const { error } = await db.from("leads").update({ stage: newStage }).eq("id", id);
    if (error) {
      showToast("Error updating stage: " + error.message);
    } else {
      showToast("Lead CRM stage updated successfully!");
      await syncAllData();
      renderAllViews();
    }
  };

  window.deleteLead = async (id) => {
    const { error } = await db.from("leads").delete().eq("id", id);
    if (error) {
      showToast("Error deleting lead: " + error.message);
    } else {
      showToast("Lead catalog record deleted.");
      await syncAllData();
      renderAllViews();
    }
  };

  // Manual Lead Intake Form Listeners
  const btnAddLead = document.getElementById("btn-add-lead");
  const addLeadModal = document.getElementById("add-lead-modal");
  const addLeadClose = document.getElementById("add-lead-close");
  const addLeadForm = document.getElementById("add-lead-form");

  if (btnAddLead) btnAddLead.addEventListener("click", () => addLeadModal.classList.add("open"));
  if (addLeadClose) addLeadClose.addEventListener("click", () => addLeadModal.classList.remove("open"));

  if (addLeadForm) {
    addLeadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("lead-name").value;
      const whatsapp = document.getElementById("lead-whatsapp").value;
      const budget = document.getElementById("lead-budget").value || "Under $1,000";
      const service_needed = document.getElementById("lead-service").value;
      
      const randomScore = Math.floor(Math.random() * 40) + 60; // 60 - 99
      const aiSummary = randomScore > 80 ? "High intent client ready for visual automation." : "Mid intent traveler exploring custom packages.";

      const { error } = await db.from("leads").insert({
        user_id: userSession ? userSession.id : "guest-user",
        name,
        whatsapp,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        budget,
        timeline: "Immediate",
        service_needed,
        stage: "New",
        ai_score: randomScore,
        ai_summary: aiSummary,
        notes: "Manually registered lead record."
      });

      if (error) {
        showToast("Error adding lead: " + error.message);
      } else {
        showToast("Lead recorded successfully into CRM table!");
        addLeadForm.reset();
        addLeadModal.classList.remove("open");
        await syncAllData();
        renderAllViews();
      }
    });
  }

  // --- 3. AI AGENTS PLAYGROUND ---
  const renderChatbotTab = () => {
    const agentModel = document.getElementById("agent-model-select");
    const agentPrompt = document.getElementById("agent-prompt-system");
    
    if (agentModel && agentPrompt) {
      agentModel.addEventListener("change", () => {
        const selected = agentModel.value;
        if (selected === "strategist") {
          agentPrompt.value = "You are a professional Business Strategist AI Agent. Help the user optimize operations, evaluate revenue blueprints, design pricing structures, and improve lead acquisition metrics with high ROI.";
        } else if (selected === "analyst") {
          agentPrompt.value = "You are a deep-focus Analysis AI Agent. Analyze customer inquiries, extract budget matching potential, check RLS vulnerabilities, and evaluate quality triggers meticulously.";
        } else {
          agentPrompt.value = "You are a helpful Nova Flow AI Customer Assistant. Introduce products, answer billing and subscription integration queries, and help users connect their WhatsApp and Supabase databases.";
        }
      });
    }
  };

  // --- 4. WHATSAPP CAMPAIGNS VIEW ---
  const renderWhatsAppTab = () => {
    const campaignsContainer = document.getElementById("campaigns-list-grid");
    if (!campaignsContainer) return;

    campaignsContainer.innerHTML = campaignsData.map(c => `
      <div class="card ${c.status === "Running" ? "featured" : ""}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span class="badge" style="margin-bottom:0; font-size:10px; padding: 4px 10px;">${c.status}</span>
          <span style="font-size:11px; color:#64748b;">${new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        <h3 style="font-size:18px; margin-bottom:8px;">${c.name}</h3>
        <p style="font-style:italic; font-size:12px; margin-bottom:18px;">"${c.template_body}"</p>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; border-top:1px solid rgba(255, 255, 255, 0.05); padding-top:14px; font-size:12px;">
          <div>Sent: <strong>${c.sent_count} / ${c.total_recipients}</strong></div>
          <div>Delivered: <strong>${c.delivered_count}</strong></div>
          <div>Read Rate: <strong style="color:#00eaff;">${c.read_count}</strong></div>
        </div>

        ${c.status === "Draft" ? `
          <button class="btn" style="width:100%; margin-top:16px; padding:10px; font-size:12px;" onclick="window.triggerCampaignLaunch('${c.id}')">
            Launch Broadcast Campaign
          </button>
        ` : ''}
      </div>
    `).join("");
  };

  window.triggerCampaignLaunch = async (id) => {
    const campaign = campaignsData.find(c => c.id === id);
    if (!campaign) return;

    showToast(`Launching WhatsApp campaign broadblast: ${campaign.name}...`);
    await db.from("whatsapp_campaigns").update({ status: "Running" }).eq("id", id);
    await syncAllData();
    renderAllViews();

    // Mock progress interval simulation
    setTimeout(async () => {
      const total = campaign.total_recipients;
      const delivered = Math.max(1, total - Math.floor(Math.random() * 5));
      const read = Math.max(0, delivered - Math.floor(Math.random() * 15));

      await db.from("whatsapp_campaigns").update({
        status: "Completed",
        sent_count: total,
        delivered_count: delivered,
        read_count: read
      }).eq("id", id);

      showToast(`Broadcast finished! Delivered: ${delivered}/${total}. Read score: ${read}.`);
      await syncAllData();
      renderAllViews();
    }, 3000);
  };

  // WhatsApp Campaign Form Listeners
  const btnCreateCampaign = document.getElementById("btn-create-campaign");
  const campaignModal = document.getElementById("campaign-modal");
  const campaignClose = document.getElementById("campaign-close");
  const campaignForm = document.getElementById("campaign-form");

  if (btnCreateCampaign) btnCreateCampaign.addEventListener("click", () => campaignModal.classList.add("open"));
  if (campaignClose) campaignClose.addEventListener("click", () => campaignModal.classList.remove("open"));

  if (campaignForm) {
    campaignForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("campaign-name").value;
      const template_body = document.getElementById("campaign-template").value;
      const total_recipients = parseInt(document.getElementById("campaign-recipients-count").value) || 100;

      const { error } = await db.from("whatsapp_campaigns").insert({
        user_id: userSession ? userSession.id : "guest-user",
        name,
        template_body,
        status: "Draft",
        total_recipients,
        sent_count: 0,
        delivered_count: 0,
        read_count: 0
      });

      if (error) {
        showToast("Error creating campaign: " + error.message);
      } else {
        showToast("Campaign broadcast drafted successfully!");
        campaignForm.reset();
        campaignModal.classList.remove("open");
        await syncAllData();
        renderAllViews();
      }
    });
  }

  // --- 5. WORKFLOW BUILDER ---
  const renderWorkflowsTab = () => {
    const listWrapper = document.getElementById("workflows-sidebar-list");
    if (!listWrapper) return;
    
    listWrapper.innerHTML = workflowsData.map(wf => `
      <div class="activity-item" style="padding:12px; cursor:pointer; background:rgba(255,255,255,0.02); border: 1px solid ${wf.id === selectedWorkflowId ? 'rgba(0,234,255,0.3)' : 'rgba(255,255,255,0.05)'}; border-radius:12px;" onclick="window.selectWorkflow('${wf.id}')">
        <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
          <div style="display:flex; justify-content:space-between;">
            <strong style="color: ${wf.id === selectedWorkflowId ? '#00eaff' : 'white'};">${wf.name}</strong>
            <span style="font-size:10px; color:${wf.is_active ? '#00eaff' : '#64748b'};">${wf.is_active ? 'Active' : 'Paused'}</span>
          </div>
          <span style="font-size:11px; color:#64748b;">Telemetry Executions: ${wf.execution_count}</span>
        </div>
      </div>
    `).join("") || `<div>No active automation systems.</div>`;
    
    if (workflowsData.length > 0 && !selectedWorkflowId) {
      window.selectWorkflow(workflowsData[0].id);
    }
  };

  let selectedWorkflowId = null;

  window.selectWorkflow = (id) => {
    selectedWorkflowId = id;
    const wf = workflowsData.find(w => w.id === id);
    if (!wf) return;

    // Highlight active sidebar item
    const listWrapper = document.getElementById("workflows-sidebar-list");
    if (listWrapper) {
      const items = listWrapper.querySelectorAll(".activity-item");
      workflowsData.forEach((w, idx) => {
        const item = items[idx];
        if (item) {
          if (w.id === id) {
            item.style.borderColor = "rgba(0, 234, 255, 0.35)";
            item.style.boxShadow = "0 0 10px rgba(0, 234, 255, 0.1)";
          } else {
            item.style.borderColor = "rgba(255, 255, 255, 0.05)";
            item.style.boxShadow = "none";
          }
        }
      });
    }
    
    // Update toolbar details
    const canvasTitle = document.getElementById("wf-canvas-title");
    const canvasDesc = document.getElementById("wf-canvas-desc");
    const activeToggle = document.getElementById("wf-active-toggle");

    if (canvasTitle) canvasTitle.textContent = wf.name;
    if (canvasDesc) canvasDesc.textContent = wf.description;
    if (activeToggle) activeToggle.checked = wf.is_active;

    // Clear and render nodes on canvas
    const canvas = document.getElementById("wf-builder-canvas");
    if (!canvas) return;
    canvas.innerHTML = "";

    wf.nodes.forEach(node => {
      const nodeEl = document.createElement("div");
      nodeEl.className = "node-card";
      nodeEl.id = `node-${node.id}`;
      nodeEl.style.left = `${node.x}px`;
      nodeEl.style.top = `${node.y}px`;
      nodeEl.style.zIndex = "5";

      nodeEl.innerHTML = `
        <div class="node-header">
          <span>${node.type.toUpperCase()}</span>
          <span class="delete-node-btn" style="cursor:pointer; color:#ff4ecd; font-weight:bold; font-size:14px;" onclick="event.stopPropagation(); window.deleteWorkflowNode('${wf.id}', '${node.id}')">×</span>
        </div>
        <div class="node-title">${node.title}</div>
        <div class="node-desc">${node.desc}</div>
        ${node.type !== 'trigger' ? `<div class="node-port input"></div>` : ''}
        ${node.type !== 'action' || wf.edges.some(e => e.from === node.id) || true ? `<div class="node-port output"></div>` : ''}
      `;

      canvas.appendChild(nodeEl);

      // Drag and drop event listeners
      nodeEl.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("node-port") || e.target.classList.contains("delete-node-btn")) return;

        // Set selected active node border
        document.querySelectorAll(".node-card").forEach(card => card.classList.remove("selected"));
        nodeEl.classList.add("selected");

        const rect = nodeEl.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        const shiftX = e.clientX - rect.left;
        const shiftY = e.clientY - rect.top;

        const onMouseMove = (moveEvent) => {
          let x = moveEvent.clientX - canvasRect.left - shiftX;
          let y = moveEvent.clientY - canvasRect.top - shiftY;

          // Constraints
          x = Math.max(10, Math.min(x, canvasRect.width - rect.width - 10));
          y = Math.max(10, Math.min(y, canvasRect.height - rect.height - 10));

          nodeEl.style.left = `${x}px`;
          nodeEl.style.top = `${y}px`;

          node.x = x;
          node.y = y;

          // Redraw SVG connectors instantly
          drawEdges(wf);
        };

        const onMouseUp = async () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);

          // Save coordinates back to database row
          const updatedNodes = wf.nodes.map(n => n.id === node.id ? { ...n, x: node.x, y: node.y } : n);
          await db.from("workflows").update({ nodes: updatedNodes }).eq("id", wf.id);
          
          // Re-sync but don't re-render everything to preserve dragging continuity
          const freshWf = await db.from("workflows").select("*").order("created_at", { ascending: false });
          workflowsData = freshWf.data || [];
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    });

    // Draw lines
    drawEdges(wf);
  };

  const drawEdges = (wf) => {
    const svg = document.getElementById("wf-canvas-svg-lines");
    const canvas = document.getElementById("wf-builder-canvas");
    if (!svg || !canvas) return;
    svg.innerHTML = "";

    const canvasRect = canvas.getBoundingClientRect();

    wf.edges.forEach(edge => {
      const fromNode = document.getElementById(`node-${edge.from}`);
      const toNode = document.getElementById(`node-${edge.to}`);
      if (!fromNode || !toNode) return;

      const fromRect = fromNode.getBoundingClientRect();
      const toRect = toNode.getBoundingClientRect();

      const x1 = fromRect.right - canvasRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top;

      const x2 = toRect.left - canvasRect.left;
      const y2 = toRect.top + toRect.height / 2 - canvasRect.top;

      const ctrlDist = Math.abs(x2 - x1) * 0.5;
      const pathD = `M ${x1} ${y1} C ${x1 + ctrlDist} ${y1}, ${x2 - ctrlDist} ${y2}, ${x2} ${y2}`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathD);
      path.setAttribute("class", wf.is_active ? "connector-line active" : "connector-line");
      
      svg.appendChild(path);
    });
  };

  window.deleteWorkflowNode = async (wfId, nodeId) => {
    const wf = workflowsData.find(w => w.id === wfId);
    if (!wf) return;

    const updatedNodes = wf.nodes.filter(n => n.id !== nodeId);
    const updatedEdges = wf.edges.filter(e => e.from !== nodeId && e.to !== nodeId);

    await db.from("workflows").update({
      nodes: updatedNodes,
      edges: updatedEdges
    }).eq("id", wfId);

    showToast("Workflow pipeline node deleted.");
    await syncAllData();
    renderAllViews();
  };

  // Workflow Toolbar / Creation Listeners
  const activeToggle = document.getElementById("wf-active-toggle");
  if (activeToggle) {
    activeToggle.addEventListener("change", async () => {
      if (!selectedWorkflowId) return;
      const active = activeToggle.checked;
      
      const { error } = await db.from("workflows").update({ is_active: active }).eq("id", selectedWorkflowId);
      if (error) {
        showToast("Error toggling pipeline: " + error.message);
      } else {
        showToast(`Workflow automation pipeline set to ${active ? 'ACTIVE' : 'PAUSED'}.`);
        await syncAllData();
        renderAllViews();
      }
    });
  }

  const btnAddWorkflowSidebar = document.getElementById("btn-add-workflow-sidebar");
  if (btnAddWorkflowSidebar) {
    btnAddWorkflowSidebar.addEventListener("click", async () => {
      const name = prompt("Enter a name for this visual workflow:", "E-Commerce Qualification Flow");
      if (!name) return;
      const description = prompt("Enter a description:", "Handles payment link broadcasts on WhatsApp.");
      if (!description) return;

      // Default Template
      const defaultNodes = [
        { id: "n1", type: "trigger", title: "New Order Captured", desc: "Triggers on Stripe checkout", x: 40, y: 150 },
        { id: "n2", type: "action", title: "AI Receipt Builder", desc: "Generates beautiful details", x: 280, y: 150 },
        { id: "n3", type: "action", title: "WhatsApp Broadcaster", desc: "Sends alert with PDF link", x: 520, y: 150 }
      ];
      const defaultEdges = [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" }
      ];

      const { error, data } = await db.from("workflows").insert({
        user_id: userSession ? userSession.id : "guest-user",
        name,
        description,
        is_active: true,
        execution_count: 0,
        nodes: defaultNodes,
        edges: defaultEdges
      });

      if (error) {
        showToast("Error creating workflow: " + error.message);
      } else {
        showToast("Workflow pipeline designed & online!");
        await syncAllData();
        renderAllViews();
        if (data && data.length > 0) {
          window.selectWorkflow(data[0].id);
        }
      }
    });
  }

  // ===================================================
  // --- PHASE 2 CONTROLLERS & INTERACTIVE LOGIC ---
  // ===================================================

  // --- 8. AI FUNNEL BUILDER TAB ---
  const renderFunnelsTab = () => {
    const container = document.getElementById("funnels-list-grid");
    if (!container) return;

    container.innerHTML = funnelsData.map(fn => `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span class="badge" style="margin-bottom:0; font-size:10px; padding:4px 10px;">${fn.template_name}</span>
          <span style="font-size:11px; color:#64748b;">${new Date(fn.created_at).toLocaleDateString()}</span>
        </div>
        <h3 style="font-size:18px; margin-bottom:4px;">${fn.name}</h3>
        <a href="https://${fn.subdomain}.novaflow.ai" target="_blank" style="font-size:11px; color:#00eaff; display:block; margin-bottom:12px; text-decoration:none;">
          https://${fn.subdomain}.novaflow.ai <span class="material-icons-round" style="font-size:10px; vertical-align:middle;">open_in_new</span>
        </a>
        <p style="font-size:13px; color:#b8c1d9; margin-bottom:16px;">Headline: "${fn.page_title}"</p>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:14px; font-size:12px;">
          <div>Visitors: <strong>${fn.visitor_count}</strong></div>
          <div>Conversions: <strong style="color:#22c55e;">${fn.conversion_count}</strong></div>
        </div>
        
        <div style="display:flex; gap:10px; margin-top:16px;">
          <button class="btn secondary" style="flex:1; padding:8px; font-size:11px;" onclick="window.previewFunnel('${fn.id}')">Preview</button>
          <button class="btn secondary" style="flex:1; padding:8px; font-size:11px; border-color:#ff4ecd; color:#ff4ecd;" onclick="window.deleteFunnel('${fn.id}')">Revoke</button>
        </div>
      </div>
    `).join("") || `<div style="text-align:center; color:#64748b; padding:40px;">No custom funnels deployed yet.</div>`;
  };

  const btnCreateFunnel = document.getElementById("btn-create-funnel");
  const addFunnelModal = document.getElementById("add-funnel-modal");
  const addFunnelClose = document.getElementById("add-funnel-close");
  const addFunnelForm = document.getElementById("add-funnel-form");

  if (btnCreateFunnel) btnCreateFunnel.addEventListener("click", () => addFunnelModal.classList.add("open"));
  if (addFunnelClose) addFunnelClose.addEventListener("click", () => addFunnelModal.classList.remove("open"));

  if (addFunnelForm) {
    addFunnelForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("funnel-name").value;
      const subdomain = document.getElementById("funnel-subdomain").value;
      const page_title = document.getElementById("funnel-title").value;
      const page_description = document.getElementById("funnel-desc").value;

      const { error } = await db.from("funnels").insert({
        user_id: userSession.id,
        name,
        subdomain,
        page_title,
        page_description,
        template_name: "Modern Dark",
        visitor_count: 0,
        conversion_count: 0
      });

      if (error) {
        showToast("Error creating funnel subdomain: " + error.message);
      } else {
        showToast("Funnel successfully designed & compiled!");
        addFunnelForm.reset();
        addFunnelModal.classList.remove("open");
        await syncAllData();
        renderAllViews();
      }
    });
  }

  window.deleteFunnel = async (id) => {
    const { error } = await db.from("funnels").delete().eq("id", id);
    if (error) showToast("Error deleting: " + error.message);
    else {
      showToast("Funnel deployment revoked successfully.");
      await syncAllData();
      renderAllViews();
    }
  };

  window.previewFunnel = (id) => {
    const fn = funnelsData.find(f => f.id === id);
    if (!fn) return;
    alert(`AI Funnel Preview:\n\nTitle: "${fn.page_title}"\nDescription: "${fn.page_description}"\nSubdomain: https://${fn.subdomain}.novaflow.ai\nActive Forms Fields: ${fn.form_fields.join(", ")}`);
  };

  // --- 9. AUTO CALLING DIALER TAB ---
  const renderCallingTab = () => {
    const tableBody = document.getElementById("calling-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = callingLogsData.map(log => `
      <tr>
        <td><strong>${log.name || "Unknown Lead"}</strong></td>
        <td>${log.phone_number}</td>
        <td>
          <span class="badge-status ${log.status === 'Answered' ? 'qualified' : log.status === 'Ringing' ? 'new' : 'closed'}">${log.status}</span>
        </td>
        <td>${log.duration}s</td>
        <td>
          ${log.recording_url ? `
            <button class="btn secondary" style="padding:4px 8px; font-size:10px;" onclick="window.playVoiceRecording('${log.recording_url}')">
              <span class="material-icons-round" style="font-size:11px; vertical-align:middle;">play_arrow</span> Play
            </button>
          ` : '<span style="color:#64748b; font-style:italic;">No recording</span>'}
        </td>
      </tr>
    `).join("") || `
      <tr>
        <td colspan="5" style="text-align:center; padding: 40px; color:#64748b;">
          No call logs generated yet. Launch your calling queue.
        </td>
      </tr>
    `;

    // Setup queue counter display
    const counter = document.getElementById("dialer-queue-counter");
    if (counter) {
      const pendingCount = leadsData.filter(l => l.stage === "New").length;
      counter.textContent = `0 / ${pendingCount}`;
    }
  };

  window.playVoiceRecording = (url) => {
    showToast("Streaming voice recording playback...");
    const audio = new Audio(url);
    audio.play();
  };

  // Call queue dialer campaign logic simulator
  const btnTriggerDialer = document.getElementById("btn-trigger-dialer");
  if (btnTriggerDialer) {
    btnTriggerDialer.addEventListener("click", () => {
      const pendingLeads = leadsData.filter(l => l.stage === "New" || l.stage === "Contacted");
      if (pendingLeads.length === 0) {
        showToast("Auto Dialer queue is currently empty.");
        return;
      }

      showToast("Initializing automated cold dialer campaigns...");
      const statusPill = document.getElementById("dialer-status-pill");
      const counter = document.getElementById("dialer-queue-counter");
      const scriptText = document.getElementById("dialer-script").value;

      statusPill.textContent = "Calling Queue Active...";
      statusPill.style.color = "#00eaff";

      let currentIdx = 0;
      const processNextCall = async () => {
        if (currentIdx >= pendingLeads.length) {
          statusPill.textContent = "Idle";
          statusPill.style.color = "#64748b";
          showToast("Cold call dialer sequence completed successfully!");
          return;
        }

        const lead = pendingLeads[currentIdx];
        counter.textContent = `${currentIdx + 1} / ${pendingLeads.length}`;
        showToast(`Ringing contact: ${lead.name} (${lead.whatsapp})...`);

        setTimeout(async () => {
          // 80% Answer rate simulated logic
          const answered = Math.random() > 0.2;
          const status = answered ? "Answered" : "Voice Mail";
          const duration = answered ? Math.floor(Math.random() * 40) + 15 : 12;

          await db.from("call_logs").insert({
            user_id: userSession.id,
            lead_id: lead.id,
            name: lead.name,
            phone_number: lead.whatsapp,
            status,
            duration,
            recording_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
            call_script: scriptText
          });

          // Mark lead contacted in CRM automatically!
          await db.from("leads").update({ stage: "Contacted" }).eq("id", lead.id);

          showToast(`Call finished with ${lead.name}: ${status} (${duration}s)`);
          
          await syncAllData();
          renderAllViews();

          currentIdx++;
          setTimeout(processNextCall, 3000); // Wait 3s before next call
        }, 3000);
      };

      processNextCall();
    });
  }

  // --- 10. COURSE HOSTING TAB ---
  const renderCoursesTab = () => {
    const container = document.getElementById("courses-list-grid");
    if (!container) return;

    container.innerHTML = coursesData.map(crs => {
      const lessons = lessonsData.filter(l => l.course_id === crs.id);
      return `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-size:28px;">${crs.cover_image}</span>
            <span class="badge" style="margin-bottom:0; font-size:10px; padding:4px 10px;">LMS Portal</span>
          </div>
          <h3 style="font-size:18px; margin-bottom:4px;">${crs.title}</h3>
          <p style="font-size:13px; color:#b8c1d9; margin-bottom:12px;">${crs.description}</p>
          <div style="font-size:11px; color:#64748b; margin-bottom:16px;">Lectures count: <strong>${lessons.length} Modules</strong></div>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:14px; font-size:12px;">
            <div>Tier Price: <strong>₹${crs.price}</strong></div>
            <div>Students: <strong style="color:#22c55e;">${crs.student_count}</strong></div>
          </div>
          
          <button class="btn secondary" style="width:100%; margin-top:16px; padding:8px; font-size:11px;" onclick="window.manageCourseLessons('${crs.id}')">
            Manage Video Lectures
          </button>
        </div>
      `;
    }).join("") || `<div style="text-align:center; color:#64748b; padding:40px;">No active training courses hosted yet.</div>`;
  };

  const btnCreateCourse = document.getElementById("btn-create-course");
  const addCourseModal = document.getElementById("add-course-modal");
  const addCourseClose = document.getElementById("add-course-close");
  const addCourseForm = document.getElementById("add-course-form");

  if (btnCreateCourse) btnCreateCourse.addEventListener("click", () => addCourseModal.classList.add("open"));
  if (addCourseClose) addCourseClose.addEventListener("click", () => addCourseModal.classList.remove("open"));

  if (addCourseForm) {
    addCourseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("course-title").value;
      const desc = document.getElementById("course-desc").value;
      const price = parseInt(document.getElementById("course-price").value) || 4999;
      const cover = document.getElementById("course-cover").value;

      const { error } = await db.from("courses").insert({
        user_id: userSession.id,
        title,
        description: desc,
        price,
        cover_image: cover,
        student_count: 0
      });

      if (error) {
        showToast("Error creating course: " + error.message);
      } else {
        showToast("LMS course portal configured successfully!");
        addCourseForm.reset();
        addCourseModal.classList.remove("open");
        await syncAllData();
        renderAllViews();
      }
    });
  }

  window.manageCourseLessons = (id) => {
    const course = coursesData.find(c => c.id === id);
    if (!course) return;

    const title = prompt("Enter a title for the new video lecture:", "Unit 1: Setting up Supabase variables");
    if (!title) return;

    db.from("lessons").insert({
      course_id: id,
      title,
      video_url: "https://vimeo.com/mock-video",
      duration: 15,
      sort_order: lessonsData.filter(l => l.course_id === id).length + 1
    }).then(async ({ error }) => {
      if (error) showToast("Error adding lesson: " + error.message);
      else {
        showToast("Lesson compiled successfully into portal!");
        await syncAllData();
        renderAllViews();
      }
    });
  };

  // --- 11. COMMUNITY FORUMS TAB ---
  const renderCommunityTab = () => {
    const spacesList = document.getElementById("community-spaces-list");
    if (!spacesList) return;

    spacesList.innerHTML = `
      <h3>Discussions Spaces</h3>
      ${communityChannelsData.map(chn => `
        <div class="menu-item ${chn.id === activeCommunityChannelId ? 'active' : ''}" style="padding:10px; border-radius:10px;" onclick="window.selectCommunitySpace('${chn.id}')">
          <span style="font-size:16px;">#</span> ${chn.name}
        </div>
      `).join("")}
    `;

    // Render active channel threads
    const activeChannel = communityChannelsData.find(c => c.id === activeCommunityChannelId);
    if (activeChannel) {
      document.getElementById("active-space-title").textContent = activeChannel.name;
      
      const threadsList = document.getElementById("community-threads-list");
      const activePosts = communityPostsData.filter(p => p.channel_id === activeCommunityChannelId);
      
      // Calculate mock members count dynamically
      document.getElementById("active-space-members").textContent = `${activePosts.length * 12 + 14} Members`;

      threadsList.innerHTML = activePosts.map(post => `
        <div class="activity-item" style="padding:14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; display:flex; flex-direction:column; gap:10px; width:100%;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">${post.author_avatar || '👤'}</span>
              <div>
                <strong>${post.author_name}</strong>
                <span style="font-size:10px; color:#64748b; display:block;">${new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <button class="btn secondary" style="padding:4px 10px; font-size:10px; border-color:#00eaff;" onclick="window.likeCommunityPost('${post.id}')">
              ❤️ ${post.likes} Likes
            </button>
          </div>
          <p style="font-size:13px; color:#b8c1d9; line-height:1.5;">${post.content}</p>
        </div>
      `).join("") || `<div style="text-align:center; padding:20px; color:#64748b;">No discussion threads created yet. Start a topic above!</div>`;
    }
  };

  window.selectCommunitySpace = (id) => {
    activeCommunityChannelId = id;
    renderCommunityTab();
  };

  // Add thread post
  const communityForm = document.getElementById("community-post-form");
  if (communityForm) {
    communityForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = document.getElementById("community-post-input").value;
      const profile = JSON.parse(localStorage.getItem("novaflow_mock_profile")) || { organization_name: "Developer Guest" };
      
      const { error } = await db.from("community_posts").insert({
        channel_id: activeCommunityChannelId,
        author_name: profile.organization_name || "Stitch Developer",
        author_avatar: "⚡",
        content,
        likes: 0
      });

      if (error) {
        showToast("Error publishing post: " + error.message);
      } else {
        showToast("Discussion thread successfully created!");
        communityForm.reset();
        await syncAllData();
        renderAllViews();
      }
    });
  }

  window.likeCommunityPost = async (id) => {
    const post = communityPostsData.find(p => p.id === id);
    if (!post) return;

    await db.from("community_posts").update({ likes: post.likes + 1 }).eq("id", id);
    await syncAllData();
    renderAllViews();
  };

  // --- 12. CALENDAR BOOKING TAB ---
  const renderCalendarTab = () => {
    const tableBody = document.getElementById("appointments-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = appointmentsData.map(app => `
      <tr>
        <td><strong>${app.client_name}</strong></td>
        <td>${app.client_whatsapp}</td>
        <td>${new Date(app.start_time).toLocaleString()}</td>
        <td>${app.duration} Mins</td>
        <td>
          <span class="badge-status ${app.status === 'Scheduled' ? 'new' : app.status === 'Completed' ? 'qualified' : 'closed'}">${app.status}</span>
        </td>
        <td>
          <button class="btn secondary" style="padding:4px 8px; font-size:10px;" onclick="window.cancelAppointment('${app.id}')">Cancel</button>
        </td>
      </tr>
    `).join("") || `
      <tr>
        <td colspan="6" style="text-align:center; padding: 40px; color:#64748b;">
          No calendar slot meetings booked yet.
        </td>
      </tr>
    `;
  };

  const btnCreateBooking = document.getElementById("btn-create-booking");
  const addBookingModal = document.getElementById("add-booking-modal");
  const addBookingClose = document.getElementById("add-booking-close");
  const addBookingForm = document.getElementById("add-booking-form");

  if (btnCreateBooking) btnCreateBooking.addEventListener("click", () => addBookingModal.classList.add("open"));
  if (addBookingClose) addBookingClose.addEventListener("click", () => addBookingModal.classList.remove("open"));

  if (addBookingForm) {
    addBookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const client_name = document.getElementById("booking-client").value;
      const client_whatsapp = document.getElementById("booking-whatsapp").value;
      const start_time = document.getElementById("booking-time").value;
      const duration = parseInt(document.getElementById("calendar-slot-duration").value) || 30;

      // Basic scheduling clash validation check
      const inputTime = new Date(start_time).getTime();
      const clash = appointmentsData.some(app => {
        const appTime = new Date(app.start_time).getTime();
        return Math.abs(inputTime - appTime) < 30 * 60000; // less than 30 mins difference
      });

      if (clash) {
        showToast("⚠️ Calendar booking clash detected! Choose another slot.");
        return;
      }

      const { error } = await db.from("appointments").insert({
        user_id: userSession.id,
        client_name,
        client_whatsapp,
        start_time: new Date(start_time).toISOString(),
        duration,
        status: "Scheduled",
        notes: "SaaS automation review session."
      });

      if (error) {
        showToast("Error creating booking: " + error.message);
      } else {
        showToast("Calendar booking slot confirmed!");
        addBookingForm.reset();
        addBookingModal.classList.remove("open");
        await syncAllData();
        renderAllViews();
      }
    });
  }

  window.cancelAppointment = async (id) => {
    const { error } = await db.from("appointments").update({ status: "Cancelled" }).eq("id", id);
    if (error) showToast("Error cancelling: " + error.message);
    else {
      showToast("Calendar appointment slot cancelled.");
      await syncAllData();
      renderAllViews();
    }
  };

  // --- 13. SOCIAL CONNECT TAB ---
  const renderSocialTab = () => {
    const container = document.getElementById("social-channels-container");
    if (!container) return;

    container.innerHTML = socialChannelsData.map(ch => `
      <div class="billing-plan-card" style="margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:24px;">🌐</span>
          <div>
            <strong style="display:block;">${ch.account_name}</strong>
            <span style="font-size:11px; color:#64748b;">Followers: ${ch.follower_count} | Platform: ${ch.platform}</span>
          </div>
        </div>
        <div>
          ${ch.is_connected ? `
            <span class="badge" style="margin-bottom:0; font-size:10px; background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.3); color:#22c55e;">
              Active Sync
            </span>
          ` : `
            <button class="btn secondary" style="padding:6px 12px; font-size:11px;" onclick="window.connectSocialChannel('${ch.id}')">
              Connect
            </button>
          `}
        </div>
      </div>
    `).join("");
  };

  window.connectSocialChannel = async (id) => {
    showToast("Authorizing social account permissions via OAuth portal...");
    
    setTimeout(async () => {
      await db.from("social_integrations").update({ 
        is_connected: true,
        follower_count: 5290
      }).eq("id", id);

      showToast("Social profile connected successfully!");
      await syncAllData();
      renderAllViews();
    }, 1500);
  };

  // Auto-reply rule creator
  const ruleForm = document.getElementById("social-rule-form");
  if (ruleForm) {
    ruleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const keyword = document.getElementById("social-rule-keyword").value;
      const reply = document.getElementById("social-rule-reply").value;

      // Fetch first active channel to append rules
      const activeChannel = socialChannelsData.find(c => c.is_connected);
      if (!activeChannel) {
        showToast("⚠️ Connect at least one active social channel first.");
        return;
      }

      const updatedRules = [...activeChannel.auto_reply_rules, { keyword, reply }];

      const { error } = await db.from("social_integrations").update({
        auto_reply_rules: updatedRules
      }).eq("id", activeChannel.id);

      if (error) {
        showToast("Error saving rule: " + error.message);
      } else {
        showToast("Auto-Reply keyword trigger created successfully!");
        ruleForm.reset();
        await syncAllData();
        renderAllViews();
      }
    });
  }

  // --- 6. SUBSCRIPTION & PAYMENTS (Stripe Gateway Simulator) ---
  const renderBillingTab = () => {
    const tier = subscriptionData.plan_tier || "Free";
    document.getElementById("billing-active-plan").textContent = tier;
    
    const invoicesContainer = document.getElementById("billing-invoices-list");
    if (!invoicesContainer) return;

    if (tier === "Free") {
      invoicesContainer.innerHTML = `<div style="text-align:center; color:#64748b; padding:12px;">No active transactions on Free tier. Upgrade plan to test Stripe.</div>`;
    } else {
      invoicesContainer.innerHTML = `
        <div class="billing-plan-card" style="margin-top:12px; background:rgba(255,255,255,0.01); padding: 12px 18px; border-radius:12px; font-size:12px;">
          <div>#INV-4299 - Subscription Renewal (${tier} Package)</div>
          <div>${tier === "Starter" ? "₹2,999" : tier === "Growth" ? "₹6,999" : "₹14,999"}</div>
          <div style="color:#10b981; font-weight:700;">Paid</div>
          <button class="btn secondary" style="padding:4px 8px; font-size:10px;" onclick="window.downloadMockInvoice()">Download PDF</button>
        </div>
      `;
    }
  };

  window.downloadMockInvoice = () => {
    showToast("Downloading transaction invoice proof...");
    setTimeout(() => {
      showToast("Invoice PDF saved to computer successfully!");
    }, 1000);
  };

  // Checkout overlay simulator
  const btnUpgradeStarter = document.getElementById("btn-upgrade-starter");
  const btnUpgradeGrowth = document.getElementById("btn-upgrade-growth");
  const btnUpgradePremium = document.getElementById("btn-upgrade-premium");
  const stripeModal = document.getElementById("stripe-modal");
  const stripeClose = document.getElementById("stripe-close");
  const stripeForm = document.getElementById("stripe-form");
  let selectedPlanToUpgrade = "Free";

  const openUpgradeCheckout = (planName) => {
    selectedPlanToUpgrade = planName;
    document.getElementById("checkout-plan-name").textContent = `${planName} Package`;
    document.getElementById("checkout-price").textContent = planName === "Starter" ? "₹2,999 / month" : planName === "Growth" ? "₹6,999 / month" : "₹14,999 / month";
    stripeModal.classList.add("open");
  };

  if (btnUpgradeStarter) btnUpgradeStarter.addEventListener("click", () => openUpgradeCheckout("Starter"));
  if (btnUpgradeGrowth) btnUpgradeGrowth.addEventListener("click", () => openUpgradeCheckout("Growth"));
  if (btnUpgradePremium) btnUpgradePremium.addEventListener("click", () => openUpgradeCheckout("Premium"));
  
  if (stripeClose) stripeClose.addEventListener("click", () => stripeModal.classList.remove("open"));

  if (stripeForm) {
    stripeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showToast("Authorizing transaction with Stripe Gateway...");
      
      setTimeout(async () => {
        const { error } = await db.from("subscriptions").update({
          plan_tier: selectedPlanToUpgrade,
          stripe_subscription_id: "sub_mock_" + Math.random().toString(36).substring(2, 9),
          current_period_end: new Date(Date.now() + 86400000 * 30).toISOString()
        }).eq("user_id", userSession.id);

        if (error) {
          showToast("Payment authorization failed: " + error.message);
        } else {
          showToast(`Stripe Upgrade Complete! You are now on the ${selectedPlanToUpgrade} Package.`);
          stripeForm.reset();
          stripeModal.classList.remove("open");
          await syncProfile();
          await syncAllData();
          renderAllViews();
        }
      }, 2000);
    });
  }

  // --- 7. DEVELOPER KEYS & API CENTER ---
  const renderAPITab = () => {
    const list = document.getElementById("api-keys-list");
    if (!list) return;

    list.innerHTML = apikeysData.map(key => `
      <div class="billing-plan-card" style="margin-bottom:12px; font-size:13px;">
        <div>
          <strong>${key.name}</strong><br>
          <span style="font-family:monospace; color:#64748b;">Prefix: ${key.key_prefix}*********</span>
        </div>
        <div>Queries: <strong>${key.usage_count}</strong></div>
        <button class="btn secondary" style="padding:6px 12px; font-size:11px;" onclick="window.revokeApiKey('${key.id}')">Revoke</button>
      </div>
    `).join("") || `<div style="text-align:center; color:#64748b; padding:12px;">No active API credential tokens generated yet.</div>`;
  };

  // Generate Key action
  const btnCreateApiKey = document.getElementById("btn-create-apikey");
  if (btnCreateApiKey) {
    btnCreateApiKey.addEventListener("click", async () => {
      const name = prompt("Enter a label description for this API Token:", "Internal CRM hook key");
      if (!name) return;

      const randomPrefix = "nv_live_" + Math.random().toString(36).substring(2, 6);
      const hashedValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const { error } = await db.from("api_keys").insert({
        user_id: userSession.id,
        name,
        key_prefix: randomPrefix,
        hashed_key: hashedValue,
        usage_count: 0
      });

      if (error) {
        showToast("Error generating key: " + error.message);
      } else {
        alert(`API Token generated successfully! Use this token in auth headers:\n\n${randomPrefix}_${hashedValue}\n\nWarning: Store this token carefully. It will not be shown again.`);
        await syncAllData();
        renderAllViews();
      }
    });
  }

  window.revokeApiKey = async (id) => {
    const { error } = await db.from("api_keys").delete().eq("id", id);
    if (error) {
      showToast("Error revoking: " + error.message);
    } else {
      showToast("API credential revoked from access gateways.");
      await syncAllData();
      renderAllViews();
    }
  };

  // Interactive developer Query Tester sandbox tool
  const btnTestEndpoint = document.getElementById("btn-test-endpoint");
  const testResponse = document.getElementById("test-query-response");
  if (btnTestEndpoint) {
    btnTestEndpoint.addEventListener("click", () => {
      showToast("Triggering telemetry fetch...");
      testResponse.textContent = "... Fetching dynamic telemetry from /api/v1/leads ...";
      
      setTimeout(() => {
        testResponse.textContent = JSON.stringify({
          status: "success",
          timestamp: new Date().toISOString(),
          telemetry: {
            active_auth_sessions: 1,
            profile: "Stitch Automations Corp",
            subscription: subscriptionData.plan_tier || "Free",
            crm_records_returned: leadsData.length,
            leads: leadsData.slice(0,2)
          }
        }, null, 2);
      }, 1000);
    });
  }

  // --- FLOATING PUBLIC WEB CHATBOT WIDGET LOGIC ---
  if (floatingTrigger) {
    floatingTrigger.addEventListener("click", () => {
      floatingWindow.classList.toggle("open");
    });
  }
  
  if (floatingClose) {
    floatingClose.addEventListener("click", () => {
      floatingWindow.classList.remove("open");
    });
  }

  // Floating Chatbot interaction
  const floatInput = document.getElementById("float-chat-input");
  const btnSendFloat = document.getElementById("btn-send-float");
  const floatMsgs = document.getElementById("float-chat-messages");

  const handleFloatSendMessage = () => {
    const text = floatInput.value.trim();
    if (!text) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg user";
    msgDiv.textContent = text;
    floatMsgs.appendChild(msgDiv);
    
    floatInput.value = "";
    floatMsgs.scrollTop = floatMsgs.scrollHeight;

    setTimeout(() => {
      const botDiv = document.createElement("div");
      botDiv.className = "chat-msg bot";
      
      let reply = "Thanks for your message! Our AI Lead Qualifiers are analyzing your request. Would you like to schedule a free demo call or chat on WhatsApp?";
      const lower = text.toLowerCase();
      if (lower.includes("pricing") || lower.includes("cost") || lower.includes("plan")) {
        reply = "Nova Flow AI plans start at ₹2,999/mo (Starter) up to ₹14,999+/mo (Premium automation setups). Would you like to review packages in detail?";
      } else if (lower.includes("demo") || lower.includes("book") || lower.includes("call")) {
        reply = "Excellent! You can book a free customization demo directly using the form on this page or by replying with your contact WhatsApp number.";
      }
      
      botDiv.textContent = reply;
      floatMsgs.appendChild(botDiv);
      floatMsgs.scrollTop = floatMsgs.scrollHeight;
    }, 1000);
  };

  if (btnSendFloat) {
    btnSendFloat.addEventListener("click", handleFloatSendMessage);
    floatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleFloatSendMessage();
    });
  }

  // Startup session trigger
  checkSession();
});
