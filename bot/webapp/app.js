// ============================================================
// «Кім боламын?» Mini App — v4 (results + profile)
// ============================================================

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ========== Constants ==========

const CATEGORY_ICONS = {
    interests: '#ico-cat-interests',
    strengths: '#ico-cat-strengths',
    subjects:  '#ico-cat-subjects',
    values:    '#ico-cat-values',
    workstyle: '#ico-cat-workstyle',
    digital:   '#ico-cat-digital',
};

const PERSONALITY_TYPES = [
    {
        id: 'technologist',
        name: 'Технолог',
        svgIcon: '#ico-field-it',
        desc: 'Сен технология мен инновацияға бейімсің. Логикалық ойлау мен цифрлық дағдылар — сенің күшті жағың.',
        tags: ['IT', 'технология', 'логика', 'цифрлық', 'автоматтандыру'],
    },
    {
        id: 'researcher',
        name: 'Зерттеуші',
        svgIcon: '#ico-field-science',
        desc: 'Ғылым мен зерттеу — сенің стихияң. Тереңірек білуге, талдауға ұмтыласың.',
        tags: ['ғылым', 'зерттеу', 'математика', 'деректер'],
    },
    {
        id: 'creative',
        name: 'Шығармашыл',
        svgIcon: '#ico-field-creative',
        desc: 'Шығармашылық пен дизайн саған тән. Сен әлемді ерекше көресің және жасай аласың.',
        tags: ['шығармашылық', 'дизайн', 'өнер'],
    },
    {
        id: 'communicator',
        name: 'Коммуникатор',
        svgIcon: '#ico-field-education',
        desc: 'Адамдармен жұмыс — сенің таланың. Тыңдай, түсіне және жетектей аласың.',
        tags: ['коммуникация', 'әлеуметтік', 'психология', 'педагогика'],
    },
    {
        id: 'entrepreneur',
        name: 'Бизнесмен',
        svgIcon: '#ico-field-business',
        desc: 'Басқару, жоспарлау, көшбасшылық — сенде бизнес рухы бар.',
        tags: ['бизнес', 'экономика', 'басқару', 'көшбасшылық', 'мансап'],
    },
    {
        id: 'practitioner',
        name: 'Тәжірибеші',
        svgIcon: '#ico-field-engineering',
        desc: 'Қолмен жұмыс, инженерия, құрылыс — сен практикалық шешімдер табасың.',
        tags: ['инженерия', 'құрылыс', 'қол_еңбек'],
    },
    {
        id: 'healer',
        name: 'Емші',
        svgIcon: '#ico-field-medical',
        desc: 'Медицина мен денсаулық саласы саған жақын. Адамдарға көмектесу — сенің мақсатың.',
        tags: ['медицина', 'денсаулық'],
    },
];

// Map profession field → SVG icon
const FIELD_ICONS = {
    'IT':                '#ico-field-it',
    'Медицина':          '#ico-field-medical',
    'Инженерия':         '#ico-field-engineering',
    'Білім':             '#ico-field-education',
    'Бизнес':            '#ico-field-business',
    'Қаржы':             '#ico-field-business',
    'Шығармашылық':      '#ico-field-creative',
    'Өнер':              '#ico-field-creative',
    'Ғылым':             '#ico-field-science',
    'Құқық':             '#ico-field-law',
    'Мемлекет':          '#ico-field-law',
    'Ауыл шаруашылығы':  '#ico-field-agriculture',
    'Тағам':             '#ico-field-agriculture',
    'Туризм':            '#ico-field-tourism',
    'Қызмет':            '#ico-field-tourism',
    'Спорт':             '#ico-field-sport',
};

