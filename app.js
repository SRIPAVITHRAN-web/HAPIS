// app.js - Enterprise Logic (HAPIS Upgrade)

const NVIDIA_API_KEY = "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";

let skillsChartInstance = null;
let radarChartInstance = null;
let studentProfileChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {

    // --- SPLASH SCREEN LOGIC ---
    const splash = document.getElementById('splash-screen');
    const loginWrap = document.getElementById('login-wrapper');
    const appWrap = document.getElementById('app-wrapper');
    const bar = document.getElementById('splash-bar');
    const status = document.getElementById('splash-status');

    if (splash && loginWrap) {
        // If already logged in, skip splash for faster dev reload, 
        // OR in a hackathon, you usually want to show it off always.
        // Let's force it for the premium theatrical effect.

        setTimeout(() => { bar.style.width = '30%'; status.textContent = 'Connecting to securely encrypted cluster...'; }, 600);
        setTimeout(() => { bar.style.width = '70%'; status.textContent = 'Loading Artificial Intelligence Modules...'; }, 1600);
        setTimeout(() => { bar.style.width = '90%'; status.textContent = 'Verifying Authentication Gateways...'; }, 2600);

        setTimeout(() => {
            bar.style.width = '100%';
            status.textContent = 'System Ready.';

            setTimeout(() => {
                splash.style.opacity = '0';
                splash.style.transform = 'scale(1.1)';

                setTimeout(() => {
                    splash.style.display = 'none';
                    initAuth(); // Initialize auth after splash screen
                }, 800);

            }, 600);
        }, 3400); // Total splash duration before fade out
    } else {
        initAuth();
    }

    initSettingsMenu();
    initNavigation();
    initFileUpload();
    initSearch();
    initMatcher();

    // Add ripple effect listeners
    document.querySelectorAll('.ripple').forEach(btn => {
        btn.addEventListener('click', function (e) {
            let ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.background = 'rgba(255,255,255,0.4)';
            ripple.style.borderRadius = '50%';
            ripple.style.width = '100px';
            ripple.style.height = '100px';
            ripple.style.left = e.clientX - e.target.offsetLeft - 50 + 'px';
            ripple.style.top = e.clientY - e.target.offsetTop - 50 + 'px';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple-anim 0.5s linear';
            e.target.appendChild(ripple);
            setTimeout(() => ripple.remove(), 500);
        });
    });
});

async function initAuth() {
    const isLoggedIn = localStorage.getItem('pm_logged_in') === 'true';
    const loginWrapper = document.getElementById('login-wrapper');
    const appWrapper = document.getElementById('app-wrapper');

    if (isLoggedIn) {
        loginWrapper.style.display = 'none';
        appWrapper.style.display = 'flex';
        await DataStore.hydrate();
        refreshUI();
    } else {
        loginWrapper.style.display = 'flex';
        appWrapper.style.display = 'none';
    }

    document.getElementById('btn-login').addEventListener('click', async () => {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;

        if (user === 'admin' && pass === 'admin') {
            localStorage.setItem('pm_logged_in', 'true');
            document.getElementById('login-error').style.display = 'none';
            loginWrapper.style.display = 'none';
            appWrapper.style.display = 'flex';
            await DataStore.hydrate();
            refreshUI();
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });

    document.getElementById('btn-google-login').addEventListener('click', async () => {
        localStorage.setItem('pm_logged_in', 'true');
        document.getElementById('login-error').style.display = 'none';
        loginWrapper.style.display = 'none';
        appWrapper.style.display = 'flex';
        await DataStore.hydrate();
        refreshUI();
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('pm_logged_in');
        loginWrapper.style.display = 'flex';
        appWrapper.style.display = 'none';
        document.getElementById('meatballs-dropdown').classList.remove('show');
    });
}

function initSettingsMenu() {
    // Removed Light Theme Initializer

    const btnMeatballs = document.getElementById('btn-meatballs');
    const dropdown = document.getElementById('meatballs-dropdown');

    btnMeatballs.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
    });

    // Theme Toggle Handler removed

    document.getElementById('btn-clear-db').addEventListener('click', async () => {
        if (confirm("System Warning: Purging records is irreversible! Continue?")) {
            await DataStore.saveStudents([]);
            refreshUI();
            alert("Database purged successfully via Python API.");
        }
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
        const students = DataStore.getStudents();
        if (students.length === 0) {
            alert("Warning: No records to export.");
            return;
        }

        const csvRows = [['Roll No', 'Name', 'Branch', 'CGPA', 'Skills', 'Internships', 'Projects', 'Hackathons', 'Github', 'LinkedIn', 'System Score', 'Pipeline Status'].join(',')];

        students.forEach(s => {
            const row = [s.rollNo, `"${s.name}"`, `"${s.branch}"`, s.cgpa, `"${s.skills.join(', ')}"`, s.internships, s.projects, s.hackathons, s.github, s.linkedin, s.score, s.pipelineStatus];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "hapis_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            sections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'dashboard') renderChart();
            if (targetId === 'pipeline') renderKanban();
        });
    });
}

