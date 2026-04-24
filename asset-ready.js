/**
 * AssetManager - Logic for the Asset Readiness dashboard.
 */
const AssetManager = {
    sortCol: null,
    sortAsc: true,
    searchQuery: '',
    selectedQRA: null,
    scrambledSlots: new Set(),
    currentIncidents: [],
    selectedIncidentId: null,
    initialized: false,
    qraData: {
        1: { pilot: 'LT Berg',  aircraft: 'JAS 39C / 391', fuel: 85, temp: 42 },
        2: { pilot: 'LT Lind',  aircraft: 'JAS 39E / 394', fuel: 92, temp: 38 },
        3: { pilot: 'TBD',      aircraft: 'STANDBY',        fuel: 0,  temp: 0  }
    },
    munitionStock: {
        'Meteor BVR': { qty: 42, threshold: 20, level: '85%', status: 'OPTIMAL' },
        'IRIS-T SRAAM': { qty: 28, threshold: 15, level: '70%', status: 'NOMINAL' },
        'GBU-39 SDB': { qty: 12, threshold: 30, level: '40%', status: 'REORDER' },
        'AIM-120B': { qty: 32, threshold: 20, level: '75%', status: 'OPTIMAL' },
        'KEP 500': { qty: 8, threshold: 5, level: '60%', status: 'NOMINAL' }
    },

    init: function() {
        if (this.initialized) return;
        this.initialized = true;
        
        console.log("AssetManager Initialized");

        const searchInput = document.getElementById('asset-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterTable();
            });
        }
        
        const firstIncident = document.querySelector('.incident-card[data-incident-id]');
        if (firstIncident) this.setIncidentActive(firstIncident.dataset.incidentId);

        // Start Live Telemetry Simulation
        this.startTelemetry();
        
        // Add entry animations to cards
        this.applyEntryAnimations();
    },

    applyEntryAnimations: function() {
        const panels = document.querySelectorAll('main > div, main > div > div');
        panels.forEach((panel, i) => {
            panel.classList.add('animate-fade-in-up');
            panel.style.animationDelay = `${i * 0.1}s`;
        });
    },

    startTelemetry: function() {
        setInterval(() => {
            // Randomly fluctuate telemetry data
            Object.keys(this.qraData).forEach(id => {
                const data = this.qraData[id];
                if (data.aircraft !== 'STANDBY') {
                    data.fuel = Math.max(0, Math.min(100, data.fuel + (Math.random() * 0.2 - 0.1)));
                    data.temp = Math.max(20, Math.min(100, data.temp + (Math.random() * 2 - 1)));
                }
            });
            // Update UI if detail modal is open (could be expanded later)
        }, 3000);
    },

    showBaseDetail: function(baseName) {
        const bases = {
            'F7 Såtenäs':  { wing: 'Wing 7',  location: 'Västra Götaland', aircraft: 'JAS 39E/F', readiness: 75, qra: 'READY',    pilots: 18, status: 'OPERATIONAL' },
            'F17 Kallinge': { wing: 'Wing 17', location: 'Blekinge',        aircraft: 'JAS 39C/D', readiness: 87, qra: 'NOMINAL',   pilots: 14, status: 'OPERATIONAL' },
            'F21 Luleå':    { wing: 'Wing 21', location: 'Norrbotten',      aircraft: 'JAS 39C/D', readiness: 44, qra: 'DEGRADED',  pilots: 8,  status: 'LIMITED' }
        };
        const b = bases[baseName];
        if (!b) return;

        const tbody = document.getElementById('maintenance-body');
        const groundedAC = Array.from(tbody.querySelectorAll('tr'))
            .filter(row => row.dataset.base === baseName && (row.dataset.status === 'AOG' || row.dataset.status === 'SCHED'))
            .map(row => ({ id: row.dataset.assetId, status: row.dataset.status }));

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300';
        modal.innerHTML = `
            <div class="glass-panel w-[450px] max-w-[90vw] overflow-hidden rounded-lg">
                <div class="p-4 border-b border-outline-variant flex justify-between items-center bg-primary/10">
                    <h3 class="font-['Space_Grotesk'] text-lg font-bold text-primary uppercase tracking-wider">${baseName} - Tactical Intel</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-outline hover:text-on-surface p-1 transition-colors"><span class="material-symbols-outlined">close</span></button>
                </div>
                <div class="p-6 space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-1">
                            <span class="text-[10px] text-outline font-bold uppercase tracking-widest">Wing Designation</span>
                            <p class="text-on-surface font-black text-lg">${b.wing}</p>
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] text-outline font-bold uppercase tracking-widest">Location</span>
                            <p class="text-on-surface font-medium">${b.location}</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4 pt-4 border-t border-outline-variant/30">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-outline font-bold uppercase tracking-widest">Readiness Level</span>
                            <span class="font-bold ${b.readiness < 50 ? 'text-error' : 'text-primary'}">${b.readiness}%</span>
                        </div>
                        <div class="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                            <div class="h-full ${b.readiness < 50 ? 'bg-error' : 'bg-primary'} glow-primary transition-all duration-1000" style="width: ${b.readiness}%"></div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-3 bg-surface-variant/20 rounded border border-outline-variant/20">
                            <span class="text-[9px] text-outline uppercase block mb-1">QRA Status</span>
                            <span class="font-bold ${b.qra === 'DEGRADED' ? 'text-error' : 'text-tertiary'}">${b.qra}</span>
                        </div>
                        <div class="p-3 bg-surface-variant/20 rounded border border-outline-variant/20">
                            <span class="text-[9px] text-outline uppercase block mb-1">Pilots Active</span>
                            <span class="font-bold text-on-surface">${b.pilots} Units</span>
                        </div>
                    </div>

                    ${groundedAC.length > 0 ? `
                    <div class="space-y-2">
                        <span class="text-[10px] text-error font-bold uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-[14px]">warning</span>
                            Grounded Aircraft (${groundedAC.length})
                        </span>
                        <div class="grid grid-cols-2 gap-2">
                            ${groundedAC.map(ac => `
                                <div class="px-2 py-1 bg-error/10 border border-error/20 rounded text-[10px] text-on-surface flex justify-between">
                                    <span>${ac.id}</span>
                                    <span class="text-error font-bold">${ac.status}</span>
                                </div>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="p-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-black/20">
                    <button onclick="this.closest('.fixed').remove(); AISystem.recommendAsset('${baseName}')" class="bg-surface-variant border border-outline px-6 py-2 text-[10px] font-bold uppercase hover:bg-surface-container-high transition-colors">AI Optimization</button>
                    <button onclick="this.closest('.fixed').remove()" class="bg-primary text-on-primary px-6 py-2 text-[10px] font-bold uppercase hover:opacity-90 transition-opacity glow-primary">Close Intel</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    },

    setIncidentActive: function(incidentId) {
        this.selectedIncidentId = incidentId;
        document.querySelectorAll('.incident-card').forEach(card => {
            const isActive = card.dataset.incidentId === incidentId;
            card.classList.toggle('ring-1', isActive);
            card.classList.toggle('ring-sky-400', isActive);
            card.classList.toggle('border-sky-500', isActive);
            card.classList.toggle('bg-sky-950/20', isActive);
        });
    },

    selectQRASlot: function(slotNum) {
        document.querySelectorAll('.qra-slot').forEach(el => {
            el.classList.remove('border-sky-500', 'bg-sky-950/30', 'glow-primary');
            el.classList.add('border-outline-variant');
        });
        const slot = document.querySelector(`.qra-slot[data-slot="${slotNum}"]`);
        if (slot) {
            slot.classList.remove('border-outline-variant');
            slot.classList.add('border-sky-500', 'bg-sky-950/30', 'glow-primary');
            this.selectedQRA = slotNum;
        }
    },

    scramble: function() {
        if (!this.selectedQRA) {
            window.SharedComponents?.showToast('SELECT QRA', 'Choose an aircraft first', 'warning', 'warning');
            return;
        }
        if (this.scrambledSlots.has(this.selectedQRA)) {
            window.SharedComponents?.showToast('ALREADY AIRBORNE', `QRA-${this.selectedQRA} is already scrambled`, 'flight', 'warning');
            return;
        }
        
        // Check if slot is available (not Cold or Standby)
        const slot = document.querySelector(`.qra-slot[data-slot="${this.selectedQRA}"]`);
        const statusEl = slot?.querySelector('.qra-status');
        if (statusEl && (statusEl.textContent === 'COLD' || statusEl.textContent === 'STANDBY')) {
            window.SharedComponents?.showToast('SYSTEM COLD', `QRA-${this.selectedQRA} must be HOT for launch`, 'error', 'error');
            return;
        }

        this.scrambledSlots.add(this.selectedQRA);
        window.SharedComponents?.showToast('SCRAMBLING', `QRA-${this.selectedQRA} airborne!`, 'flight_takeoff', 'error');

        if (statusEl) {
            statusEl.textContent = 'SCRAMBLED';
            statusEl.classList.remove('text-tertiary', 'text-outline', 'text-amber-400');
            statusEl.classList.add('text-sky-400', 'animate-pulse');
        }

        const standbyEl  = document.getElementById('live-standby');
        const scrambledEl = document.getElementById('live-scrambled');
        if (standbyEl)  standbyEl.textContent  = Math.max(0, Number(standbyEl.textContent) - 1);
        if (scrambledEl) scrambledEl.textContent = this.scrambledSlots.size;

        this.createMissionFromIncident(this.selectedIncidentId || 'INC-2026-0423-01');
    },

    createMissionFromIncident: function(incId) {
        this.setIncidentActive(incId);
        window.SharedComponents?.showToast('MISSION TASKING', `Tasking QRA-${this.selectedQRA || '1'} to ${incId}`, 'military_tech', 'primary');
    },

    aiOptimizeScramble: function() {
        let bestSlot = null;
        document.querySelectorAll('.qra-slot[onclick]').forEach(slot => {
            const num = Number(slot.dataset.slot);
            const statusEl = slot.querySelector('.qra-status');
            if (statusEl && statusEl.textContent !== 'SCRAMBLED' && statusEl.textContent !== 'COLD' && bestSlot === null) {
                bestSlot = num;
            }
        });
        if (bestSlot !== null) this.selectQRASlot(bestSlot);
        
        if (window.AISystem) {
            const sector = 'Baltic Sea';
            const bestBase = AISystem.recommendAsset(sector);
            window.SharedComponents?.showToast('AI OPTIMIZE', `QRA-${bestSlot || 1} selected — ${bestBase.name} recommended`, 'psychology', 'primary');
        }
    },

    showPreFlightChecklist: function() {
        const qra  = this.selectedQRA;
        const crew = this.qraData[qra] || { pilot: 'LT Berg', aircraft: 'JAS 39C / 391' };
        const checklist = [
            'Engine Start', 'Pitot Heat', 'Radar Check',
            'Nav System', 'Comm Check', 'Weapons Arm', 'Fuel Check'
        ];
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="glass-panel w-[450px] max-w-[90vw] rounded-lg overflow-hidden">
                <div class="p-4 border-b border-outline-variant flex justify-between items-center bg-tertiary/10">
                    <h3 class="font-['Space_Grotesk'] text-lg font-bold text-tertiary uppercase tracking-widest">Pre-Flight Checklist${qra ? ` — QRA-${qra}` : ''}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-outline hover:text-on-surface p-1"><span class="material-symbols-outlined">close</span></button>
                </div>
                <div class="p-6 space-y-3">
                    ${checklist.map(item => `
                        <div class="checklist-item flex justify-between items-center p-3 bg-surface-variant/20 rounded-md border border-outline-variant/10 transition-all cursor-pointer hover:bg-surface-variant/40" data-status="PENDING">
                            <span class="text-on-surface font-medium">${item}</span>
                            <div class="flex items-center gap-3">
                                <span class="status-label text-[9px] font-bold text-outline uppercase">Pending</span>
                                <div class="check-box w-5 h-5 border border-outline-variant rounded flex items-center justify-center bg-black/20"></div>
                            </div>
                        </div>`).join('')}
                </div>
                <div class="p-4 bg-black/20 border-t border-outline-variant/30 flex justify-between items-center">
                    <div class="flex flex-col">
                        <span class="text-[8px] text-outline uppercase font-bold tracking-tighter">Pilot in Command</span>
                        <span class="text-on-surface font-bold text-xs">${crew.pilot}</span>
                    </div>
                    <div class="flex flex-col text-right">
                        <span class="text-[8px] text-outline uppercase font-bold tracking-tighter">Airframe</span>
                        <span class="text-on-surface font-bold text-xs">${crew.aircraft}</span>
                    </div>
                </div>
                <div class="p-4 border-t border-outline-variant/30 flex justify-end">
                    <button onclick="this.closest('.fixed').remove(); AssetManager.scramble();" class="bg-tertiary text-black px-8 py-2 text-[10px] font-black uppercase hover:opacity-90 transition-opacity glow-tertiary">Initiate Launch</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        modal.addEventListener('click', (event) => {
            const row = event.target.closest('.checklist-item');
            if (!row) return;
            const checked = row.dataset.status === 'CHECKED';
            row.dataset.status = checked ? 'PENDING' : 'CHECKED';
            
            const checkBox = row.querySelector('.check-box');
            const statusLabel = row.querySelector('.status-label');
            
            if (checked) {
                row.classList.remove('bg-green-900/20', 'border-green-500/30');
                checkBox.innerHTML = '';
                checkBox.classList.remove('bg-green-500', 'border-green-500');
                statusLabel.textContent = 'Pending';
                statusLabel.classList.remove('text-green-400');
                statusLabel.classList.add('text-outline');
            } else {
                row.classList.add('bg-green-900/20', 'border-green-500/30');
                checkBox.innerHTML = '<span class="material-symbols-outlined text-white text-[16px]">check</span>';
                checkBox.classList.add('bg-green-500', 'border-green-500');
                statusLabel.textContent = 'Verified';
                statusLabel.classList.add('text-green-400');
                statusLabel.classList.remove('text-outline');
            }
        });
    },

    showLoadoutConfig: function() {
        const weapons = [
            { name: 'IRIS-T',   qty: 2, status: 'selected',  available: this.munitionStock['IRIS-T SRAAM'].qty },
            { name: 'AIM-120B', qty: 4, status: 'selected',  available: this.munitionStock['AIM-120B'].qty },
            { name: 'GBU-39',   qty: 2, status: 'available', available: this.munitionStock['GBU-39 SDB'].qty },
            { name: 'KEP 500',  qty: 1, status: 'available', available: this.munitionStock['KEP 500'].qty }
        ];
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="glass-panel w-[400px] max-w-[90vw] rounded-lg overflow-hidden">
                <div class="p-4 border-b border-outline-variant flex justify-between items-center bg-primary/10">
                    <h3 class="font-['Space_Grotesk'] text-lg font-bold text-primary uppercase tracking-widest">Weapon Loadout</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-outline hover:text-on-surface p-1"><span class="material-symbols-outlined">close</span></button>
                </div>
                <div class="p-6 space-y-4">
                    ${weapons.map(w => `
                        <div class="loadout-item flex justify-between items-center p-3 ${w.status === 'selected' ? 'bg-primary/10 border border-primary/30' : 'bg-surface-variant/20 border border-transparent'} rounded-md transition-all cursor-pointer hover:border-primary/20" data-selected="${w.status === 'selected'}" data-qty="${w.qty}">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 flex items-center justify-center bg-black/30 rounded border border-outline-variant/20">
                                    <span class="material-symbols-outlined text-[18px] text-outline">rocket</span>
                                </div>
                                <div>
                                    <div class="weapon-name text-on-surface font-bold text-sm">${w.name}</div>
                                    <div class="weapon-status text-[9px] text-outline font-bold uppercase tracking-tighter">${w.status === 'selected' ? 'Loaded' : 'Available'}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <span class="text-on-surface font-['Orbitron'] text-sm">x${w.qty}</span>
                                <button data-action="toggle-loadout" class="w-8 h-8 flex items-center justify-center rounded transition-colors ${w.status === 'selected' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-outline hover:bg-primary/20'}">
                                    <span class="material-symbols-outlined text-[16px]">${w.status === 'selected' ? 'close' : 'add'}</span>
                                </button>
                            </div>
                        </div>`).join('')}
                </div>
                <div class="p-4 bg-black/20 border-t border-outline-variant/30 flex justify-between items-center">
                    <span class="text-outline text-[10px] font-bold uppercase tracking-widest">Total Payload:</span>
                    <span id="loadout-total" class="text-primary font-bold font-['Orbitron'] text-lg">6 Items</span>
                </div>
                <div class="p-4 border-t border-outline-variant/30 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 text-[10px] font-bold uppercase text-outline hover:text-on-surface transition-colors">Cancel</button>
                    <button onclick="this.closest('.fixed').remove(); window.SharedComponents?.showToast('LOADOUT CONFIGURED', 'Weapons ready', 'check', 'success')" class="bg-primary text-on-primary px-8 py-2 text-[10px] font-black uppercase glow-primary">Confirm Configuration</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const updateTotal = () => {
            const total = Array.from(modal.querySelectorAll('.loadout-item[data-selected="true"]'))
                .reduce((sum, item) => sum + Number(item.dataset.qty || 0), 0);
            const el = modal.querySelector('#loadout-total');
            if (el) el.textContent = `${total} Items`;
        };
        
        modal.addEventListener('click', (event) => {
            const button = event.target.closest('.loadout-item');
            if (!button) return;
            const selected = button.dataset.selected === 'true';
            button.dataset.selected = selected ? 'false' : 'true';
            
            button.classList.toggle('bg-primary/10', !selected);
            button.classList.toggle('border-primary/30', !selected);
            button.classList.toggle('bg-surface-variant/20', selected);
            button.classList.toggle('border-transparent', selected);
            
            const status = button.querySelector('.weapon-status');
            if (status) status.textContent = selected ? 'Available' : 'Loaded';
            
            const iconBtn = button.querySelector('button');
            const icon = iconBtn.querySelector('.material-symbols-outlined');
            if (selected) {
                iconBtn.className = 'w-8 h-8 flex items-center justify-center rounded transition-colors bg-surface-variant text-outline hover:bg-primary/20';
                icon.textContent = 'add';
            } else {
                iconBtn.className = 'w-8 h-8 flex items-center justify-center rounded transition-colors bg-primary text-on-primary';
                icon.textContent = 'close';
            }
            updateTotal();
        });
        updateTotal();
    },

    sort: function(col) {
        this.sortCol === col ? (this.sortAsc = !this.sortAsc) : (this.sortCol = col, this.sortAsc = true);
        this.updateSortIndicators();
        this.filterTable();
    },

    updateSortIndicators: function() {
        document.querySelectorAll('.sort-dir').forEach(el => { el.textContent = ''; });
        const indicator = document.querySelector(`.sort-dir[data-col="${this.sortCol}"]`);
        if (indicator) indicator.textContent = this.sortAsc ? ' ▲' : ' ▼';
    },

    filterTable: function() {
        const tbody = document.getElementById('maintenance-body');
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const filtered = rows.filter(row => {
            if (!this.searchQuery) return true;
            const assetId   = row.dataset.assetId?.toLowerCase()   || '';
            const base      = row.dataset.base?.toLowerCase()      || '';
            const procedure = row.dataset.procedure?.toLowerCase() || '';
            const status    = row.dataset.status?.toLowerCase()    || '';
            return assetId.includes(this.searchQuery) || base.includes(this.searchQuery) ||
                   procedure.includes(this.searchQuery) || status.includes(this.searchQuery);
        });
        if (this.sortCol) {
            filtered.sort((a, b) => {
                let va = a.dataset[this.sortCol] || '';
                let vb = b.dataset[this.sortCol] || '';
                if (this.sortCol === 'downtime') { va = parseInt(va, 10) || 999; vb = parseInt(vb, 10) || 999; }
                if (va < vb) return this.sortAsc ? -1 : 1;
                if (va > vb) return this.sortAsc ? 1 : -1;
                return 0;
            });
        }
        rows.forEach(row => row.classList.toggle('hidden', !filtered.includes(row)));
        filtered.forEach(row => tbody.appendChild(row));
    },

    refreshData: function() {
        const btn = document.querySelector('#btn-refresh');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">sync</span> REFRESHING...';
        }
        window.SharedComponents?.showToast('REFRESHING', 'Updating asset status...', 'sync');

        setTimeout(() => {
            const statuses = ['HOT', 'WARM', 'COLD'];
            document.querySelectorAll('.qra-slot').forEach((slot) => {
                const statusEl = slot.querySelector('.qra-status');
                if (!statusEl) return;
                if (this.scrambledSlots.has(Number(slot.dataset.slot))) return;
                
                // Keep Slot 3 as Standby if it was originally
                if (slot.dataset.slot === "3" && statusEl.textContent === "STANDBY") return;

                const next = statuses[Math.floor(Math.random() * statuses.length)];
                statusEl.textContent = next;
                statusEl.classList.remove('text-tertiary', 'text-amber-400', 'text-outline', 'text-sky-400');
                if (next === 'HOT')  statusEl.classList.add('text-tertiary');
                if (next === 'WARM') statusEl.classList.add('text-amber-400');
                if (next === 'COLD') statusEl.classList.add('text-outline');
            });

            const times = document.querySelectorAll('#incident-feed .font-data-mono');
            times.forEach(el => {
                const h = Math.floor(Math.random() * 2) + 14;
                const m = Math.floor(Math.random() * 60);
                el.textContent = `${h}:${m.toString().padStart(2, '0')}Z`;
            });

            const currentScrambled = this.scrambledSlots.size;
            const grounded = 3;
            const total    = 23;
            const patrolling = 8;
            const standby  = total - currentScrambled - grounded - patrolling;

            const patrolEl   = document.getElementById('live-patrolling');
            const standbyEl  = document.getElementById('live-standby');
            const groundedEl = document.getElementById('live-grounded');
            const scrambledEl = document.getElementById('live-scrambled');
            if (patrolEl)   patrolEl.textContent   = patrolling;
            if (standbyEl)  standbyEl.textContent  = Math.max(0, standby);
            if (groundedEl) groundedEl.textContent = grounded;
            if (scrambledEl) scrambledEl.textContent = currentScrambled;

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">sync</span> FORCE REFRESH';
            }
            window.SharedComponents?.showToast('DATA UPDATED', 'All systems refreshed', 'check', 'success');
        }, 800);
    },

    exportCSV: function() {
        const timestamp = new Date().toISOString().slice(0, 10);
        const tbody = document.getElementById('maintenance-body');
        const rows  = Array.from(tbody.querySelectorAll('tr'));
        const maintenanceData = [['=== MAINTENANCE LOGS ==='], ['ASSET ID', 'BASE', 'PROCEDURE', 'EST. DOWNTIME', 'STATUS']];
        rows.forEach(row => {
            maintenanceData.push([
                row.dataset.assetId   || '',
                row.dataset.base      || '',
                row.dataset.procedure || '',
                row.dataset.downtime === '999' ? 'TBD' : row.dataset.downtime + ' HRS',
                row.dataset.status    || ''
            ]);
        });

        const csvContent = "data:text/csv;charset=utf-8," + maintenanceData.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SWAF_Asset_Readiness_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.SharedComponents?.showToast('EXPORT SUCCESS', 'CSV file generated', 'download', 'success');
    }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    AssetManager.init();
});