function getFieldIcon(field) {
    if (!field) return '#ico-briefcase';
    for (const [key, icon] of Object.entries(FIELD_ICONS)) {
        if (field.includes(key) || field.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return '#ico-briefcase';
}

function svgIcon(href, cls) {
    return `<svg class="icon ${cls || 'icon-md'}"><use href="${href}"/></svg>`;
}

const STORAGE_KEY = 'kim_bolamyn_history';

// ========== State ==========

let questions = [];
let categories = [];
let professions = [];
let universities = [];
let uniMap = {};
let currentIndex = 0;
let answers = [];
let timings = [];
let questionStartTime = 0;
let testStartTime = 0;
let timerInterval = null;
let shuffleMaps = [];
let matchedResults = [];
let lastTagScores = {};
let lastConfidence = 0;

// ========== Init ==========

async function init() {
    try {
        const baseUrl = window.location.href.replace(/\/webapp\/.*$/, '');
        const [qResp, pResp, uResp] = await Promise.all([
            fetch(baseUrl + '/api/questions'),
            fetch(baseUrl + '/api/professions'),
            fetch(baseUrl + '/api/universities'),
        ]);
        const qData = await qResp.json();
        const pData = await pResp.json();
        const uData = await uResp.json();

        categories = qData.categories;
        professions = pData.professions || pData;
        universities = uData.universities;
        uniMap = uData.profession_university_map;

        categories.forEach(cat => {
            cat.questions.forEach(q => {
                questions.push({
                    ...q,
                    categoryId: cat.id,
                    categoryName: cat.name,
                    categoryEmoji: cat.emoji,
                });
            });
        });

        const seed = (tg.initDataUnsafe?.user?.id || 0) + Math.floor(Date.now() / 86400000);
        questions.forEach((q, i) => {
            shuffleMaps.push(generateShuffleMap(q.options.length, seed + i));
        });

        // Event listeners
        document.getElementById('btn-start').addEventListener('click', startQuiz);
        document.getElementById('btn-submit').addEventListener('click', submitResults);
        document.getElementById('btn-send-results').addEventListener('click', submitResults);
        document.getElementById('btn-profile').addEventListener('click', showProfile);
        document.getElementById('btn-profile-back').addEventListener('click', () => showScreen('welcome-screen'));
        document.getElementById('btn-profile-start').addEventListener('click', startQuiz);
        document.getElementById('btn-results-profile').addEventListener('click', () => {
            if (viewingHistory) returnFromHistoryResults();
            else showProfile();
        });
        document.getElementById('modal-close-btn').addEventListener('click', closeModal);
        document.getElementById('profession-modal').addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });

        // Show profile button if has history
        const history = getHistory();
        if (history.length > 0) {
            document.getElementById('btn-profile').hidden = false;
        }
    } catch (e) {
        console.error('Init error:', e);
        showToast('Қате! Қайта ашып көріңіз.');
    }
}

// ========== Seeded Shuffle ==========

function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function generateShuffleMap(length, seed) {
    const indices = Array.from({ length }, (_, i) => i);
    const rng = mulberry32(seed);
    for (let i = length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
}

// ========== Quiz Flow ==========

function startQuiz() {
    testStartTime = Date.now();
    currentIndex = 0;
    answers = [];
    timings = [];

    showScreen('quiz-screen');
    renderQuestion();
    startTimer();
}

function renderQuestion() {
    const q = questions[currentIndex];
    const shuffleMap = shuffleMaps[currentIndex];
    const catId = q.categoryId;

    document.getElementById('progress-label').textContent =
        `${currentIndex + 1} / ${questions.length}`;
    document.getElementById('progress-fill').style.width =
        `${(currentIndex / questions.length) * 100}%`;

    const iconHref = CATEGORY_ICONS[catId] || '#ico-target';
    const badge = document.getElementById('category-badge');
    badge.innerHTML =
        `<svg class="icon icon-xs cat-icon"><use href="${iconHref}"/></svg>` +
        `<span class="cat-label">${q.categoryName}</span>`;

    const qText = document.getElementById('question-text');
    qText.textContent = q.text;
    qText.classList.remove('q-enter');
    void qText.offsetHeight;
    qText.classList.add('q-enter');

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    shuffleMap.forEach((originalIndex, displayIdx) => {
        const option = q.options[originalIndex];
        const card = document.createElement('div');
        card.className = 'option-card opt-enter';
        card.style.animationDelay = `${displayIdx * 0.04}s`;

        const indicator = document.createElement('div');
        indicator.className = 'opt-indicator';
        indicator.innerHTML = '<svg class="icon icon-xs" viewBox="0 0 48 48"><polyline points="15,24 22,31 33,18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

        const label = document.createElement('span');
        label.textContent = option.text;

        card.appendChild(indicator);
        card.appendChild(label);
        card.addEventListener('click', () => selectOption(originalIndex, card));
        container.appendChild(card);
    });

    questionStartTime = Date.now();
}

function selectOption(originalIndex, card) {
    const allCards = card.parentElement.querySelectorAll('.option-card');
    allCards.forEach(c => c.style.pointerEvents = 'none');

    const q = questions[currentIndex];
    const timeMs = Date.now() - questionStartTime;

    card.classList.add('selected');

    answers.push({
        question_id: q.id,
        option_index: originalIndex,
        time_ms: timeMs,
    });
    timings.push(timeMs);

    if (answers.length % 4 === 0 && answers.length < questions.length) {
        runLiveAntiCheat();
    }

    setTimeout(() => {
        currentIndex++;
        if (currentIndex >= questions.length) {
            finishQuiz();
        } else if (currentIndex % 5 === 0) {
            showCategoryTransition();
        } else {
            renderQuestion();
        }
    }, 300);
}

// ========== Category Transition ==========

function showCategoryTransition() {
    const nextQ = questions[currentIndex];
    const catIndex = Math.floor(currentIndex / 5);
    const catId = nextQ.categoryId;
    const iconHref = CATEGORY_ICONS[catId] || '#ico-target';

    document.getElementById('transition-icon').innerHTML = `<use href="${iconHref}"/>`;
    document.getElementById('transition-title').textContent = nextQ.categoryName;
    document.getElementById('transition-desc').textContent = categories[catIndex].description;

    const dotsContainer = document.getElementById('transition-progress');
    dotsContainer.innerHTML = '';
    categories.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'transition-dot';
        if (i < catIndex) dot.classList.add('done');
        if (i === catIndex) dot.classList.add('current');
        dotsContainer.appendChild(dot);
    });

    showScreen('transition-screen');
    setTimeout(() => {
        showScreen('quiz-screen');
        renderQuestion();
    }, 1400);
}

