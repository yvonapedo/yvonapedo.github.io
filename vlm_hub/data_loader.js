// Shared data loading utilities for static GitHub Pages deployment
// Replaces server.py API calls with direct CSV fetching + localStorage persistence

const VLM_FIELD_MAP = {
    'Venue': 'venue', 'Year': 'year', 'Month': 'month', 'Day': 'day',
    'Title': 'title',
    'before_encoder': 'before_encoder', 'Encoder': 'encoder',
    'after_encoder': 'after_encoder', 'text_encoder': 'text_encoder',
    'Projector': 'projector', 'after_projector': 'after_projector',
    'Decoder': 'decoder', 'Size Params': 'size_params',
    'FLOPs': 'flops', 'No citations': 'citations', 'Quality': 'quality',
    'Code': 'code', 'CKPT': 'ckpt', 'edit': 'edit', 'Notes': 'notes',
    'MMMU': 'mmmu', 'MathVista': 'mathvista', 'VQAv2': 'vqav2', 'GQA': 'gqa',
    'VizWiz': 'vizwiz', 'SQA': 'sqa', 'TextVQA': 'textvqa', 'POPE': 'pope',
    'MME': 'mme', 'MM-Bench': 'mmbench', 'MM-Bench-CN': 'mmbench_cn',
    'SEED-IMG': 'seed_img', 'LLaVA-Bench-Wild': 'llavabench_wild', 'MM-Vet': 'mmvet'
};

const PRUNE_FIELDS = [
    'Pruning_Method', 'Venue', 'Year', 'Pruning_Location', 'Pruned_Target', 'VLM',
    'edit', 'Token_Retention', 'GQA', 'MMB', 'MM-CN', 'MME', 'POPE', 'SQA', 'VQA_v2',
    'VQA_Text', 'VizWiz', 'FLOPs', 'Inference (ms)', 'GitHub'
];

function _parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function _parseCSVText(text) {
    text = text.replace(/^\uFEFF/, '');
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = _parseCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = _parseCSVLine(lines[i]);
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = (values[idx] || '').trim();
        });
        rows.push(obj);
    }
    return { headers, rows };
}

function _mapVlmRow(row) {
    const item = {};
    for (const [csvCol, jsKey] of Object.entries(VLM_FIELD_MAP)) {
        let val = (row[csvCol] || '').trim();
        if (jsKey === 'year') {
            try { val = parseInt(val) || 2024; } catch (e) { val = 2024; }
        } else if (jsKey === 'day') {
            try { val = val ? parseInt(val) : null; } catch (e) { val = null; }
        }
        item[jsKey] = val;
    }
    return item;
}

function _mapPruneRow(row) {
    const item = {};
    for (const field of PRUNE_FIELDS) {
        let val = (row[field] || '').trim();
        if (field === 'Year') {
            try { val = parseInt(val) || 2024; } catch (e) { val = 2024; }
        }
        item[field] = val;
    }
    return item;
}

// Load VLM data: localStorage first (for user edits), then CSV file, then embedded
async function loadVlmData() {
    const stored = localStorage.getItem('vlmTimeline');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (data.length > 0) return data;
        } catch (e) { /* ignore */ }
    }
    try {
        const resp = await fetch('sample_data.csv');
        if (!resp.ok) throw new Error('Failed to fetch CSV');
        const text = await resp.text();
        const { rows } = _parseCSVText(text);
        return rows.map(_mapVlmRow);
    } catch (e) {
        console.warn('Fetch failed, using embedded VLM data:', e);
    }
    if (typeof EMBEDDED_VLM_CSV !== 'undefined') {
        const { rows } = _parseCSVText(EMBEDDED_VLM_CSV);
        return rows.map(_mapVlmRow);
    }
    return [];
}

// Load Pruning data: localStorage first (for user edits), then CSV file, then embedded
async function loadPruneData() {
    const stored = localStorage.getItem('pruningTimeline');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (data.length > 0) return data;
        } catch (e) { /* ignore */ }
    }
    try {
        const resp = await fetch('pruning_data.csv');
        if (!resp.ok) throw new Error('Failed to fetch CSV');
        const text = await resp.text();
        const { rows } = _parseCSVText(text);
        return rows.map(_mapPruneRow);
    } catch (e) {
        console.warn('Fetch failed, using embedded pruning data:', e);
    }
    if (typeof EMBEDDED_PRUNE_CSV !== 'undefined') {
        const { rows } = _parseCSVText(EMBEDDED_PRUNE_CSV);
        return rows.map(_mapPruneRow);
    }
    return [];
}

function saveVlmData(data) {
    localStorage.setItem('vlmTimeline', JSON.stringify(data));
}

function savePruneData(data) {
    localStorage.setItem('pruningTimeline', JSON.stringify(data));
}