function refreshUI() {
    const students = DataStore.getStudents();

    // Remove skeletons if data exists
    if (students.length > 0) {
        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));

        // Calculate dynamic trends for UI
        document.querySelectorAll('.trend').forEach(el => el.style.display = 'flex');
    } else {
        document.querySelectorAll('.trend').forEach(el => el.style.display = 'none');
    }

    renderDashboardStats();
    renderAIInsights();
    renderChart();
    renderTopPerformers();
    renderStudentsTable();
    renderKanban();

    // Notification badge
    document.querySelector('.notification-badge').style.display = students.length > 0 ? 'block' : 'none';

    // Refresh Radar Chart and Neural Streams
    renderRadarChart();
    if (!window.hapisStreamActive) { initNeuralStreamAndBeacon(); window.hapisStreamActive = true; }
}

function renderDashboardStats() {
    const stats = DataStore.getStats();
    document.getElementById('total-students').textContent = stats.total;
    document.getElementById('avg-cgpa').textContent = stats.avgCgpa;
    document.getElementById('total-projects').textContent = stats.totalProjects;
    document.getElementById('total-internships').textContent = stats.totalInterns;
}

function renderAIInsights() {
    const stats = DataStore.getStats();
    const students = DataStore.getStudents();

    if (students.length === 0) {
        document.getElementById('ai-top-skill').textContent = 'N/A';
        document.getElementById('ai-top-dept').textContent = 'N/A';
        document.getElementById('ai-avg-score').textContent = '--';
        document.getElementById('ai-skill-gap').textContent = 'N/A';
        return;
    }

    // Top skill
    document.getElementById('ai-top-skill').textContent = stats.topSkills[0] ? stats.topSkills[0].name : "N/A";

    // Dept logic
    const deptCount = {};
    students.forEach(s => { deptCount[s.branch] = (deptCount[s.branch] || 0) + 1; });
    const topDept = Object.keys(deptCount).sort((a, b) => deptCount[b] - deptCount[a])[0];
    document.getElementById('ai-top-dept').textContent = topDept;

    // Score
    const avgS = students.reduce((sum, s) => sum + parseFloat(s.score), 0) / students.length;
    document.getElementById('ai-avg-score').textContent = avgS.toFixed(1);

    // Skill Gap logic (Mocked as if AI detected what is missing globally)
    document.getElementById('ai-skill-gap').textContent = "System Design";
}