// ========== Scoring ==========

function calculateResults() {
    const qMap = {};
    categories.forEach(cat => {
        cat.questions.forEach(q => { qMap[q.id] = q; });
    });

    const tagScores = {};
    answers.forEach(a => {
        const q = qMap[a.question_id];
        if (!q) return;
        const weight = q.weight || 1.0;
        const tags = q.options[a.option_index]?.tags || [];
        tags.forEach(tag => {
            tagScores[tag] = (tagScores[tag] || 0) + weight;
        });
    });

    lastTagScores = tagScores;

    const scored = professions.map(p => {
        const score = (p.tags || []).reduce((sum, tag) => sum + (tagScores[tag] || 0), 0);
        return { profession: p, score };
    });
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 5);
    const maxScore = top[0]?.score || 1;
    top.forEach(m => {
        m.matchPct = Math.round((m.score / maxScore) * 100);
    });

    return top;
}

function detectPersonalityType(tagScores) {
    let best = null;
    let bestScore = -1;

    PERSONALITY_TYPES.forEach(pt => {
        const score = pt.tags.reduce((sum, tag) => sum + (tagScores[tag] || 0), 0);
        if (score > bestScore) {
            bestScore = score;
            best = pt;
        }
    });

    return best || PERSONALITY_TYPES[0];
}

function calculateConfidence(answerList, timingList) {
    let confidence = 100;

    // 1. Straight-line: longest run of same option_index
    const indices = answerList.map(a => a.option_index);
    let maxRun = 1, run = 1;
    for (let i = 1; i < indices.length; i++) {
        if (indices[i] === indices[i - 1]) { run++; maxRun = Math.max(maxRun, run); }
        else run = 1;
    }
    if (maxRun >= 4) confidence -= (maxRun - 3) * 15;

    // 2. Speed: answers faster than 2s
    const fastCount = timingList.filter(t => t < 2000).length;
    confidence -= fastCount * 5;

    // 3. Pattern cycling
    for (let period = 2; period <= 5; period++) {
        if (indices.length < period * 2) continue;
        const pattern = indices.slice(0, period);
        let matches = 0;
        for (let i = period; i < indices.length; i++) {
            if (indices[i] === pattern[i % period]) matches++;
        }
        if (matches / (indices.length - period) >= 0.8) {
            confidence -= 25;
            break;
        }
    }

    // 4. Low variance in option choices
    const unique = new Set(indices).size;
    if (unique <= 2 && indices.length >= 10) confidence -= 20;

    return Math.max(0, Math.min(100, confidence));
}

