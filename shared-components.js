/**
 * SharedComponents - A tactical UI component library for SWAF C2 STRATOS.
 * Handles the injection of Header and Sidebar to ensure "Clean Code" and eliminate redundancy.
 */

const SharedComponents = {
    style: `
        :root {
            --sidebar-width: 80px;
            --header-height: 48px;
            --ai-accent: #82cfff;
            --hitl-danger: #ff5252;
        }
        body.sidebar-expanded {
            --sidebar-width: 260px;
        }
        #main-wrapper {
            padding-left: var(--sidebar-width);
            transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 100%;
        }
        aside {
            width: var(--sidebar-width);
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .submenu-item {
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.2s ease-out;
            pointer-events: none;
        }
        .sidebar-expanded .submenu-item {
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
        }
        .sidebar-expanded .menu-label {
            opacity: 1;
            width: auto;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(130, 207, 255, 0.2);
        }
        @media (max-width: 900px) {
            .shared-search {
                display: none;
            }
            .shared-header-tools {
                gap: 0.5rem;
            }
            #ai-threat-container {
                max-width: 150px;
                padding-left: 0.5rem;
                padding-right: 0.5rem;
            }
            #ai-threat-container .threat-meter-track {
                width: 4.5rem;
            }
            .shared-status-text {
                display: none;
            }
        }
    `,

    header: `
        <header class="fixed top-0 w-full h-12 flex justify-between items-center gap-3 px-4 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
            <div class="flex items-center gap-4 min-w-0">
                <span class="font-['Space_Grotesk'] font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest text-xs whitespace-nowrap truncate">C2 // TACTICAL OVERWATCH</span>
            </div>
            <div class="shared-header-tools flex flex-1 justify-end items-center gap-4 min-w-0">
                <!-- Search Bar -->
                <div class="shared-search relative hidden md:flex items-center w-64 max-w-[28vw] border border-outline-variant bg-surface-container/50 px-2 h-7">
                    <span class="material-symbols-outlined text-[16px] text-outline mr-2">search</span>
                    <input aria-label="Query database" class="bg-transparent border-none outline-none text-data-mono font-data-mono text-on-surface w-full p-0 placeholder-outline" placeholder="QUERY DATABASE..." type="search"/>
                </div>
                <div class="flex items-center gap-3 font-['Space_Grotesk'] font-bold uppercase tracking-tighter text-xs min-w-0">
                    <!-- AI Threat Meter -->
                    <div id="ai-threat-container" class="flex items-center gap-2 border-x border-slate-800 px-4 h-7 shrink-0">
                        <span class="text-slate-500 text-[9px]">AI THREAT</span>
                        <div class="threat-meter-track w-32 h-2 bg-slate-900 border border-slate-800 relative overflow-hidden">
                            <div id="ai-threat-bar" class="absolute top-0 left-0 h-full bg-sky-500 transition-all duration-1000" style="width: 0%"></div>
                        </div>
                        <span id="ai-threat-value" class="text-sky-500 w-8">0%</span>
                    </div>
                    <span class="shared-status-text text-error whitespace-nowrap">THREAT: ALPHA</span>
                    <span class="text-slate-500" id="shared-zulu-clock">ZULU 00:00:00</span>
                </div>
                <!-- AI Pipeline Phase Indicator -->
                <div id="ai-phase-indicator" class="hidden sm:flex items-center gap-1 border border-slate-800 px-2 py-0.5 shrink-0">
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-700" id="ai-phase-dot"></span>
                    <span id="ai-phase-label" class="text-[8px] font-['Space_Grotesk'] font-bold text-slate-700 uppercase tracking-widest whitespace-nowrap">AI OFFLINE</span>
                </div>
                <div class="hidden lg:flex items-center gap-1 shrink-0">
                    <button type="button" aria-label="Satellite layer" class="text-slate-500 hover:text-sky-300 hover:bg-slate-800/50 p-1 duration-75 ease-in-out">
                        <span class="material-symbols-outlined text-[20px]">satellite_alt</span>
                    </button>
                    <button type="button" aria-label="Radar layer" class="text-slate-500 hover:text-sky-300 hover:bg-slate-800/50 p-1 duration-75 ease-in-out">
                        <span class="material-symbols-outlined text-[20px]">radar</span>
                    </button>
                    <button type="button" aria-label="System inputs" class="text-slate-500 hover:text-sky-300 hover:bg-slate-800/50 p-1 duration-75 ease-in-out">
                        <span class="material-symbols-outlined text-[20px]">settings_input_component</span>
                    </button>
                </div>
            </div>
        </header>
    `,

    sidebar: (currentPage) => {
        const menuItems = [
            { 
                id: 'map', 
                label: 'Map View', 
                icon: 'map', 
                href: './map-view.html',
                subItems: [
                    { label: 'Map View', icon: 'map', href: './map-view.html' },
                    { label: 'Tactical Map', icon: 'explore', href: './tactical-map.html' },
                    { label: 'Threat Intel', icon: 'warning', href: './threat-intel.html' },
                    { label: 'Battery Status', icon: 'battery_charging_full', href: './battery-status.html' },
                    { label: 'Logistics', icon: 'local_shipping', href: './logistics.html' }
                ]
            },
            { id: 'assets', label: 'Asset Ready', icon: 'flight_takeoff', href: './Asset-ready.html' },
            { id: 'fusion', label: 'Sensor Fusion', icon: 'sensors', href: './Sensor-Fusion.html' },
            { id: 'sensor-map', label: 'Sensor_map', icon: 'map_search', href: './sensor_map.html' },
            { id: 'comms', label: 'Comms', icon: 'satellite', href: './comms.html' },
            { 
                id: 'logs', 
                label: 'Logs & Intel', 
                icon: 'history_edu', 
                href: './mission_logs.html',
                subItems: [
                    { label: 'Mission Logs', icon: 'history_edu', href: './mission_logs.html' },
                    { label: 'Asset Tracking', icon: 'navigation', href: './asset-tracking.html' },
                    { label: 'Telemetry', icon: 'query_stats', href: './telemetry.html' },
                    { label: 'Intel Brief', icon: 'description', href: './intel-brief.html' }
                ]
            },
        ];

        const isExpanded = typeof document !== 'undefined' && document.body.classList.contains('sidebar-expanded');

        const linksHtml = menuItems.map(item => {
            const isParentActive = currentPage.includes(item.href.replace('./', '')) && item.href !== '#';
            const isChildActive = item.subItems ? item.subItems.some(sub => currentPage.includes(sub.href.replace('./', '')) && sub.href !== '#') : false;
            const isActive = isParentActive || isChildActive;
            const hasSubmenu = item.subItems && item.subItems.length > 0;
            const baseClass = "flex flex-col items-center justify-center py-3 w-full active:scale-95 transition-all group";
            const activeClass = "bg-sky-950/30 text-sky-400 border-l-2 border-sky-500";
            const inactiveClass = "text-slate-600 hover:bg-slate-900 hover:text-sky-200";
            const submenuId = `submenu-${item.id}`;
            
            let subHtml = '';
            if (hasSubmenu) {
                const isSubmenuVisible = isExpanded && isActive;
                subHtml = `
                    <div id="${submenuId}" class="submenu-container ${isSubmenuVisible ? '' : 'hidden'} flex flex-col w-full bg-slate-900/50 mt-1 border-y border-slate-800/50">
                        ${item.subItems.map(sub => {
                            const isSubActive = currentPage.includes(sub.href.replace('./', '')) && sub.href !== '#';
                            return `
                            <a href="${sub.href}" data-sc-nav="${sub.href}" class="submenu-item flex items-center gap-3 px-6 py-2 text-[10px] ${isSubActive ? 'text-sky-400 bg-sky-500/10' : 'text-slate-500'} hover:text-sky-400 hover:bg-sky-500/5 transition-colors" ${isSubActive ? 'aria-current="page"' : ''}>
                                <span class="material-symbols-outlined text-[14px]">${sub.icon}</span>
                                <span class="menu-label whitespace-nowrap">${sub.label}</span>
                            </a>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            return `
                <div class="w-full flex flex-col items-center">
                    <a class="${baseClass} ${isActive ? activeClass : inactiveClass}" 
                       href="${item.href}" 
                       ${hasSubmenu ? `data-sc-submenu="${submenuId}" aria-expanded="${isExpanded && isActive}" aria-controls="${submenuId}"` : `data-sc-nav="${item.href}"`}
                       ${isParentActive ? 'aria-current="page"' : ''}>
                        <div class="flex items-center justify-center w-full relative">
                            <span class="material-symbols-outlined mb-1 ${isActive ? 'group-hover:animate-pulse' : ''}" style="${isActive ? "font-variation-settings: 'FILL' 1;" : ""}">
                                ${item.icon}
                            </span>
                            ${hasSubmenu ? `<span class="material-symbols-outlined text-[12px] absolute right-1 top-1 text-slate-700 group-hover:text-sky-500 transition-transform duration-200" style="transform: ${isExpanded && isActive ? 'rotate(90deg)' : 'rotate(0deg)'}">chevron_right</span>` : ''}
                        </div>
                        <span class="font-['Space_Grotesk'] font-medium uppercase text-[10px] text-center px-1 menu-label">${item.label}</span>
                    </a>
                    ${subHtml}
                </div>
            `;
        }).join('');

        return `
            <aside class="fixed left-0 top-12 h-[calc(100vh-48px)] flex flex-col items-center py-4 z-40 bg-slate-950 border-r border-slate-800 overflow-x-hidden">
                <div class="mb-6 flex flex-col items-center text-center border-b border-slate-800 pb-4 w-full px-2">
                    <div class="w-10 h-10 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center mb-2 overflow-hidden shadow-inner shrink-0">
                        <span class="material-symbols-outlined text-slate-600 text-[20px]">person</span>
                    </div>
                    <span class="text-[8px] font-['Space_Grotesk'] text-slate-500 font-bold uppercase tracking-widest text-center px-1 whitespace-nowrap">SECTOR 7<br/><span class="text-[7px] text-slate-600">BALTIC REGION</span></span>
                </div>
                <nav class="flex flex-col w-full gap-1 flex-1 overflow-y-auto custom-scrollbar">
                    ${linksHtml}
                </nav>
                <div class="mt-auto w-full px-2 pb-2 shrink-0">
                    <button type="button" aria-label="Arm system" class="w-full bg-slate-900 border border-slate-700 text-sky-500 py-2 rounded-sm hover:bg-slate-800 transition-colors flex items-center justify-center">
                        <span class="material-symbols-outlined text-[16px]">bolt</span>
                    </button>
                    <p class="text-[6px] text-slate-700 uppercase font-bold text-center mt-1">ARM SYS</p>
                </div>
            </aside>
        `;
    },

    bindSidebarEvents: () => {
        const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
        if (!sidebarPlaceholder) return;
        if (sidebarPlaceholder.dataset.scBound === 'true') return;
        sidebarPlaceholder.dataset.scBound = 'true';
        sidebarPlaceholder.addEventListener('click', (event) => {
            const submenuLink = event.target.closest('[data-sc-submenu]');
            if (submenuLink && sidebarPlaceholder.contains(submenuLink)) {
                SharedComponents.toggleSubmenu(event, submenuLink);
                return;
            }

            const navLink = event.target.closest('[data-sc-nav]');
            if (navLink && sidebarPlaceholder.contains(navLink)) {
                SharedComponents.handleNav(event, navLink.dataset.scNav || navLink.getAttribute('href'));
            }
        });
    },

    toggleSubmenu: (event, el) => {
        event.preventDefault();
        const submenuId = el.dataset.scSubmenu;
        const submenu = submenuId ? document.getElementById(submenuId) : el.nextElementSibling;
        if (!submenu) return;
        const icon = el.querySelector('.absolute.right-1');
        const isExpanded = document.body.classList.contains('sidebar-expanded');
        const isOpen = !submenu.classList.contains('hidden');

        if (isExpanded && isOpen) {
            document.body.classList.remove('sidebar-expanded');
            submenu.classList.add('hidden');
            el.setAttribute('aria-expanded', 'false');
            if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
            // Close other submenus first if needed (optional)
            document.querySelectorAll('.submenu-container').forEach(s => s.classList.add('hidden'));
            document.querySelectorAll('.absolute.right-1').forEach(i => i.style.transform = 'rotate(0deg)');
            document.querySelectorAll('[data-sc-submenu]').forEach(link => link.setAttribute('aria-expanded', 'false'));
            
            document.body.classList.add('sidebar-expanded');
            submenu.classList.remove('hidden');
            el.setAttribute('aria-expanded', 'true');
            if (icon) icon.style.transform = 'rotate(90deg)';
        }
    },

    initHeader: (currentPage) => {
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = SharedComponents.header;
        }
    },

    initSidebar: (currentPage) => {
        const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
        if (sidebarPlaceholder) {
            sidebarPlaceholder.innerHTML = SharedComponents.sidebar(currentPage);
            SharedComponents.bindSidebarEvents();
        }
    },

    initZuluClock: () => {
        const updateClock = () => {
            const clockEls = document.querySelectorAll('#shared-zulu-clock');
            if (clockEls.length === 0) return;
            
            const now = new Date();
            const pad = (n) => String(n).padStart(2, "0");
            const hh = pad(now.getUTCHours());
            const mm = pad(now.getUTCMinutes());
            const ss = pad(now.getUTCSeconds());
            const timeString = `ZULU ${hh}:${mm}:${ss}`;
            
            clockEls.forEach(el => el.textContent = timeString);
        };
        updateClock();
        setInterval(updateClock, 1000);
    },

    handleNav: (event, url) => {
        event.preventDefault();
        window.history.pushState({}, '', url);
        SharedComponents.loadContent(url);
    },

    loadContent: async (url) => {
        // Validate URL is a same-origin relative path to prevent open redirect / XSS
        const allowedPaths = [
            'map-view.html', 'tactical-map.html', 'logistics.html',
            'Asset-ready.html', 'Sensor-Fusion.html', 'sensor_map.html',
            'comms.html', 'mission_logs.html', 'intel-brief.html',
            'threat-intel.html', 'battery-status.html',
            'asset-tracking.html', 'telemetry.html'
        ];
        const filename = url.split('/').pop().split('?')[0];
        if (!allowedPaths.includes(filename)) {
            console.warn('SharedComponents.loadContent: blocked navigation to unknown path:', url);
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newMain = doc.querySelector('main');
            const currentMain = document.querySelector('main');

            if (newMain && currentMain) {
                // Use safe DOM adoption instead of innerHTML to prevent XSS
                currentMain.className = newMain.className;
                currentMain.replaceChildren(
                    ...Array.from(newMain.childNodes).map(node => document.adoptNode(node))
                );

                // Re-execute any inline scripts inside the new <main>
                currentMain.querySelectorAll('script').forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr =>
                        newScript.setAttribute(attr.name, attr.value)
                    );
                    newScript.textContent = oldScript.textContent;
                    oldScript.replaceWith(newScript);
                });

                // Update active state in sidebar
                SharedComponents.initSidebar(url);
            }
        } catch (err) {
            console.error('Failed to load content:', err);
        }
    },

    /**
     * Injects shared <head> resources (fonts, global CSS) that are common to
     * all pages, eliminating the need to duplicate those <link> tags in every
     * HTML file.  Only the Tailwind CDN scripts must stay in each HTML <head>
     * because they need to be parsed before the body is rendered.
     */
    injectHead: () => {
        if (document.getElementById('sc-head-injected')) return; // idempotent

        const resources = [
            // Google Fonts preconnect
            { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
            { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
            // Inter + Space Grotesk
            { tag: 'link', attrs: {
                rel: 'stylesheet',
                href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;600;700;900&display=swap'
            }},
            // Material Symbols
            { tag: 'link', attrs: {
                rel: 'stylesheet',
                href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
            }},
            // Global CSS utilities (hex-bg, scrollbar-hide, radar-sweep …)
            { tag: 'link', attrs: { rel: 'stylesheet', href: 'styles/global.css' } },
        ];

        const fragment = document.createDocumentFragment();
        resources.forEach(({ tag, attrs }) => {
            // Skip if an identical href is already present
            if (attrs.href && document.querySelector(`link[href="${attrs.href}"]`)) return;
            const el = document.createElement(tag);
            Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
            fragment.appendChild(el);
        });

        // Mark as injected so SPA navigations don't re-inject
        const marker = document.createElement('meta');
        marker.id = 'sc-head-injected';
        fragment.appendChild(marker);

        document.head.appendChild(fragment);
    },

    init: (currentPage) => {
        // Inject shared <head> resources (fonts, global CSS)
        SharedComponents.injectHead();

        // Inject sidebar CSS variables
        if (!document.getElementById('shared-components-styles')) {
            const styleSheet = document.createElement("style");
            styleSheet.id = 'shared-components-styles';
            styleSheet.innerText = SharedComponents.style;
            document.head.appendChild(styleSheet);
        }

        SharedComponents.initHeader(currentPage);
        SharedComponents.initSidebar(currentPage);
        SharedComponents.initZuluClock();
        SharedComponents.initAIUpdates();
    },

    initAIUpdates: () => {
        const PHASE_COLORS = {
            SCAN:    { dot: '#38bdf8', label: 'AI: SCANNING' },
            DETECT:  { dot: '#f59e0b', label: 'AI: DETECTING' },
            SUGGEST: { dot: '#a78bfa', label: 'AI: SUGGESTING' },
            PROTECT: { dot: '#f87171', label: 'AI: PROTECTING' },
            REPORT:  { dot: '#34d399', label: 'AI: REPORTING' },
        };

        window.addEventListener('ai-update', (e) => {
            const { phase } = e.detail;
            const bar = document.getElementById('ai-threat-bar');
            const val = document.getElementById('ai-threat-value');
            const dot = document.getElementById('ai-phase-dot');
            const label = document.getElementById('ai-phase-label');

            // Update phase indicator
            if (dot && label && PHASE_COLORS[phase]) {
                dot.style.backgroundColor = PHASE_COLORS[phase].dot;
                dot.style.boxShadow = `0 0 6px ${PHASE_COLORS[phase].dot}`;
                label.textContent = PHASE_COLORS[phase].label;
                label.style.color = PHASE_COLORS[phase].dot;
            }

            // Update threat bar
            if (bar && val && window.AISystem) {
                const score = window.AISystem.state.threatScore;
                bar.style.width = `${score}%`;
                val.textContent = `${score}%`;
                if (score > 70) bar.className = 'absolute top-0 left-0 h-full bg-error transition-all duration-1000';
                else if (score > 40) bar.className = 'absolute top-0 left-0 h-full bg-amber-500 transition-all duration-1000';
                else bar.className = 'absolute top-0 left-0 h-full bg-sky-500 transition-all duration-1000';
            }

            if (window.AISystem?.state.hitlPending) {
                SharedComponents.showHITLCard();
            }
        });
    },

    showHITLCard: () => {
        if (document.getElementById('ai-hitl-card')) return;
        
        const suggestion = window.AISystem?.state.suggestions[0];
        if (!suggestion) return;
        const card = document.createElement('div');
        card.id = 'ai-hitl-card';
        card.className = "fixed top-20 right-6 w-80 bg-slate-950 border-2 border-sky-500 shadow-[0_0_20px_rgba(130,207,255,0.2)] z-[100] p-4 animate-in slide-in-from-right fade-in";

        const heading = document.createElement('div');
        heading.className = "flex items-center gap-2 mb-3 border-b border-slate-800 pb-2";

        const icon = document.createElement('span');
        icon.className = "material-symbols-outlined text-sky-500";
        icon.textContent = "psychology";

        const title = document.createElement('span');
        title.className = "font-['Space_Grotesk'] text-xs font-bold text-sky-400 uppercase tracking-widest";
        title.textContent = "AI Suggestion";

        const message = document.createElement('p');
        message.className = "text-slate-300 text-sm mb-4 font-medium";
        message.textContent = suggestion.action;

        const actions = document.createElement('div');
        actions.className = "grid grid-cols-2 gap-2";

        const approveButton = document.createElement('button');
        approveButton.type = 'button';
        approveButton.className = "bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-black py-2 uppercase tracking-tighter";
        approveButton.textContent = "Approve";
        approveButton.addEventListener('click', () => {
            window.AISystem?.approveAction(suggestion.id);
            card.remove();
        });

        const dismissButton = document.createElement('button');
        dismissButton.type = 'button';
        dismissButton.className = "bg-slate-900 border border-slate-700 text-slate-500 hover:text-white text-[10px] font-black py-2 uppercase tracking-tighter";
        dismissButton.textContent = "Dismiss";
        dismissButton.addEventListener('click', () => {
            window.AISystem?.rejectAction(suggestion.id);
            card.remove();
        });

        heading.append(icon, title);
        actions.append(approveButton, dismissButton);
        card.append(heading, message, actions);
        document.body.appendChild(card);
    }
};

// Initial initialization
window.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    SharedComponents.init(currentPage);
});

window.onpopstate = () => {
    SharedComponents.loadContent(window.location.pathname);
};