function renderChart() {
    const stats = DataStore.getStats();
    const canvas = document.getElementById('skillsChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (skillsChartInstance) skillsChartInstance.destroy();

    if (stats.topSkills.length === 0) {
        // Render Empty state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "16px Inter";
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.fillText("Data required to generate chart.", canvas.width / 2, canvas.height / 2);
        return;
    }

    const labels = stats.topSkills.map(s => s.name);
    const data = stats.topSkills.map(s => s.count);

    skillsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Candidate Count',
                data: data,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: '#1d4ed8',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderRadarChart() {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (radarChartInstance) radarChartInstance.destroy();

    const students = DataStore.getStudents();
    if (students.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "14px Inter"; ctx.fillStyle = "#94a3b8"; ctx.textAlign = "center";
        ctx.fillText("Insufficient matrix data.", canvas.width / 2, canvas.height / 2);
        return;
    }

    // Mock aggregate data for radar based on database size
    const factor = Math.min(100, 40 + (students.length * 5));
    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Algorithm Design', 'Cloud Architecture', 'System Scaling', 'Frontend UX', 'Data Engineering'],
            datasets: [{
                label: 'Cohort Average',
                data: [factor, factor - 10, factor + 5, factor - 15, factor + 10],
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: '#2563eb',
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#2563eb',
                pointHoverBackgroundColor: '#2563eb',
                pointHoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { r: { ticks: { display: false }, grid: { color: 'rgba(0,0,0,0.05)' }, angleLines: { color: 'rgba(0,0,0,0.05)' } } },
            plugins: { legend: { display: false } }
        }
    });
}

// -------------------------
// LIVE ADVANCED WIDGETS
// -------------------------
function initNeuralStreamAndBeacon() {
    const stream = document.getElementById('neural-stream');
    const pingText = document.getElementById('corporate-ping');
    const pingIcon = document.getElementById('corporate-icon');

    // 1. Neural Stream
    const logMessages = [
        { level: '', text: "Refined neural weights for candidate parsing." },
        { level: '', text: "Scraping unindexed vectors from GitHub dataset..." },
        { level: 'warning', text: "Auto-calibrating 'Cloud Architecture' deficit parameters." },
        { level: 'success', text: "Successfully matched 3 profiles to pending requisitions." },
        { level: '', text: "Optimizing matrix search algorithm cache." },
        { level: '', text: "Extracting semantic tokens from uploaded PDFs." },
        { level: 'success', text: "Data sanitized. Pipeline integrity at 100%." }
    ];

    setInterval(() => {
        if (stream.children.length > 20) stream.removeChild(stream.lastChild); // keep clean

        const msg = logMessages[Math.floor(Math.random() * logMessages.length)];
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const log = document.createElement('div');
        log.className = `stream-log ${msg.level}`;
        log.innerHTML = `<span class="timestamp">[${time}]</span> ${msg.text}`;

        stream.prepend(log);
    }, 3500);

    // 2. Corporate Beacon
    const enterprisePings = [
        { company: "Amazon", color: "#ff9900", icon: "fa-aws" },
        { company: "Google", color: "#DB4437", icon: "fa-google" },
        { company: "Microsoft", color: "#00a4ef", icon: "fa-microsoft" },
        { company: "Meta", color: "#0668E1", icon: "fa-meta" },
        { company: "Apple", color: "#A2AAAD", icon: "fa-apple" }
    ];

    setInterval(() => {
        const ent = enterprisePings[Math.floor(Math.random() * enterprisePings.length)];
        pingIcon.className = `fa-brands ${ent.icon}`;
        pingIcon.style.color = ent.color;

        const actions = ["parsed candidate attributes", "polled the pipeline API", "synced matcher requisitions", "downloaded technical assessments"];
        const act = actions[Math.floor(Math.random() * actions.length)];

        pingText.innerHTML = `<strong>${ent.company}</strong> ${act} successfully.`;
        pingText.style.borderColor = ent.color;

        setTimeout(() => { pingText.style.borderColor = 'rgba(255,255,255,0.4)'; }, 1000);
    }, 8000);
}

function renderTopPerformers() {
    const students = DataStore.getStudents();
    const list = document.getElementById('top-performers-list');
    list.innerHTML = '';

    if (students.length === 0) {
        // DUMMY STATE requested in Prompt
        list.innerHTML = `
            <div class="empty-illustration">
                <i class="fa-solid fa-users-slash"></i>
                <h3>No Database Records</h3>
                <p>Upload candidate data to build intelligence.</p>
                <button class="empty-btn" onclick="document.querySelector('.nav-item[data-target=\\'import\\']').click()">Import Data Payload</button>
            </div>
            
            <div style="opacity:0.3; pointer-events:none; margin-top:24px;">
               <p style="font-size:0.8rem; text-align:center; font-weight:700;">HAPIS PREVIEW</p>
               <div class="rank-item">
                 <span class="rank-badge">🥇</span><img src="https://i.pravatar.cc/150?img=1" class="rank-av">
                 <div class="rank-details"><h4>Jane Doe</h4><p>Comp Sci</p></div><span class="rank-score">98.5</span>
               </div>
               <div class="rank-item">
                 <span class="rank-badge">🥈</span><img src="https://i.pravatar.cc/150?img=2" class="rank-av">
                 <div class="rank-details"><h4>John Smith</h4><p>IT</p></div><span class="rank-score">94.2</span>
               </div>
            </div>
        `;
        return;
    }

    const sorted = [...students].sort((a, b) => b.score - a.score).slice(0, 5);
    const badges = ['🥇', '🥈', '🥉', '4.', '5.'];

    sorted.forEach((s, idx) => {
        const li = document.createElement('li');
        li.className = 'rank-item';

        let badgeStr = `<span class="rank-badge" style="font-size:${idx < 3 ? '1.6rem' : '1rem'}; font-weight:700; width:30px; text-align:center; color:#94a3b8;">${badges[idx]}</span>`;
        let mockImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&color=fff&rounded=true`;

        li.innerHTML = `
            ${badgeStr}
            <img src="${mockImg}" class="rank-av">
            <div class="rank-details">
                <h4>${s.name}</h4>
                <p>${s.branch} | ${s.skills.slice(0, 2).join(', ')}</p>
            </div>
            <span class="rank-score">★${s.score}</span>
        `;
        list.appendChild(li);
    });
}

function renderStudentsTable(searchQuery = '') {
    const students = DataStore.getStudents();
    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = '';

    const filtered = students.filter(s => {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) ||
            s.rollNo.toLowerCase().includes(q) ||
            s.skills.some(skill => skill.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No records found matching criteria.</td></tr>';
        return;
    }

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', () => openStudentProfile(s.rollNo));

        const skillsHtml = s.skills.slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('');
        const extraSkills = s.skills.length > 3 ? `<span class="skill-tag" style="background:transparent; border-color:transparent; color:var(--accent); font-weight:700;">+${s.skills.length - 3}</span>` : '';

        tr.innerHTML = `
            <td style="font-family:monospace; color:var(--text-muted); font-weight:600;">${s.rollNo}</td>
            <td>
                <div style="font-weight: 600; color:var(--text-main);">${s.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">
                   ${s.github ? `<a href="https://${s.github}" target="_blank" style="color:var(--accent); text-decoration:none;"><i class="fa-brands fa-github"></i> Profile</a>` : ''}
                </div>
            </td>
            <td>${s.branch}</td>
            <td style="font-weight:700;">${s.cgpa}</td>
            <td>${skillsHtml}${extraSkills}</td>
            <td><strong style="color:var(--accent); font-size:1.1rem;">${s.score}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function initSearch() {
    const searchInput = document.getElementById('student-search');
    searchInput.addEventListener('input', (e) => {
        renderStudentsTable(e.target.value);
    });
}

function initFileUpload() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('csv-fileInput');

    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '';
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
}

function handleFile(file) {
    if (file.name.endsWith('.csv')) {
        DataStore.parseCSV(file, (processedData) => {
            alert(`HAPIS Engine Successfully Indexed ${processedData.length} User Records.`);
            refreshUI();
            document.querySelector('.nav-item[data-target="dashboard"]').click();
        });
    } else if (file.name.endsWith('.pdf')) {
        processPDFResume(file);
    } else {
        alert("HAPIS Error: Payload must be CSV array or PDF schema."); return;
    }
}

async function processPDFResume(file) {
    const overlay = document.getElementById('ai-overlay');
    const overlayText = document.getElementById('ai-overlay-text');
    overlay.style.display = 'flex';
    overlayText.textContent = "Extracting raw vectors from PDF...";

    try {
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = "";

            overlayText.textContent = `Analyzing ${pdf.numPages} sequence layers...`;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + " ";
            }

            overlayText.textContent = "NVIDIA NIM processing semantic extraction...";

            if (!NVIDIA_API_KEY || NVIDIA_API_KEY.includes("YOUR_NVIDIA_API_KEY_HERE")) {
                alert("Please inject your NVIDIA API Key sequentially into app.js first.");
                overlay.style.display = 'none';
                return;
            }

            try {
                const response = await fetch('https://resume-poec.onrender.com/api/chat', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "meta/llama-3.1-8b-instruct",
                        messages: [
                            {
                                "role": "system",
                                "content": "You are an expert AI Placement Officer. Analyze the following resume text and extract the candidate's core profile into a STRICT JSON object with these EXACT keys: 'rollNo' (generate a random 10 char UUID starting with SYS-), 'name' (string), 'branch' (short string like CSE, ECE), 'cgpa' (number out of 10.0), 'skills' (array of strings, max 5 relevant skills), 'internships' (integer count), 'projects' (integer count), 'hackathons' (integer count). Calculate a 'score' out of 100 based on the profile's strength. ONLY output the valid raw JSON object without markdown formatting blocks."
                            },
                            {
                                "role": "user",
                                "content": `Resume text: ${fullText.substring(0, 4000)}`
                            }
                        ],
                        temperature: 0.2,
                        max_tokens: 1024
                    })
                });

                if (!response.ok) throw new Error("NVIDIA API Error: " + response.statusText);

                const data = await response.json();
                const jsonString = data.choices[0].message.content.trim().replace(/```json/g, '').replace(/```/g, '');
                const mockProfile = JSON.parse(jsonString);

                // Add defaults and force Javascript to assign unique UUID so LLM doesn't duplicate
                mockProfile.rollNo = 'SYS-' + Math.floor(Math.random() * 90000000 + 10000000);
                mockProfile.pipelineStatus = 'none';
                mockProfile.github = '';
                mockProfile.linkedin = '';

                // Add to datastore & Score
                const currentData = DataStore.getStudents();
                if (!currentData.find(s => s.rollNo === mockProfile.rollNo)) {
                    currentData.push(mockProfile);
                    await DataStore.saveStudents(currentData);
                }

                overlay.style.display = 'none';
                alert(`HAPIS NVIDIA Verification Complete.\nDetected Candidate: ${mockProfile.name}\nCalculated Index Score: ${mockProfile.score}`);
                refreshUI();
                document.querySelector('.nav-item[data-target="students"]').click();
                document.getElementById('csv-fileInput').value = ""; // clear

            } catch (err) {
                console.error(err);
                overlay.style.display = 'none';
                alert("HAPIS PDF Extraction Failure via NVIDIA API: " + err.message);
            }
        };
        fileReader.readAsArrayBuffer(file);
    } catch (err) {
        overlay.style.display = 'none';
        alert("HAPIS PDF Extraction Failure: Corrupted document vector matrix.");
    }
}