function computeDomainScores(tagScores) {
    // 6 domains matching our categories
    const domains = [
        { label: 'Технология', tags: ['IT', 'технология', 'логика', 'цифрлық'] },
        { label: 'Ғылым', tags: ['ғылым', 'зерттеу', 'математика', 'деректер'] },
        { label: 'Шығармашылық', tags: ['шығармашылық', 'дизайн', 'өнер'] },
        { label: 'Коммуникация', tags: ['коммуникация', 'әлеуметтік', 'педагогика', 'психология'] },
        { label: 'Бизнес', tags: ['бизнес', 'экономика', 'басқару', 'көшбасшылық'] },
        { label: 'Практика', tags: ['инженерия', 'медицина', 'денсаулық', 'құрылыс'] },
    ];

    const scores = domains.map(d => {
        const raw = d.tags.reduce((s, t) => s + (tagScores[t] || 0), 0);
        return { label: d.label, raw };
    });

    const maxRaw = Math.max(...scores.map(s => s.raw), 1);
    scores.forEach(s => { s.pct = Math.round((s.raw / maxRaw) * 100); });

    return scores;
}

// ========== Completion → Results ==========

function finishQuiz() {
    stopTimer();
    document.getElementById('progress-fill').style.width = '100%';

    matchedResults = calculateResults();
    lastConfidence = calculateConfidence(answers, timings);

    // Save to history (with timings for confidence)
    saveToHistory(matchedResults, timings);

    // Show profile button on welcome
    document.getElementById('btn-profile').hidden = false;

    showResultsScreen();
}

function showResultsScreen() {
    const list = document.getElementById('results-list');
    list.innerHTML = '';

    const rankClasses = ['gold', 'silver', 'bronze', 'other', 'other'];

    matchedResults.forEach((m, i) => {
        const p = m.profession;
        const card = document.createElement('div');
        card.className = 'prof-card';
        card.style.setProperty('--delay', `${i * 0.08}s`);
        card.addEventListener('click', () => openProfessionModal(m, i));

        const fieldIco = getFieldIcon(p.field);
        card.innerHTML = `
            <div class="prof-rank ${rankClasses[i]}">${i + 1}</div>
            <div class="prof-icon-wrap">${svgIcon(fieldIco, 'icon-md')}</div>
            <div class="prof-info">
                <div class="prof-name">${p.name}</div>
                <div class="prof-field">${p.field || ''}</div>
            </div>
            <span class="prof-match">${m.matchPct}%</span>
            ${svgIcon('#ico-chevron-right', 'icon-xs prof-chevron')}
        `;
        list.appendChild(card);
    });

    showScreen('results-screen');
}

// ========== History → Results Replay ==========

let viewingHistory = false;

function showHistoryResults(historyEntry) {
    // Reconstruct matchedResults from saved top5 + professions data
    const restored = (historyEntry.top5 || []).map(item => {
        const prof = professions.find(p => p.id === item.profId);
        if (!prof) return null;
        return { profession: prof, score: item.score, matchPct: item.matchPct };
    }).filter(Boolean);

    if (restored.length === 0) return;

    matchedResults = restored;
    viewingHistory = true;

    // Update results header with date
    document.querySelector('.results-title').textContent = 'Тест нәтижесі';
    document.querySelector('.results-subtitle').textContent = historyEntry.date;

    showResultsScreen();

    // Swap footer: hide "send" button, show "back to profile"
    const sendBtn = document.getElementById('btn-send-results');
    sendBtn.hidden = true;
    const backBtn = document.getElementById('btn-results-profile');
    backBtn.hidden = false;
}

function returnFromHistoryResults() {
    viewingHistory = false;
    document.querySelector('.results-title').textContent = 'Сенің нәтижең';
    document.querySelector('.results-subtitle').textContent = 'ТОП-5 мамандық ұсынысы';
    document.getElementById('btn-send-results').hidden = false;
    showProfile();
}

// ========== Profession Detail Modal ==========

