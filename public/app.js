// Chorekin App JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const defaultDb = {
        petType: null,
        pin: null,
        level: 1,
        exp: 0,
        lastFed: Date.now(),
        chores: [
            { id: 1, name: "Clean Room", points: 20, desc: "Pick up all toys" },
            { id: 2, name: "Brush Teeth", points: 5, desc: "2 minutes of brushing" }
        ],
        showStats: false,
        unlockedRewards: [],
        activeReward: null
    };

    function loadDb() {
        const raw = localStorage.getItem('chorekin_data');
        if (!raw) return { ...defaultDb };
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return { ...defaultDb };
            }
            return { ...defaultDb, ...parsed };
        } catch (err) {
            console.warn('Invalid chorekin_data in localStorage; resetting to defaults.');
            return { ...defaultDb };
        }
    }

    const G = {
        db: loadDb(),
        rewards: [],
        save() { localStorage.setItem('chorekin_data', JSON.stringify(this.db)); }
    };

    // ── Reward Center ──────────────────────────────────────────
    const CSS_COLOR_RE = /^#[0-9a-fA-F]{3,8}$|^[a-z]+$/;

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function loadRewards() {
        try {
            const res = await fetch('./rewards/rewards.json');
            const json = await res.json();
            G.rewards = json.rewards || [];
        } catch (e) {
            console.warn('Could not load rewards.json', e);
            G.rewards = [];
        }
    }

    function applyTheme(reward) {
        const root = document.documentElement;
        // Clear any previously applied theme vars first
        const allRewardVarKeys = G.rewards
            .filter(r => r.type === 'palette' && r.data && r.data.cssVars)
            .flatMap(r => Object.keys(r.data.cssVars));
        [...new Set(allRewardVarKeys)].forEach(k => root.style.removeProperty(k));

        if (!reward || !reward.data || !reward.data.cssVars) return;
        Object.entries(reward.data.cssVars).forEach(([prop, val]) => {
            root.style.setProperty(prop, val);
        });
    }

    function restoreActiveTheme() {
        if (!G.db.activeReward) return;
        const reward = G.rewards.find(r => r.id === G.db.activeReward);
        if (reward) applyTheme(reward);
    }

    function getPalettePreviewColors(reward) {
        if (!reward.data || !reward.data.cssVars) return [];
        const vars = reward.data.cssVars;
        return [
            vars['--pet-stage-default-bg'],
            vars['--app-bg'],
            vars['--bg-color']
        ].filter(c => c && CSS_COLOR_RE.test(c));
    }

    function renderRewardCenter() {
        const xpEl = document.getElementById('reward-center-xp');
        const listEl = document.getElementById('reward-center-list');
        if (!listEl) return;

        if (xpEl) xpEl.textContent = `You have ${G.db.exp} XP`;

        listEl.innerHTML = G.rewards.map(reward => {
            const isUnlocked = G.db.unlockedRewards.includes(reward.id);
            const isActive = G.db.activeReward === reward.id;
            const canAfford = G.db.exp >= reward.cost;
            const previewColors = getPalettePreviewColors(reward);

            const previewHtml = previewColors.length
                ? `<div class="palette-preview">${previewColors.map(c => `<span style="background:${escHtml(c)}"></span>`).join('')}</div>`
                : '';

            let actionBtn;
            if (isActive) {
                actionBtn = `<wa-button size="small" variant="success" disabled>Active</wa-button>`;
            } else if (isUnlocked) {
                actionBtn = `<wa-button size="small" variant="primary" data-reward-action="apply" data-reward-id="${escHtml(reward.id)}">Apply</wa-button>`;
            } else {
                actionBtn = `<wa-button size="small" variant="${canAfford ? 'warning' : 'neutral'}" ${canAfford ? '' : 'disabled'} data-reward-action="purchase" data-reward-id="${escHtml(reward.id)}">Unlock – ${reward.cost} XP</wa-button>`;
            }

            return `
                <div class="reward-card${isActive ? ' active-reward' : ''}">
                    ${previewHtml}
                    <span class="reward-name">${escHtml(reward.name)}</span>
                    <span class="reward-desc">${escHtml(reward.description)}</span>
                    ${actionBtn}
                </div>
            `;
        }).join('');
    }

    document.getElementById('reward-center-list').addEventListener('click', function(e) {
        const btn = e.target.closest('[data-reward-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-reward-action');
        const id = btn.getAttribute('data-reward-id');
        if (action === 'purchase') window.purchaseReward(id);
        else if (action === 'apply') window.applyReward(id);
    });

    window.purchaseReward = function(id) {
        const reward = G.rewards.find(r => r.id === id);
        if (!reward || G.db.unlockedRewards.includes(id)) return;
        if (G.db.exp < reward.cost) return;
        G.db.exp -= reward.cost;
        G.db.unlockedRewards.push(id);
        G.save();
        updateExpRating();
        renderRewardCenter();
    };

    window.applyReward = function(id) {
        const reward = G.rewards.find(r => r.id === id);
        if (!reward || !G.db.unlockedRewards.includes(id)) return;
        G.db.activeReward = id;
        G.save();
        applyTheme(reward);
        renderRewardCenter();
    };
    // ── End Reward Center ──────────────────────────────────────
    const MathEngine = {
        currentProblem: {},
        generate() {
            const lvl = G.db.level;
            let a, b, op = '+';
            if (lvl === 1) {
                a = Math.floor(Math.random() * 5) + 1;
                b = Math.floor(Math.random() * 5) + 1;
            } else if (lvl === 2) {
                a = Math.floor(Math.random() * 10) + 1;
                b = Math.floor(Math.random() * 10) + 1;
            } else {
                a = Math.floor(Math.random() * 5) + 1;
                b = Math.floor(Math.random() * 5) + 1;
                op = '×';
            }
            this.currentProblem = { a, b, op, ans: op === '+' ? a + b : a * b };
            document.getElementById('math-problem').innerText = `${a} ${op} ${b}`;
        }
    };
    function showScreen(id) {
        const tabs = document.getElementById('bottom-tabs');

        if (id === 'select') {
            document.getElementById('pet-select-dialog').setAttribute('open', '');
        } else if (id === 'setup') {
            // toggle to the settings tab
            tabs.setAttribute('active', 'settings');
        } else if (id === 'game') {
            // toggle to the game tab
            tabs.setAttribute('active', 'character');
        }
    }
    function activateTab(panelName) {
        const tabGroup = document.getElementById('bottom-tabs');
        if (!tabGroup) return;
        const panels = Array.from(tabGroup.querySelectorAll('wa-tab-panel'));
        const tabs = Array.from(tabGroup.querySelectorAll('wa-tab'));
        tabGroup.setAttribute('active', panelName);
        panels.forEach(p => p.classList.toggle('active', p.getAttribute('name') === panelName));
        tabs.forEach(t => t.toggleAttribute('active', t.getAttribute('panel') === panelName));
    }
    window.selectPet = (type) => {
        G.db.petType = type;
        console.log("Selected pet:", type);
        G.save();
        document.getElementById('pet-select-dialog').removeAttribute('open');
        showScreen('setup');
    };
    document.getElementById('btn-save-setup').addEventListener('click', () => {
        const waInput = document.getElementById('setup-pin');
        let pin = waInput && (waInput.value || waInput.getAttribute('value'));
        if (!pin && waInput && waInput.shadowRoot) {
            const inputEl = waInput.shadowRoot.querySelector('input');
            if (inputEl) pin = inputEl.value;
        }
        if (pin && pin.length === 4) {
            G.db.pin = pin;
            G.save();
            location.reload();
        }
    });
    document.getElementById('btn-pin-confirm').addEventListener('click', () => {
        const pinInput = document.getElementById('pin-input');
        const pin = pinInput && (pinInput.value || pinInput.getAttribute('value'));
        const pinDialog = document.getElementById('pin-dialog');
        if (pin === G.db.pin) {
            if (window._pendingPanelAccess === 'settings') {
                activateTab('settings');
                window._pendingPanelAccess = null;
                window._pendingChoreId = null;
                if (pinDialog) pinDialog.removeAttribute('open');
                if (pinInput) {
                    pinInput.value = '';
                    pinInput.setAttribute('placeholder', 'Enter PIN');
                }
                return;
            }
            // Find the chore by id
            const choreId = window._pendingChoreId;
            const choreIdx = G.db.chores.findIndex(c => c.id === choreId);
            if (choreIdx !== -1) {
                // Add points to pet (exp)
                G.db.exp += G.db.chores[choreIdx].points;
                // Update lastFed to now
                G.db.lastFed = Date.now();
                // Remove the completed chore
                G.db.chores.splice(choreIdx, 1);
                G.save();
                renderChores();
                updatePetVisuals();
            }
            window._pendingChoreId = null;
            if (pinDialog) pinDialog.removeAttribute('open');
            if (pinInput) pinInput.value = '';
        } else {
            // Optionally, show error feedback
            if (pinInput) pinInput.value = '';
            pinInput.setAttribute('placeholder', 'Wrong PIN!');
        }
    });
    function updateExpRating() {
        const expRating = document.getElementById('exp-rating');
        const expPoints = document.getElementById('exp-points');
        if (!expRating) return;
        // Each 100 exp = 1 star, always show at least 1 star
        const stars = Math.max(1, Math.floor(G.db.exp / 100) + 1);
        expRating.setAttribute('max', stars);
        expRating.setAttribute('value', Math.floor(G.db.exp / 100));
        if (expPoints) {
            expPoints.textContent = `${G.db.exp} XP`;
        }
    }
    function updateMathLevelBadge() {
        const levelBadge = document.getElementById('stat-math-level');
        if (!levelBadge) return;
        levelBadge.textContent = `Math Lvl ${G.db.level}`;
    }

    if (!G.db.petType) {
        console.log("No pet selected, showing pet selection screen");
        showScreen('select');
    } else if (!G.db.pin) {
        console.log("No PIN set, showing setup screen");
        showScreen('setup');
    } else {
        showScreen('game');
        loadRewards().then(() => {
            restoreActiveTheme();
            initGame();
        });
        setupTabs();
        // Start hunger bar update interval
        setInterval(updatePetVisuals, 60000); // update every minute
        
        // Setup reward center drawer
        const expWrapper = document.getElementById('exp-rating-wrapper');
        const rewardCenterDrawer = document.getElementById('reward-center-drawer');
        if (expWrapper && rewardCenterDrawer) {
            expWrapper.addEventListener('click', () => {
                renderRewardCenter();
                rewardCenterDrawer.setAttribute('open', '');
            });
        }
    }
    function setupTabs() {
        const tabGroup = document.getElementById('bottom-tabs');
        const tabs = Array.from(tabGroup.querySelectorAll('wa-tab'));
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const panelName = tab.getAttribute('panel');
                if (panelName === 'settings' && G.db.pin) {
                    const pinDialog = document.getElementById('pin-dialog');
                    const pinInput = document.getElementById('pin-input');
                    window._pendingPanelAccess = 'settings';
                    window._pendingChoreId = null;
                    if (pinInput) {
                        pinInput.value = '';
                        pinInput.setAttribute('placeholder', 'Enter PIN');
                    }
                    if (pinDialog) pinDialog.setAttribute('open', '');
                    return;
                }
                activateTab(panelName);
            });
        });
        activateTab('character');
    }
    function initGame() {
        renderChores();
        MathEngine.generate();
        updateMathLevelBadge();
        updatePetVisuals();
        updateExpRating();
    }
    function renderChores() {
        const container = document.getElementById('chore-container');
        const noChoresState = document.getElementById('no-chores-state');
        if (G.db.chores.length === 0) {
            if (noChoresState) noChoresState.style.display = '';
        } else {
            if (noChoresState) noChoresState.style.display = 'none';
        }
        container.innerHTML = G.db.chores.map(c => `
            <wa-card style="margin-bottom:0.625rem">
                <strong>${c.name}</strong>
                <div style="margin-top:0.25rem;color:#888;font-size:0.75rem; display: inline;">${c.points} pts</div>
                ${c.desc ? `<br><small>${c.desc}</small>` : ''}
                <wa-button slot="footer" size="small" onclick="triggerApproval(${c.id})">Complete</wa-button>
            </wa-card>
        `).join('');
        updateExpRating();
    }
    function updatePetVisuals() {
        const petStage = document.getElementById('pet-stage');
        const hungerBar = document.getElementById('stat-hunger');
        const emotionClasses = ['emotion-happy', 'emotion-hungry', 'emotion-mad', 'emotion-sad'];
        let emotion = 'happy';
        const now = Date.now();
        // Hunger logic: 0h = 100%, 12h = 0%
        const maxHungerMs = 43200000; // 12 hours
        let hunger = Math.max(0, 100 - Math.floor(((now - G.db.lastFed) / maxHungerMs) * 100));

        // Dynamic mood score so frustration increases as hunger rises, levels grow, and exp is low.
        const hungerStress = 1 - (hunger / 100);
        const levelPressure = Math.min(1, G.db.level / 10);
        const expRelief = Math.min(1, G.db.exp / 20);
        const madScore = (hungerStress * 0.55) + (levelPressure * 0.25) + ((1 - expRelief) * 0.20);

        // Dynamic sadness score: fewer chores, lower progress, higher hunger, and longer inactivity increase sadness.
        const expectedChores = Math.max(1, Math.min(6, 1 + Math.floor(G.db.level / 2)));
        const choreDeficit = Math.min(1, Math.max(0, (expectedChores - G.db.chores.length) / expectedChores));
        const inactivity = Math.min(1, (now - G.db.lastFed) / 21600000); // 6 hours to max sadness contribution
        const levelExpTarget = Math.max(10, G.db.level * 10);
        const expPressure = Math.min(1, Math.max(0, (levelExpTarget - G.db.exp) / levelExpTarget));
        const sadScore = (choreDeficit * 0.45) + (hungerStress * 0.25) + (inactivity * 0.15) + (expPressure * 0.15);

        console.log(`Hunger: ${hunger}%, Mad Score: ${madScore.toFixed(2)}, Sad Score: ${sadScore.toFixed(2)}`);

        if (hunger === 0) {
            emotion = 'hungry';
        } else if (G.db.chores.length > 0 && madScore >= 0.45) {
            emotion = 'mad';
        } else if (sadScore >= 0.5) {
            emotion = 'sad';
        }
        let variant = 'success';
        let label = 'Happy';
        if (emotion === 'hungry') {
            label = 'Hungry!';
            variant = 'danger';
        } else if (emotion === 'mad') {
            variant = 'danger';
            label = 'Mad!';
        } else if (emotion === 'sad') {
            variant = 'warning';
            label = sadScore >= 0.75 ? 'Very Sad!' : 'Sad!';
        }
        
        if (petStage) {
            petStage.classList.remove(...emotionClasses);
            petStage.classList.add(`emotion-${emotion}`);
        }
        if (hungerBar) {
            hungerBar.value = hunger;
            hungerBar.setAttribute('variant', variant);
            hungerBar.setAttribute('label', label);
            
        }
        updateExpRating();
    }
    window.triggerApproval = function(choreId) {
        const pinDialog = document.getElementById('pin-dialog');
        window._pendingPanelAccess = null;
        if (pinDialog) pinDialog.setAttribute('open', '');
        // Optionally, store the choreId for later approval logic
        window._pendingChoreId = choreId;
    };
    document.getElementById('btn-math-submit').addEventListener('click', () => {
        const input = document.getElementById('math-answer');
        const feedback = document.getElementById('math-feedback');
        if (parseInt(input.value) === MathEngine.currentProblem.ans) {
            G.db.exp++;
            feedback.innerText = "Correct! +1 Exp";
            if (G.db.exp >= 10) { G.db.level++; G.db.exp = 0; }
            G.save();
            updateMathLevelBadge();
            setTimeout(() => { 
                input.value = ''; 
                MathEngine.generate(); 
                feedback.innerText = '';
            }, 1000);
        } else {
            feedback.innerText = "Try again!";
        }
        updateExpRating();
    });
    document.getElementById('add-chore-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const nameInput = document.getElementById('chore-name');
        const descInput = document.getElementById('chore-desc');
        const pointsInput = document.getElementById('chore-points');
        const name = nameInput && (nameInput.value || nameInput.getAttribute('value'));
        const desc = descInput && (descInput.value || descInput.getAttribute('value'));
        const points = parseInt(pointsInput && (pointsInput.value || pointsInput.getAttribute('value')));
        if (name && points > 0) {
            const newId = G.db.chores.length > 0 ? Math.max(...G.db.chores.map(c => c.id)) + 1 : 1;
            G.db.chores.push({ id: newId, name, desc, points, desc });
            G.save();
            renderChores();
            updatePetVisuals();
            nameInput.value = '';
            descInput.value = '';
            pointsInput.value = 10;
        }
        updateExpRating();
    });
});