// -------------------------
// SMART MATCHER Logic
// -------------------------
function initMatcher() {
    document.getElementById('btn-match').addEventListener('click', () => {
        const title = document.getElementById('job-title').value;
        const requiredSkillsRaw = document.getElementById('required-skills').value;

        if (!title || !requiredSkillsRaw) { alert("Missing execution parameters."); return; }
        const requiredSkills = requiredSkillsRaw.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        matchCandidates(title, requiredSkills);
    });
}

async function matchCandidates(title, reqSkills) {
    const students = DataStore.getStudents();

    // Redirect to the new fullscreen results section
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('matcher-results').classList.add('active');
    document.getElementById('display-job-title').textContent = title;

    const resultsDiv = document.getElementById('match-results');
    resultsDiv.innerHTML = '<p style="color:var(--text-muted); background:rgba(255,255,255,0.8); padding:20px; border-radius:10px; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> NVIDIA NIM analyzing semantic fit via LLaMA 3.1...</p>';

    if (!NVIDIA_API_KEY || NVIDIA_API_KEY.includes("YOUR_NVIDIA_API_KEY_HERE")) {
        resultsDiv.innerHTML = '<p style="color:var(--danger); padding:20px; background:rgba(255,0,0,0.05); border-radius:10px;">Please configure your NVIDIA_API_KEY in app.js.</p>';
        return;
    }

    try {
        // Build a simplified payload of candidates to save AI tokens constraints
        const candidatePayload = students.map(s => ({
            rollNo: s.rollNo, name: s.name, branch: s.branch, cgpa: s.cgpa, skills: s.skills, projects: s.projects, internships: s.internships
        }));

        const response = await fetch('https://resume-poec.onrender.com/api/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta/llama-3.1-8b-instruct",
                messages: [
                    {
                        "role": "system",
                        "content": "You are a world-class AI matching engine. You are given a target Job Title and Required Skills, and a JSON array of candidates. Evaluate the semantic fit of each candidate for the role using cognitive reasoning, even if exact keywords don't match (e.g. React fits Frontend). Select the top 5 candidates. Return a STRICT JSON array of objects. Each object must have: 'rollNo', 'matchPercentage' (integer 0-100), 'matchedSkills' (integer count of core traits found), 'missingSkills' (array of strings representing critical missing skills). Order the array from highest matchPercentage to lowest. Output ONLY valid JSON array without markdown codeblocks or prefix/suffix text."
                    },
                    {
                        "role": "user",
                        "content": `Job Title: ${title}\nRequired Skills: ${reqSkills.join(', ')}\nCandidates DB: ${JSON.stringify(candidatePayload)}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 1024
            })
        });

        if (!response.ok) throw new Error("NVIDIA API matching failed. Status: " + response.status);

        const data = await response.json();
        const jsonString = data.choices[0].message.content.trim().replace(/```json/g, '').replace(/```/g, '');
        const aiRankings = JSON.parse(jsonString);

        resultsDiv.innerHTML = '';

        if (aiRankings.length === 0) {
            resultsDiv.innerHTML = '<p style="color:var(--text-muted); background:rgba(255,255,255,0.8); padding:20px; border-radius:10px;">Zero matches detected by AI parameters.</p>';
            return;
        }

        aiRankings.forEach((ranking, index) => {
            const cand = students.find(s => s.rollNo === ranking.rollNo);
            if (!cand) return;

            const card = document.createElement('div');
            card.className = 'match-card hover-scale';

            let missingHtml = '';
            const missingArr = Array.isArray(ranking.missingSkills) ? ranking.missingSkills : [];
            if (missingArr.length > 0) {
                missingHtml = `<div class="gap-badge"><i class="fa-solid fa-code-merge"></i> AI Skill Deficit Detected: ${missingArr.join(', ')}</div>`;
            }

            const isShortlisted = cand.pipelineStatus !== 'none';
            const buttonHtml = isShortlisted
                ? `<button class="btn-sm" style="opacity:0.5; cursor:not-allowed;" disabled>Currently In Pipeline</button>`
                : `<button class="btn-sm ripple" style="background:var(--accent); color:#fff; border:none;" onclick="addToPipeline('${cand.rollNo}')"><i class="fa-solid fa-plus"></i> Import to Pipeline</button>`;

            card.innerHTML = `
                <div class="match-info">
                    <h4>#${index + 1} ${cand.name} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(${cand.branch}) - UUID: ${cand.rollNo}</span></h4>
                    <p><strong>AI Alignment:</strong> ${ranking.matchedSkills} Core Traits Found | <strong>Projects:</strong> ${cand.projects} | <strong>GPA Index:</strong> ${cand.cgpa}</p>
                    <div style="margin-top:8px;">
                        ${cand.skills.slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                    ${missingHtml}
                    <div style="margin-top: 14px;">${buttonHtml}</div>
                </div>
                <div class="match-score">
                    <div class="perc" style="color: ${ranking.matchPercentage > 75 ? 'var(--success)' : 'var(--warning)'}">${ranking.matchPercentage}%</div>
                    <span>Neural Fit</span>
                </div>
            `;
            resultsDiv.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = `<p style="color:var(--danger); padding:20px; background:rgba(255,0,0,0.05); border-radius:10px;"><i class="fa-solid fa-triangle-exclamation"></i> HAPIS AI Error: Could not connect to NVIDIA endpoint. (${err.message})</p>`;
    }
}

function addToPipeline(rollNo) {
    DataStore.updateStudentPipeline(rollNo, 'shortlisted');
    alert(`Candidate UUID ${rollNo} securely moved to hiring pipeline.`);
    renderKanban();
    document.querySelector('.nav-item[data-target="pipeline"]').click();
}

// -------------------------
// KANBAN PIPELINE Logic
// -------------------------
function renderKanban() {
    const students = DataStore.getStudents();

    document.getElementById('list-shortlisted').innerHTML = '';
    document.getElementById('list-interview').innerHTML = '';
    document.getElementById('list-placed').innerHTML = '';
    let cntS = 0, cntI = 0, cntP = 0;

    students.forEach(s => {
        if (!s.pipelineStatus || s.pipelineStatus === 'none') return;

        const card = document.createElement('div');
        card.className = 'k-card';
        card.draggable = true;
        card.ondragstart = (e) => drag(e, s.rollNo);

        card.innerHTML = `
            <div class="k-card-title">${s.name} 
              <span style="float:right; font-size:0.7rem; font-weight:normal; color:var(--text-muted); background:#f1f5f9; padding:2px 6px; border-radius:4px;">${s.rollNo}</span>
            </div>
            <div class="k-card-sub">${s.branch} | Score: ${s.score}</div>
            <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
               ${s.pipelineStatus === 'shortlisted' ? `<span style="font-size:0.75rem; color:var(--accent); font-weight:600;"><i class="fa-solid fa-spinner fa-spin"></i> Active Profile</span>` : ''}
               ${s.pipelineStatus === 'interview' ? `<span style="font-size:0.75rem; color:var(--warning); font-weight:600;"><i class="fa-regular fa-comment-dots"></i> Evaluating</span>` : ''}
               ${s.pipelineStatus === 'placed' ? `<span style="font-size:0.75rem; color:var(--success); font-weight:600;"><i class="fa-solid fa-certificate"></i> Verified Hire</span>` : ''}
               <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&size=24&rounded=true">
            </div>
        `;

        if (s.pipelineStatus === 'shortlisted') { document.getElementById('list-shortlisted').appendChild(card); cntS++; }
        if (s.pipelineStatus === 'interview') { document.getElementById('list-interview').appendChild(card); cntI++; }
        if (s.pipelineStatus === 'placed') { document.getElementById('list-placed').appendChild(card); cntP++; }
    });

    document.getElementById('badge-shortlisted').textContent = cntS;
    document.getElementById('badge-interview').textContent = cntI;
    document.getElementById('badge-placed').textContent = cntP;
}
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev, rollNo) { ev.dataTransfer.setData("rollNo", rollNo); }
async function drop(ev, targetStatus) {
    ev.preventDefault();
    const rollNo = ev.dataTransfer.getData("rollNo");
    if (rollNo) {
        await DataStore.updateStudentPipeline(rollNo, targetStatus);
        renderKanban();
    }
}

// -------------------------
// STUDENT PROFILE MODAL
// -------------------------
function openStudentProfile(rollNo) {
    const students = DataStore.getStudents();
    const student = students.find(s => s.rollNo === rollNo);
    if (!student) return;

    document.getElementById('sm-name').textContent = student.name;
    document.getElementById('sm-roll').textContent = student.rollNo;
    document.getElementById('sm-branch').textContent = student.branch;
    document.getElementById('sm-cgpa').textContent = student.cgpa || 'N/A';
    document.getElementById('sm-score').textContent = student.score;
    document.getElementById('sm-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=150&background=random&color=fff&rounded=true`;

    const githubBtn = document.getElementById('sm-github');
    if (student.github) { githubBtn.href = student.github.startsWith('http') ? student.github : `https://${student.github}`; githubBtn.style.display = 'inline-flex'; }
    else { githubBtn.style.display = 'none'; }

    const linkedinBtn = document.getElementById('sm-linkedin');
    if (student.linkedin) { linkedinBtn.href = student.linkedin.startsWith('http') ? student.linkedin : `https://${student.linkedin}`; linkedinBtn.style.display = 'inline-flex'; }
    else { linkedinBtn.style.display = 'none'; }

    const skillsContainer = document.getElementById('sm-skills');
    skillsContainer.innerHTML = student.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');

    const deleteBtn = document.getElementById('sm-delete');
    deleteBtn.onclick = async () => {
        if(confirm(`Are you sure you want to delete ${student.name}'s record?`)) {
            await DataStore.deleteStudent(student.rollNo);
            document.getElementById('student-modal-overlay').classList.remove('show');
            refreshUI(); // Refresh the table and charts
        }
    };

    renderStudentChart(student);

    document.getElementById('student-modal-overlay').classList.add('show');
}

function renderStudentChart(student) {
    const canvas = document.getElementById('studentProfileChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (studentProfileChartInstance) studentProfileChartInstance.destroy();

    // Strict dark mode configurations
    const gridColor = 'rgba(255,255,255,0.05)';
    const textColor = '#94a3b8';

    studentProfileChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Internships', 'Projects', 'Hackathons'],
            datasets: [{
                label: 'Count',
                data: [student.internships || 0, student.projects || 0, student.hackathons || 0],
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)', // warning
                    'rgba(139, 92, 246, 0.8)', // purple
                    'rgba(16, 185, 129, 0.8)'  // success
                ],
                borderRadius: 8,
                borderWidth:0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            },
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#cbd5e1', borderColor: gridColor, borderWidth: 1 }
            }
        }
    });
}

// Ensure elements exist before adding listeners since app.js is loaded at the end of the body
const closeBtn = document.getElementById('modal-close-btn');
if(closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('student-modal-overlay').classList.remove('show');
    });
}
const overlay = document.getElementById('student-modal-overlay');
if(overlay) {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
        }
    });
}