function openProfessionModal(matched) {
    const p = matched.profession;
    const profUnis = (uniMap[p.id] || [])
        .map(uid => universities.find(u => u.id === uid))
        .filter(Boolean);

    document.getElementById('modal-emoji').innerHTML = svgIcon(getFieldIcon(p.field), 'icon-lg');
    document.getElementById('modal-name').textContent = p.name;
    document.getElementById('modal-field').textContent = p.field || '';
    document.getElementById('modal-desc').textContent = p.description || '';
    document.getElementById('modal-salary').textContent = p.salary_range || '—';
    document.getElementById('modal-demand').textContent = p.demand || '—';
    document.getElementById('modal-match-pct').textContent = matched.matchPct + '%';

    const fill = document.getElementById('modal-match-fill');
    fill.style.width = '0%';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { fill.style.width = matched.matchPct + '%'; });
    });

    const subjectsEl = document.getElementById('modal-subjects');
    subjectsEl.innerHTML = '';
    (p.ent_subjects || []).forEach(s => {
        const tag = document.createElement('span');
        tag.className = 'modal-tag';
        tag.textContent = s;
        subjectsEl.appendChild(tag);
    });

    const uniList = document.getElementById('modal-universities');
    uniList.innerHTML = '';
    profUnis.slice(0, 5).forEach(u => {
        const el = document.createElement('div');
        el.className = 'modal-uni';
        el.innerHTML = `<span>${u.name}</span><span class="modal-uni-city">${u.city}</span>`;
        uniList.appendChild(el);
    });

    const modal = document.getElementById('profession-modal');
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open'));
}

function closeModal() {
    const modal = document.getElementById('profession-modal');
    modal.classList.remove('open');
    setTimeout(() => { modal.hidden = true; }, 350);
}

// ========== Profile ==========

function showProfile() {
    const user = tg.initDataUnsafe?.user;
    const history = getHistory();

    // User info
    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const firstName = user?.first_name || 'Оқушы';
    nameEl.textContent = firstName;

    if (user?.photo_url) {
        avatarEl.innerHTML = `<img src="${user.photo_url}" alt="">`;
    } else {
        avatarEl.textContent = firstName.charAt(0);
    }

    // Stats
    document.getElementById('profile-tests-count').textContent = history.length;

    // Personality type & radar (from latest test)
    const latest = history[0];
    const typeSection = document.getElementById('profile-type-section');
    const radarSection = document.getElementById('profile-radar-section');

    if (latest && latest.tagScores) {
        const pt = detectPersonalityType(latest.tagScores);
        document.getElementById('profile-type-icon').innerHTML = svgIcon(pt.svgIcon, 'icon-lg');
        document.getElementById('profile-type-name').textContent = pt.name;
        document.getElementById('profile-type-desc').textContent = pt.desc;
        typeSection.hidden = false;

        // Radar chart
        const domains = computeDomainScores(latest.tagScores);
        drawRadarChart(domains);
        radarSection.hidden = false;

        // Real confidence from history (average of all tests)
        const confs = history.filter(h => h.confidence != null).map(h => h.confidence);
        const avgConf = confs.length > 0 ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : 0;
        document.getElementById('profile-avg-confidence').textContent = avgConf + '%';
    } else {
        typeSection.hidden = true;
        radarSection.hidden = true;
        document.getElementById('profile-avg-confidence').textContent = '—';
    }

    // History list
    const listEl = document.getElementById('profile-history-list');
    listEl.innerHTML = '';

    if (history.length === 0) {
        listEl.innerHTML = '<p class="profile-empty">Әлі тест тапсырылмаған</p>';
    } else {
        history.forEach((h, i) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.style.cursor = 'pointer';

            // Clickable — open that test's results
            if (h.top5 && h.top5.length > 0) {
                card.addEventListener('click', () => showHistoryResults(h));
            }

            let trendHtml = '';
            if (i < history.length - 1) {
                const prev = history[i + 1];
                const diff = (h.topMatchPct || 0) - (prev.topMatchPct || 0);
                if (diff > 3) trendHtml = '<span class="history-badge up">↑</span>';
                else if (diff < -3) trendHtml = '<span class="history-badge down">↓</span>';
                else trendHtml = '<span class="history-badge same">→</span>';
            }

            const confPct = h.confidence != null ? h.confidence + '%' : '';
            const confClass = (h.confidence || 0) >= 60 ? 'up' : (h.confidence || 0) >= 30 ? 'same' : 'down';

            const histFieldIcon = getFieldIcon(h.topField || '');
            card.innerHTML = `
                <div class="history-icon-wrap">${svgIcon(histFieldIcon, 'icon-md')}</div>
                <div class="history-info">
                    <div class="history-prof">${h.topName || '—'}</div>
                    <div class="history-date">${h.date}${confPct ? ' · ' + confPct : ''}</div>
                </div>
                ${trendHtml}
                ${svgIcon('#ico-chevron-right', 'icon-xs prof-chevron')}
            `;
            listEl.appendChild(card);
        });
    }

    showScreen('profile-screen');
}

