/**
 * SharedComponents - A tactical UI component library for SWAF C2 STRATOS.
 * Handles the injection of Header and Sidebar to ensure "Clean Code" and eliminate redundancy.
 */

const SharedComponents = {
    style: `
        :root {
            --sidebar-width: 64px;
            --header-height: 48px;
            --ai-accent: #82cfff;
            --hitl-danger: #ff5252;
        }
        #main-wrapper {
            padding-left: var(--sidebar-width);
            width: 100%;
            display: flex;
        }
        #subsidebar-placeholder {
            flex-shrink: 0;
            height: 100%;
        }
        #main-wrapper > main {
            flex: 1 1 0%;
            min-width: 0;
        }
        aside {
            width: var(--sidebar-width);
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
        main {
            transition: opacity 0.15s ease;
        }
        main.spa-loading {
            opacity: 0;
        }
    `,

    header: `
        <header class="fixed top-0 w-full h-12 flex justify-between items-center px-4 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
            <div class="flex items-center gap-4">
                <span class="text-lg font-black tracking-widest text-sky-500 dark:text-sky-400 font-['Space_Grotesk'] uppercase tracking-tighter text-xs mr-4">C2 // TACTICAL OVERWATCH</span>
                <!-- Top Nav Links -->
                <nav class="hidden md:flex items-center gap-6 font-['Space_Grotesk'] font-bold text-[10px] tracking-widest uppercase">
                    <a href="./map-view.html" onclick="SharedComponents.handleNav(event, './map-view.html')" class="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">map</span> MAP VIEW
                    </a>
                    <a href="./tactical-map.html" onclick="SharedComponents.handleNav(event, './tactical-map.html')" class="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">explore</span> TACTICAL MAP
                    </a>
                </nav>
            </div>
            <div class="flex flex-1 justify-end items-center gap-6">
                <!-- Search Bar -->
                <div class="relative hidden md:flex items-center w-64 border border-outline-variant bg-surface-container/50 px-2 h-7">
                    <span class="material-symbols-outlined text-[16px] text-outline mr-2">search</span>
                    <input id="global-search" class="bg-transparent border-none outline-none text-data-mono font-data-mono text-on-surface w-full p-0 placeholder-outline" placeholder="QUERY DATABASE..." type="text"/>
                </div>
                <div class="flex items-center gap-4 font-['Space_Grotesk'] font-bold uppercase tracking-tighter text-xs">
                    <!-- AI Threat Meter -->
                    <div id="ai-threat-container" class="flex items-center gap-2 border-x border-slate-800 px-4 h-full">
                        <span class="text-slate-500 text-[9px]">AI THREAT</span>
                        <div class="w-32 h-2 bg-slate-900 border border-slate-800 relative overflow-hidden">
                            <div id="ai-threat-bar" class="absolute top-0 left-0 h-full bg-sky-500 transition-all duration-1000" style="width: 0%"></div>
                        </div>
                        <span id="ai-threat-value" class="text-sky-500 w-8">0%</span>
                    </div>
                    <span class="text-error">THREAT: ALPHA</span>
                    <span class="text-slate-500" id="shared-zulu-clock">ZULU 00:00:00</span>
                </div>
                <div class="flex items-center gap-2">
                    <!-- AI Pipeline Phase Indicator -->
                    <div id="ai-phase-indicator" class="flex items-center gap-1 border border-slate-800 px-2 py-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-700" id="ai-phase-dot"></span>
                        <span id="ai-phase-label" class="text-[8px] font-['Space_Grotesk'] font-bold text-slate-700 uppercase tracking-widest">AI OFFLINE</span>
                    </div>
                    <button id="btn-satellite" onclick="SharedComponents.handleHeaderBtn('satellite')" class="text-slate-500 hover:text-sky-300 hover:bg-slate-800/50 p-1 duration-75 ease-in-out">
                        <span class="material-symbols-outlined text-[20px]">satellite_alt</span>
                    </button>
                    <button id="btn-radar" onclick="SharedComponents.handleHeaderBtn('radar')" class="text-slate-500 hover:text-sky-300 hover:bg-slate-800/50 p-1 duration-75 ease-in-out">
                        <span class="material-symbols-outlined text-[20px]">radar</span>
                    </button>
                    <button id="btn-settings" onclick="SharedComponents.handleHeaderBtn('settings')" class="text-slate-500 hover:text-sky-300 hover:bg-slate-800/50 p-1 duration-75 ease-in-out">
                        <span class="material-symbols-outlined text-[20px]">settings_input_component</span>
                    </button>
                </div>
            </div>
        </header>
    `,

    sidebar: (currentPage) => {
        const logsIntelPages = [
            'mission_logs.html',
            'asset-tracking.html',
            'intel-brief.html'
        ];
        const menuItems = [
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: './logistics.html' },
            { id: 'assets', label: 'Asset Ready', icon: 'flight_takeoff', href: './Asset-ready.html' },
            { 
                id: 'fusion', label: 'Sensor Fusion', icon: 'sensors', href: './Sensor-Fusion.html',
                subItems: [
                    { label: 'Dashboard', icon: 'sensors', href: './Sensor-Fusion.html' },
                    { label: 'AI Scan', icon: 'psychology', href: './Sensor-Fusion.html#ai-scan' },
                    { label: 'Signal Analysis', icon: 'graphic_eq', href: './Sensor-Fusion.html#sigint' },
                ]
            },
            { id: 'sensor-map', label: 'Sensor_map', icon: 'map_search', href: './sensor_map.html' },
            { id: 'comms', label: 'Comms', icon: 'satellite', href: './comms.html' },
            { id: 'logs', label: 'Logs & Intel', icon: 'history_edu', href: './mission_logs.html' },
        ];

        const linksHtml = menuItems.map(item => {
            const itemPage = item.href.replace('./', '');
            const isLogsIntelItem = item.id === 'logs';
            const isActive = item.href !== '#' && (
                currentPage.includes(itemPage) ||
                (isLogsIntelItem && logsIntelPages.some(page => currentPage.includes(page)))
            );
            const baseClass = "flex flex-col items-center justify-center py-3 w-full active:scale-95 transition-all group";
            const activeClass = "bg-sky-950/30 text-sky-400 border-l-2 border-sky-500";
            const inactiveClass = "text-slate-400 hover:bg-slate-800 hover:text-sky-300";

            return `
                <div class="w-full flex flex-col items-center">
                    <a class="${baseClass} ${isActive ? activeClass : inactiveClass}" 
                       href="${item.href}" 
                       onclick="SharedComponents.handleNav(event, '${item.href}')">
                        <div class="flex items-center justify-center w-full relative">
                            <span class="material-symbols-outlined mb-1 ${isActive ? 'group-hover:animate-pulse' : ''}" style="${isActive ? "font-variation-settings: 'FILL' 1;" : ""}">
                                ${item.icon}
                            </span>
                        </div>
                        <span class="font-['Space_Grotesk'] font-medium uppercase text-[9px] text-center px-1 menu-label leading-[1.1]">${item.label}</span>
                    </a>
                </div>
            `;
        }).join('');

        return `
            <aside class="fixed left-0 top-12 h-[calc(100vh-48px)] flex flex-col items-center py-4 z-40 bg-slate-950 border-r border-slate-800 overflow-x-hidden">
                <div class="mb-6 flex flex-col items-center text-center border-b border-slate-800 pb-4 w-full px-2">
                    <div class="w-10 h-10 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center mb-2 overflow-hidden shadow-inner shrink-0">
                        <span class="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                    </div>
                    <span class="text-[8px] font-['Space_Grotesk'] text-slate-400 font-bold uppercase tracking-widest text-center px-1 whitespace-nowrap">SECTOR 7<br/><span class="text-[7px] text-slate-500">BALTIC REGION</span></span>
                </div>
                <nav class="flex flex-col w-full gap-1 flex-1 overflow-y-auto custom-scrollbar">
                    ${linksHtml}
                </nav>
                <div class="mt-auto w-full px-2 pb-2 shrink-0">
                    <button id="btn-armsys" onclick="SharedComponents.handleArmSys()" class="w-full bg-slate-900 border border-slate-700 text-sky-500 py-2 rounded-sm hover:bg-slate-800 transition-colors flex items-center justify-center">
                        <span class="material-symbols-outlined text-[16px]">bolt</span>
                    </button>
                    <p class="text-[6px] text-slate-700 uppercase font-bold text-center mt-1">ARM SYS</p>
                </div>
            </aside>
        `;
    },

    subSidebars: {
        strategicOps: {
            pages: ['logistics.html', 'supply-chain.html', 'maintenance.html', 'personnel.html'],
            title: 'STRATEGIC OPS',
            subtitle: 'V-22 OSPREY WING',
            width: '220px',
            items: [
                { label: 'Dashboard',    icon: 'dashboard', href: './logistics.html' },
                { label: 'Supply Chain', icon: 'package_2', href: './supply-chain.html' },
                { label: 'Maintenance',  icon: 'build',     href: './maintenance.html' },
                { label: 'Personnel',    icon: 'groups',    href: './personnel.html' },
            ],
            bottomButton: (filename) => {
                if (filename === 'personnel.html')   return 'DEPLOY PERSONNEL';
                if (filename === 'maintenance.html') return 'NEW WORK ORDER';
                return 'INITIATE RESUPPLY';
            },
            footerLinks: true,
        },
        logsIntel: {
            pages: ['mission_logs.html', 'asset-tracking.html', 'intel-brief.html'],
            title: 'LOGS & INTEL',
            subtitle: 'HISTORICAL ANALYSIS',
            width: '180px',
            items: [
                { label: 'Mission Logs',   icon: 'history_edu',  href: './mission_logs.html' },
                { label: 'Asset Tracking', icon: 'navigation',   href: './asset-tracking.html' },
                { label: 'Intel Brief',    icon: 'description',  href: './intel-brief.html' },
            ],
            bottomButton: null,
            footerLinks: false,
        },
    },

    initHeader: (_currentPage) => {
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = SharedComponents.header;
        }
    },

    initSidebar: (currentPage) => {
        const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
        if (sidebarPlaceholder) {
            sidebarPlaceholder.innerHTML = SharedComponents.sidebar(currentPage);
        }
    },

    initSubSidebar: (currentPage) => {
        // Auto-create placeholder if the page doesn't have one in its HTML
        let placeholder = document.getElementById('subsidebar-placeholder');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.id = 'subsidebar-placeholder';
            const mainWrapper = document.getElementById('main-wrapper');
            const mainEl = mainWrapper?.querySelector(':scope > main');
            if (mainEl) {
                mainWrapper.insertBefore(placeholder, mainEl);
            } else if (mainWrapper) {
                mainWrapper.appendChild(placeholder);
            } else {
                return;
            }
        }

        const filename = currentPage.split('/').pop().split('?')[0] || currentPage;
        const group = Object.values(SharedComponents.subSidebars).find(g =>
            g.pages.some(p => filename === p)
        );

        if (!group) {
            placeholder.innerHTML = '';
            return;
        }

        const itemsHtml = group.items.map(item => {
            const isActive = filename === item.href.replace('./', '');
            const cls = isActive
                ? 'bg-slate-900 text-sky-400 border-l-4 border-sky-500'
                : 'text-slate-500 border-l-4 border-transparent hover:bg-slate-900 hover:text-slate-200 transition-all';
            const fill = isActive ? " style=\"font-variation-settings:'FILL' 1;\"" : '';
            return `<a class="px-4 py-3 flex items-center gap-3 ${cls}" href="${item.href}">
                <span class="material-symbols-outlined text-lg"${fill}>${item.icon}</span>
                ${item.label}
            </a>`;
        }).join('');

        const bottomHtml = group.bottomButton ? `
            <div class="px-4 mt-auto mb-4 shrink-0">
                <button class="w-full bg-sky-900/20 text-sky-400 border border-sky-800/50 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-sky-800/40 transition-colors font-['Space_Grotesk']">
                    ${group.bottomButton(filename)}
                </button>
            </div>` : '';

        const footerHtml = group.footerLinks ? `
            <div class="flex flex-col gap-1 font-['Space_Grotesk'] uppercase text-[11px] font-semibold tracking-wider mt-4 border-t border-slate-800 pt-4 shrink-0">
                <a class="text-slate-500 px-4 py-2 flex items-center gap-3 border-l-4 border-transparent hover:text-slate-300 transition-all" href="#">
                    <span class="material-symbols-outlined text-base">terminal</span>Diagnostics
                </a>
                <a class="text-slate-500 px-4 py-2 flex items-center gap-3 border-l-4 border-transparent hover:text-slate-300 transition-all" href="#">
                    <span class="material-symbols-outlined text-base">help_center</span>Help
                </a>
            </div>` : '';

        placeholder.innerHTML = `
            <aside class="bg-slate-950/80 border-r border-slate-800 flex flex-col py-4 h-full backdrop-blur-md overflow-y-auto custom-scrollbar hidden md:flex" style="width:${group.width};flex-shrink:0">
                <div class="px-4 mb-6 shrink-0">
                    <h2 class="text-sky-500 font-bold font-['Space_Grotesk'] uppercase text-xs tracking-widest">${group.title}</h2>
                    <div class="text-slate-400 text-[10px] uppercase font-semibold tracking-wider mt-1">${group.subtitle}</div>
                </div>
                <div class="flex-1 flex flex-col gap-1 font-['Space_Grotesk'] uppercase text-[11px] font-semibold tracking-wider">
                    ${itemsHtml}
                </div>
                ${bottomHtml}
                ${footerHtml}
            </aside>`;
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
        // Validate URL
        const allowedPaths = [
            'map-view.html', 'tactical-map.html', 'logistics.html',
            'Asset-ready.html', 'Sensor-Fusion.html', 'sensor_map.html',
            'comms.html', 'mission_logs.html', 'asset-tracking.html',
            'intel-brief.html', 'supply-chain.html', 'maintenance.html',
            'personnel.html'
        ];
        const filename = url.split('/').pop().split('?')[0];
        if (!allowedPaths.includes(filename)) {
            console.warn('SharedComponents.loadContent: blocked navigation to unknown path:', url);
            return;
        }

        SharedComponents.showLoading(true);
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newMain = doc.querySelector('main');
            const currentMain = document.querySelector('main');

            if (newMain && currentMain) {
                // Fade out current content
                currentMain.classList.add('spa-loading');
                await new Promise(r => setTimeout(r, 150));

                // Swap content
                currentMain.className = newMain.className;
                currentMain.replaceChildren(
                    ...Array.from(newMain.childNodes).map(node => document.adoptNode(node))
                );

                // Collect all scripts from the fetched document to re-execute them.
                // We exclude scripts already in the initial document's <head> to avoid re-loading libraries like Tailwind or shared-components itself.
                const scriptsToRun = Array.from(doc.querySelectorAll('script'));
                
                for (const sourceScript of scriptsToRun) {
                    const src = sourceScript.getAttribute('src');
                    
                    if (src) {
                        // Skip core shared scripts that should only run once
                        if (src.includes('shared-components.js') || src.includes('tailwind.config.js')) continue;

                        const resolvedSrc = new URL(src, new URL(url, window.location.href)).href;
                        const alreadyLoaded = Array.from(document.scripts).some(existing => {
                            if (!existing.src) return false;
                            try {
                                return new URL(existing.src, window.location.href).href === resolvedSrc;
                            } catch { return false; }
                        });

                        // For page-specific JS files (like sensor-data.js or asset-ready.js),
                        // we might need them to re-init. However, many are designed to run once.
                        // We'll skip if already loaded to avoid duplicate intervals/listeners,
                        // but we will manually trigger their start if they have a known init pattern.
                        if (alreadyLoaded) {
                            if (src.includes('sensor-data.js') && window.SensorDataEngine) {
                                window.SensorDataEngine.start();
                            }
                            continue;
                        }

                        await new Promise((resolve) => {
                            const scriptEl = document.createElement('script');
                            Array.from(sourceScript.attributes).forEach(attr =>
                                scriptEl.setAttribute(attr.name, attr.value)
                            );
                            scriptEl.onload = resolve;
                            scriptEl.onerror = resolve;
                            document.body.appendChild(scriptEl);
                        });
                    } else if (sourceScript.textContent.trim()) {
                        // Inline scripts (often page controllers) MUST re-run every time.
                        const scriptEl = document.createElement('script');
                        scriptEl.textContent = sourceScript.textContent;
                        document.body.appendChild(scriptEl);
                        scriptEl.remove(); // Clean up from DOM but it has already executed
                    }
                }

                // Ensure data engine is running if present
                if (window.SensorDataEngine && !window.SensorDataEngine.state.running) {
                    window.SensorDataEngine.start();
                }

                // Fade in new content
                requestAnimationFrame(() => {
                    currentMain.classList.remove('spa-loading');
                    setTimeout(() => SharedComponents.showLoading(false), 150);
                });

                // Notify page modules that SPA navigation completed.
                // Page scripts should listen to 'spa-navigated' instead of 'DOMContentLoaded'.
                dispatchEvent(new CustomEvent('spa-navigated', { detail: { url } }));

                // Update active states in sidebar
                SharedComponents.initSidebar(url);
                SharedComponents.initSubSidebar(url);
            }
        } catch (err) {
            console.error('Failed to load content:', err);
            SharedComponents.showLoading(false);
            SharedComponents.showToast('LOAD ERROR', 'Failed to load page', 'error', 'error');
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

        // Load saved sidebar state
        SharedComponents.loadState();
        
        // Setup event listeners
        setTimeout(() => SharedComponents.setupEventListeners(), 100);

        SharedComponents.initHeader(currentPage);
        SharedComponents.initSidebar(currentPage);
        SharedComponents.initSubSidebar(currentPage);
        SharedComponents.initZuluClock();
        SharedComponents.initAIUpdates();
    },

    setupEventListeners: () => {
        // Global search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(timeout);
                    SharedComponents.handleGlobalSearch(searchInput.value);
                } else {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        SharedComponents.handleGlobalSearch(searchInput.value);
                    }, 500);
                }
            });
        }

        // SPA link delegation — intercept any internal <a href> click that hasn't
        // already been handled by an inline onclick (those call preventDefault first).
        document.addEventListener('click', (e) => {
            if (e.defaultPrevented) return;
            const link = e.target.closest('a[href]');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('//')) return;
            SharedComponents.handleNav(e, href);
        });

        // Save state on sidebar toggle
        const observer = new MutationObserver(() => {
            SharedComponents.saveState();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    },

    initAIUpdates: () => {
        const PHASE_COLORS = {
            SCAN:    { dot: '#38bdf8', label: 'AI: SCANNING' },
            DETECT:  { dot: '#f59e0b', label: 'AI: DETECTING' },
            SUGGEST: { dot: '#a78bfa', label: 'AI: SUGGESTING' },
            PROTECT: { dot: '#f87171', label: 'AI: PROTECTING' },
            REPORT:  { dot: '#34d399', label: 'AI: REPORTING' },
        };

        addEventListener('ai-update', (e) => {
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
            if (bar && val && globalThis.AISystem) {
                const score = globalThis.AISystem.state.threatScore;
                bar.style.width = `${score}%`;
                val.textContent = `${score}%`;
                if (score > 70) bar.className = 'absolute top-0 left-0 h-full bg-error transition-all duration-1000';
                else if (score > 40) bar.className = 'absolute top-0 left-0 h-full bg-amber-500 transition-all duration-1000';
                else bar.className = 'absolute top-0 left-0 h-full bg-sky-500 transition-all duration-1000';
            }

            if (globalThis.AISystem?.state.hitlPending) {
                SharedComponents.showHITLCard();
            }
        });
    },

    showHITLCard: () => {
        if (document.getElementById('ai-hitl-card')) return;

        const suggestion = globalThis.AISystem?.state.suggestions[0];
        if (!suggestion) return;

        // Get effector classification if available
        const effector = suggestion.effector || globalThis.AISystem?.state.lastEffector;
        const effectorColorMap = {
            amber:   { bg: 'bg-amber-950/50', border: 'border-amber-500', text: 'text-amber-400', iconColor: 'text-amber-500' },
            error:   { bg: 'bg-red-950/50', border: 'border-error', text: 'text-error', iconColor: 'text-error' },
            primary: { bg: 'bg-sky-950/50', border: 'border-sky-500', text: 'text-sky-400', iconColor: 'text-sky-500' }
        };
        const ec = effector ? (effectorColorMap[effector.color] || effectorColorMap.primary) : null;

        const effectorBadgeHtml = effector ? `
            <div class="flex items-center gap-2 ${ec.bg} border ${ec.border} px-2 py-1.5 mb-3">
                <span class="material-symbols-outlined ${ec.iconColor} text-[16px]">${effector.icon}</span>
                <div>
                    <div class="font-['Space_Grotesk'] text-[9px] font-bold ${ec.text} uppercase tracking-widest">EFFECTOR: ${effector.type}</div>
                    <div class="text-[8px] text-slate-500">${effector.label}</div>
                </div>
            </div>
        ` : '';

        const card = document.createElement('div');
        card.id = 'ai-hitl-card';
        card.className = "fixed top-20 right-6 w-80 bg-slate-950 border-2 border-sky-500 shadow-[0_0_20px_rgba(130,207,255,0.2)] z-[100] p-4 animate-in slide-in-from-right fade-in";
        card.innerHTML = `
            <div class="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <span class="material-symbols-outlined text-sky-500">psychology</span>
                <span class="font-['Space_Grotesk'] text-xs font-bold text-sky-400 uppercase tracking-widest">AI Suggestion</span>
            </div>
            ${effectorBadgeHtml}
            <p class="text-slate-300 text-sm mb-4 font-medium">${suggestion.action}</p>
            <div class="grid grid-cols-2 gap-2">
                <button onclick="AISystem.approveAction('${suggestion.id}'); document.getElementById('ai-hitl-card').remove();" 
                        class="bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-black py-2 uppercase tracking-tighter">
                    Approve
                </button>
                <button onclick="AISystem.rejectAction('${suggestion.id}'); document.getElementById('ai-hitl-card').remove();"
                        class="bg-slate-900 border border-slate-700 text-slate-500 hover:text-white text-[10px] font-black py-2 uppercase tracking-tighter">
                    Dismiss
                </button>
            </div>
        `;
        document.body.appendChild(card);
    },

    handleHeaderBtn: (btnId) => {
        const actions = {
            satellite: () => {
                SharedComponents.showToast('SATELLITE UPLINK', 'Connecting to comms hub...', 'satellite_alt');
                SharedComponents.handleNav(new Event('click'), './comms.html');
            },
            radar: () => {
                SharedComponents.showToast('RADAR SCAN', 'Opening tactical radar...', 'radar');
                SharedComponents.handleNav(new Event('click'), './tactical-map.html');
            },
            settings: () => {
                SharedComponents.showSettingsModal();
            }
        };
        if (actions[btnId]) actions[btnId]();
    },

    handleArmSys: () => {
        const btn = document.getElementById('btn-armsys');
        const isArmed = btn?.classList.contains('bg-red-600');
        
        if (isArmed) {
            btn.classList.remove('bg-red-600', 'text-white', 'animate-pulse');
            btn.classList.add('bg-slate-900', 'text-sky-500');
            SharedComponents.showToast('ARM SYS', 'WEAPONS DISENGAGED', 'lock', 'error');
        } else {
            btn.classList.remove('bg-slate-900', 'text-sky-500');
            btn.classList.add('bg-red-600', 'text-white', 'animate-pulse');
            SharedComponents.showToast('ARM SYS', 'WEAPONS ARMED - STAND BY', 'lock_open', 'error');
        }
    },

    handleGlobalSearch: (query) => {
        if (!query || query.length < 2) return;
        
        const results = [];
        const q = query.toLowerCase();
        
        const pages = {
            'map': 'map-view.html',
            'tactical': 'tactical-map.html',
            'asset': 'Asset-ready.html',
            'sensor': 'Sensor-Fusion.html',
            'fusion': 'Sensor-Fusion.html',
            'comms': 'comms.html',
            'logs': 'mission_logs.html',
            'logistics': 'logistics.html'
        };
        
        Object.keys(pages).forEach(key => {
            if (key.includes(q) || q.includes(key)) {
                results.push({ label: key, url: pages[key] });
            }
        });
        
        if (results.length > 0) {
            SharedComponents.showToast(`FOUND ${results.length} RESULT(S)`, `Navigate to: ${results[0].label}`, 'search');
            SharedComponents.handleNav(new Event('click'), results[0].url);
        } else {
            SharedComponents.showToast('NO RESULTS', `No matches for "${query}"`, 'search', 'error');
        }
    },

    showToast: (title, message, icon = 'info', type = 'primary') => {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();
        
        const colors = {
            primary: 'border-sky-500 text-sky-400',
            error: 'border-error text-error',
            success: 'border-green-500 text-green-400',
            warning: 'border-amber-500 text-amber-400'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast-notification fixed bottom-6 right-6 w-72 bg-slate-950 border-2 ${colors[type] || colors.primary} shadow-lg z-[200] p-4 animate-in slide-in-from-right`;
        toast.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <span class="material-symbols-outlined ${colors[type] || colors.primary}">${icon}</span>
                <span class="font-['Space_Grotesk'] text-xs font-bold uppercase">${title}</span>
            </div>
            <p class="text-slate-400 text-sm">${message}</p>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showLoading: (show = true) => {
        let loader = document.getElementById('page-loader');
        if (!show && loader) {
            loader.remove();
            return;
        }
        if (loader) return;
        
        loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[150]';
        loader.innerHTML = `
            <div class="flex flex-col items-center gap-4">
                <div class="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
                <span class="font-['Space_Grotesk'] text-sky-400 uppercase text-sm tracking-widest">Loading</span>
            </div>
        `;
        document.body.appendChild(loader);
    },

    showSettingsModal: () => {
        if (document.getElementById('settings-modal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[200]';
        modal.innerHTML = `
            <div class="bg-slate-900 border border-slate-700 w-[400px] max-w-[90vw]">
                <div class="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 class="font-['Space_Grotesk'] text-sky-400 uppercase font-bold">System Settings</h3>
                    <button onclick="document.getElementById('settings-modal').remove()" class="text-slate-500 hover:text-white">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="p-4 space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Auto-refresh Data</span>
                        <button onclick="SharedComponents._toggleSetting(this)" class="w-12 h-6 bg-sky-600 rounded-full relative transition-colors">
                            <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></span>
                        </button>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Sound Alerts</span>
                        <button onclick="SharedComponents._toggleSetting(this)" class="w-12 h-6 bg-slate-700 rounded-full relative transition-colors">
                            <span class="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full transition-all"></span>
                        </button>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Threat Overlay</span>
                        <button onclick="SharedComponents._toggleSetting(this)" class="w-12 h-6 bg-sky-600 rounded-full relative transition-colors">
                            <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></span>
                        </button>
                    </div>
                    <div class="border-t border-slate-700 pt-4">
                        <span class="text-slate-500 text-xs">C2 STRATOS v1.0.4</span>
                    </div>
                </div>
                <div class="p-4 border-t border-slate-700 flex justify-end">
                    <button onclick="document.getElementById('settings-modal').remove()" class="bg-sky-600 text-white px-4 py-2 text-sm font-bold uppercase">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _toggleSetting: (btn) => {
        const isOn = btn.classList.contains('bg-sky-600');
        btn.classList.toggle('bg-sky-600', !isOn);
        btn.classList.toggle('bg-slate-700', isOn);
        const dot = btn.querySelector('span');
        if (dot) {
            dot.classList.toggle('right-1', !isOn);
            dot.classList.toggle('left-1', isOn);
            dot.classList.toggle('bg-white', !isOn);
            dot.classList.toggle('bg-slate-500', isOn);
        }
    },

    saveState: () => {
        try {
            const state = {
                expanded: document.body.classList.contains('sidebar-expanded'),
                timestamp: Date.now()
            };
            localStorage.setItem('c2_sidebar_state', JSON.stringify(state));
        } catch (e) {}
    },

    loadState: () => {
        try {
            const saved = localStorage.getItem('c2_sidebar_state');
            if (saved) {
                const state = JSON.parse(saved);
                if (state.expanded) {
                    document.body.classList.add('sidebar-expanded');
                }
            }
        } catch (e) {}
    }
};

// Initial initialization
window.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    SharedComponents.init(currentPage);
});

window.addEventListener('popstate', () => {
    SharedComponents.loadContent(window.location.pathname);
});