// ========== Radar Chart (SVG) ==========

function drawRadarChart(domains) {
    const svg = document.getElementById('radar-chart');
    const cx = 150, cy = 120, r = 90;
    const n = domains.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    let html = '';

    // Grid rings
    [0.25, 0.5, 0.75, 1].forEach(scale => {
        const pts = [];
        for (let i = 0; i < n; i++) {
            const a = startAngle + i * angleStep;
            pts.push(`${cx + Math.cos(a) * r * scale},${cy + Math.sin(a) * r * scale}`);
        }
        html += `<polygon points="${pts.join(' ')}" class="radar-grid"/>`;
    });

    // Axes
    for (let i = 0; i < n; i++) {
        const a = startAngle + i * angleStep;
        html += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * r}" y2="${cy + Math.sin(a) * r}" class="radar-axis"/>`;
    }

    // Data polygon
    const dataPts = [];
    domains.forEach((d, i) => {
        const a = startAngle + i * angleStep;
        const val = (d.pct / 100) * r;
        dataPts.push(`${cx + Math.cos(a) * val},${cy + Math.sin(a) * val}`);
    });
    html += `<polygon points="${dataPts.join(' ')}" class="radar-fill"/>`;

    // Dots & labels
    domains.forEach((d, i) => {
        const a = startAngle + i * angleStep;
        const val = (d.pct / 100) * r;
        const dx = cx + Math.cos(a) * val;
        const dy = cy + Math.sin(a) * val;
        html += `<circle cx="${dx}" cy="${dy}" r="4" class="radar-dot"/>`;

        const lx = cx + Math.cos(a) * (r + 22);
        const ly = cy + Math.sin(a) * (r + 22);
        html += `<text x="${lx}" y="${ly}" class="radar-label">${d.label}</text>`;
    });

    svg.innerHTML = html;
}

// ========== localStorage ==========

function getHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function saveToHistory(matched, timingList) {
    const history = getHistory();
    const top = matched[0];
    const now = new Date();
    const confidence = calculateConfidence(answers, timingList);

    // Save top5 profession IDs + scores for replay
    const top5 = matched.map(m => ({
        profId: m.profession.id,
        score: m.score,
        matchPct: m.matchPct,
    }));

    history.unshift({
        date: `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`,
        topName: top?.profession?.name || '—',
        topField: top?.profession?.field || '',
        topMatchPct: top?.matchPct || 0,
        confidence: confidence,
        tagScores: { ...lastTagScores },
        top5: top5,
    });

    // Keep max 10 entries
    if (history.length > 10) history.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// ========== Submit ==========

function submitResults() {
    const btn = event.currentTarget;
    btn.style.pointerEvents = 'none';
    btn.innerHTML = '<span>Жіберілуде...</span>';

    const payload = {
        answers: answers,
        timings: timings,
        total_time_ms: Date.now() - testStartTime,
        version: "2.0",
    };

    tg.sendData(JSON.stringify(payload));
}

// ========== Timer ==========

function startTimer() {
    const display = document.getElementById('timer-display');
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - testStartTime;
        const mins = Math.floor(elapsed / 60000);
        const secs = Math.floor((elapsed % 60000) / 1000);
        display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ========== Anti-Cheat ==========

function runLiveAntiCheat() {
    const recent = answers.slice(-4);
    const recentTimings = timings.slice(-4);

    const indices = recent.map(a => a.option_index);
    if (new Set(indices).size === 1) {
        showToast('Бірдей жауаптар! Мұқият ойланып жауап беріңіз.');
        return;
    }

    const avgTime = recentTimings.reduce((a, b) => a + b, 0) / recentTimings.length;
    if (avgTime < 2000) {
        showToast('Тым жылдам! Сұрақтарды мұқият оқыңыз.');
        return;
    }

    if (indices.length === 4) {
        const isAlt = indices[0] === indices[2] && indices[1] === indices[3] && indices[0] !== indices[1];
        const isSeq = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
        if (isAlt || isSeq) {
            showToast('Паттерн байқалды! Жауаптарды ойланып таңдаңыз.');
        }
    }
}

// ========== Utilities ==========

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML =
        `<svg class="icon icon-sm" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="2" fill="none"/><line x1="16" y1="10" x2="16" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="23" r="1.5" fill="currentColor"/></svg>` +
        `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== Start ==========

init();
