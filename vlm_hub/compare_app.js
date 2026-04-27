// Compare App - Radar chart comparison of VLMs and Pruning techniques
function createCompareApp() {
    const { createApp } = Vue;

    return createApp({
        template: `
            <div class="container">
                <h2 class="compare-title"><i class="fas fa-chart-bar"></i> Compare VLMs & Pruning Techniques</h2>
                <p class="compare-subtitle">Select up to 5 VLMs and 5 pruning configurations to compare on shared benchmarks using a radar chart.</p>

                <div v-if="loading" class="compare-loading">Loading data...</div>

                <div v-else class="compare-layout">
                    <!-- LEFT: Selection Panel -->
                    <div class="compare-select-panel">
                        <!-- VLM Selection -->
                        <div class="compare-group">
                            <h3><i class="fas fa-robot"></i> VLMs <span class="compare-count">({{ selectedVlms.length }}/5)</span></h3>
                            <div class="compare-search-wrap">
                                <input type="text" v-model="vlmSearch" class="compare-search" placeholder="Search VLMs...">
                            </div>
                            <div class="compare-chips" v-if="selectedVlms.length > 0">
                                <span class="compare-chip vlm-chip" v-for="(s, i) in selectedVlms" :key="'v'+i">
                                    {{ s.label }}
                                    <button class="compare-chip-remove" @click="removeVlm(i)">&times;</button>
                                </span>
                            </div>
                            <div class="compare-list">
                                <div v-for="item in filteredVlmList" :key="item.key"
                                     class="compare-list-item"
                                     :class="{ selected: isVlmSelected(item), disabled: selectedVlms.length >= 5 && !isVlmSelected(item) }"
                                     @click="toggleVlm(item)">
                                    <span class="compare-list-check">{{ isVlmSelected(item) ? '\u2713' : '' }}</span>
                                    <span>{{ item.label }}</span>
                                </div>
                                <div v-if="filteredVlmList.length === 0" class="compare-list-empty">No VLMs match your search</div>
                            </div>
                        </div>

                        <!-- Pruning Selection -->
                        <div class="compare-group">
                            <h3><i class="fas fa-scissors"></i> Pruning Combinations <span class="compare-count">({{ selectedPrune.length }}/5)</span></h3>
                            <!-- Filters -->
                            <div class="compare-filters">
                                <select v-model="pruneFilterMethod" class="compare-filter-select">
                                    <option value="">All Methods</option>
                                    <option v-for="m in uniquePruneMethods" :key="m" :value="m">{{ m }}</option>
                                </select>
                                <select v-model="pruneFilterVlm" class="compare-filter-select">
                                    <option value="">All VLMs</option>
                                    <option v-for="v in uniquePruneVlms" :key="v" :value="v">{{ v }}</option>
                                </select>
                                <select v-model="pruneFilterTokens" class="compare-filter-select">
                                    <option value="">All Tokens</option>
                                    <option v-for="t in uniquePruneTokens" :key="t" :value="t">{{ t }}</option>
                                </select>
                            </div>
                            <div class="compare-search-wrap">
                                <input type="text" v-model="pruneSearch" class="compare-search" placeholder="Search pruning methods...">
                            </div>
                            <div class="compare-chips" v-if="selectedPrune.length > 0">
                                <span class="compare-chip prune-chip" v-for="(s, i) in selectedPrune" :key="'p'+i">
                                    {{ s.label }}
                                    <button class="compare-chip-remove" @click="removePrune(i)">&times;</button>
                                </span>
                            </div>
                            <div class="compare-list">
                                <div v-for="item in filteredPruneList" :key="item.key"
                                     class="compare-list-item"
                                     :class="{ selected: isPruneSelected(item), disabled: selectedPrune.length >= 5 && !isPruneSelected(item) }"
                                     @click="togglePrune(item)">
                                    <span class="compare-list-check">{{ isPruneSelected(item) ? '✓' : '' }}</span>
                                    <span>{{ item.label }}</span>
                                </div>
                                <div v-if="filteredPruneList.length === 0" class="compare-list-empty">No pruning methods match your search</div>
                            </div>
                        </div>

                        <!-- Benchmark Selection -->
                        <div class="compare-group">
                            <h3><i class="fas fa-clipboard-list"></i> Benchmarks</h3>
                            <div class="compare-bench-toggles">
                                <label v-for="b in sharedBenchmarks" :key="b.key" class="compare-bench-toggle">
                                    <input type="checkbox" v-model="selectedBenchmarks" :value="b.key">
                                    {{ b.label }}
                                </label>
                            </div>
                            <button class="btn-small btn-secondary" @click="selectAllBenchmarks" style="margin-top:8px">Select All</button>
                        </div>
                    </div>

                    <!-- RIGHT: Radar Chart + Table -->
                    <div class="compare-chart-panel">
                        <div v-if="allSelected.length === 0" class="compare-empty-state">
                            <h3>No items selected</h3>
                            <p>Select VLMs and/or pruning configurations from the left panel to see the radar comparison.</p>
                        </div>

                        <div v-else>
                            <!-- Radar Chart -->
                            <div class="compare-radar-wrap">
                                <canvas ref="compareRadar" width="600" height="500"></canvas>
                            </div>

                            <!-- Comparison Table -->
                            <div class="compare-table-wrap">
                                <table class="compare-table">
                                    <thead>
                                        <tr>
                                            <th class="compare-th-sortable" :class="{ active: sortColumn === 'name' }" @click="sortBy('name')">
                                                Model / Method <span class="compare-sort-icon">{{ sortColumn === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲▼' }}</span>
                                            </th>
                                            <th class="compare-th-sortable" :class="{ active: sortColumn === 'type' }" @click="sortBy('type')">
                                                Type <span class="compare-sort-icon">{{ sortColumn === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲▼' }}</span>
                                            </th>
                                            <th v-for="b in activeBenchmarks" :key="b.key" class="compare-th-sortable" :class="{ active: sortColumn === b.key }" @click="sortBy(b.key)">
                                                {{ b.label }} <span class="compare-sort-icon">{{ sortColumn === b.key ? (sortDirection === 'asc' ? '▲' : '▼') : '▲▼' }}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, idx) in sortedSelected" :key="item.key"
                                            :style="{ borderLeft: '4px solid ' + chartColors[allSelected.indexOf(item) % chartColors.length] }">
                                            <td class="compare-table-name">{{ item.label }}</td>
                                            <td><span :class="'compare-type-badge ' + item.type">{{ item.type === 'vlm' ? 'VLM' : 'Pruning' }}</span></td>
                                            <td v-for="b in activeBenchmarks" :key="b.key"
                                                :class="isBestInColumn(item, b.key) ? 'compare-best' : ''">
                                                {{ getDisplayValue(item, b.key) }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                loading: true,
                vlmEvents: [],
                pruneEvents: [],
                selectedVlms: [],
                selectedPrune: [],
                vlmSearch: '',
                pruneSearch: '',
                pruneFilterMethod: '',
                pruneFilterVlm: '',
                pruneFilterTokens: '',
                selectedBenchmarks: ['gqa', 'vqav2', 'vizwiz', 'sqa', 'textvqa', 'pope', 'mme', 'mmbench', 'mmbench_cn'],
                sharedBenchmarks: [
                    { key: 'gqa', label: 'GQA', vlmKey: 'gqa', pruneKey: 'GQA' },
                    { key: 'vqav2', label: 'VQAv2', vlmKey: 'vqav2', pruneKey: 'VQA_v2' },
                    { key: 'vizwiz', label: 'VizWiz', vlmKey: 'vizwiz', pruneKey: 'VizWiz' },
                    { key: 'sqa', label: 'SQA', vlmKey: 'sqa', pruneKey: 'SQA' },
                    { key: 'textvqa', label: 'TextVQA', vlmKey: 'textvqa', pruneKey: 'VQA_Text' },
                    { key: 'pope', label: 'POPE', vlmKey: 'pope', pruneKey: 'POPE' },
                    { key: 'mme', label: 'MME', vlmKey: 'mme', pruneKey: 'MME' },
                    { key: 'mmbench', label: 'MM-Bench', vlmKey: 'mmbench', pruneKey: 'MMB' },
                    { key: 'mmbench_cn', label: 'MM-Bench-CN', vlmKey: 'mmbench_cn', pruneKey: 'MM-CN' }
                ],
                chartColors: [
                    '#667eea', '#f093fb', '#43e97b', '#fa709a', '#30cfd0',
                    '#ff9a56', '#764ba2', '#4facfe', '#a8edea', '#fed6e3'
                ],
                _chart: null,
                sortColumn: null,
                sortDirection: 'asc'
            };
        },
        computed: {
            vlmList() {
                return this.vlmEvents
                    .map((e, i) => {
                        const hasBench = this.sharedBenchmarks.some(b => {
                            const v = e[b.vlmKey];
                            return v && v !== '' && v !== '-' && v !== 'N/A';
                        });
                        if (!hasBench) return null;
                        return {
                            key: 'vlm_' + i,
                            type: 'vlm',
                            label: e.title + (e.size_params ? ' (' + e.size_params + ')' : ''),
                            data: e
                        };
                    })
                    .filter(Boolean);
            },
            pruneList() {
                return this.pruneEvents
                    .map((e, i) => {
                        const hasBench = this.sharedBenchmarks.some(b => {
                            const v = e[b.pruneKey];
                            return v && v !== '' && v !== '-' && v !== 'N/A' && v !== '0';
                        });
                        if (!hasBench) return null;
                        return {
                            key: 'prune_' + i,
                            type: 'prune',
                            label: e.Pruning_Method + ' / ' + e.VLM + ' (' + e.Token_Retention + ' tokens)',
                            data: e
                        };
                    })
                    .filter(Boolean);
            },
            filteredVlmList() {
                const q = this.vlmSearch.toLowerCase();
                return this.vlmList.filter(item => item.label.toLowerCase().includes(q));
            },
            filteredPruneList() {
                let list = this.pruneList;
                if (this.pruneFilterMethod) list = list.filter(x => x.data.Pruning_Method === this.pruneFilterMethod);
                if (this.pruneFilterVlm) list = list.filter(x => x.data.VLM === this.pruneFilterVlm);
                if (this.pruneFilterTokens) list = list.filter(x => String(x.data.Token_Retention) === this.pruneFilterTokens);
                const q = this.pruneSearch.toLowerCase();
                if (q) list = list.filter(item => item.label.toLowerCase().includes(q));
                return list;
            },
            uniquePruneMethods() {
                return [...new Set(this.pruneEvents.map(e => e.Pruning_Method))].sort();
            },
            uniquePruneVlms() {
                return [...new Set(this.pruneEvents.map(e => e.VLM))].sort();
            },
            uniquePruneTokens() {
                return [...new Set(this.pruneEvents.map(e => String(e.Token_Retention)))].sort((a, b) => Number(a) - Number(b));
            },
            allSelected() {
                return [...this.selectedVlms, ...this.selectedPrune];
            },
            activeBenchmarks() {
                return this.sharedBenchmarks.filter(b => this.selectedBenchmarks.includes(b.key));
            },
            sortedSelected() {
                if (!this.sortColumn) return this.allSelected;
                const col = this.sortColumn;
                const dir = this.sortDirection === 'asc' ? 1 : -1;
                return [...this.allSelected].sort((a, b) => {
                    if (col === 'name') {
                        return dir * a.label.localeCompare(b.label);
                    }
                    if (col === 'type') {
                        return dir * a.type.localeCompare(b.type);
                    }
                    const va = this.getValue(a, col);
                    const vb = this.getValue(b, col);
                    if (va === null && vb === null) return 0;
                    if (va === null) return 1;
                    if (vb === null) return -1;
                    return dir * (va - vb);
                });
            }
        },
        watch: {
            allSelected: {
                handler() { this.$nextTick(() => this.drawRadar()); },
                deep: true
            },
            selectedBenchmarks: {
                handler() { this.$nextTick(() => this.drawRadar()); },
                deep: true
            }
        },
        methods: {
            async loadData() {
                this.loading = true;
                try {
                    const [vlmData, pruneData] = await Promise.all([
                        loadVlmData(),
                        loadPruneData()
                    ]);
                    this.vlmEvents = vlmData;
                    this.pruneEvents = pruneData;
                } catch (e) {
                    console.warn('Failed to load data:', e);
                }
                this.loading = false;
            },
            isVlmSelected(item) {
                return this.selectedVlms.some(s => s.key === item.key);
            },
            isPruneSelected(item) {
                return this.selectedPrune.some(s => s.key === item.key);
            },
            toggleVlm(item) {
                const idx = this.selectedVlms.findIndex(s => s.key === item.key);
                if (idx >= 0) {
                    this.selectedVlms.splice(idx, 1);
                } else if (this.selectedVlms.length < 5) {
                    this.selectedVlms.push(item);
                }
            },
            togglePrune(item) {
                const idx = this.selectedPrune.findIndex(s => s.key === item.key);
                if (idx >= 0) {
                    this.selectedPrune.splice(idx, 1);
                } else if (this.selectedPrune.length < 5) {
                    this.selectedPrune.push(item);
                }
            },
            removeVlm(i) { this.selectedVlms.splice(i, 1); },
            removePrune(i) { this.selectedPrune.splice(i, 1); },
            selectAllBenchmarks() {
                this.selectedBenchmarks = this.sharedBenchmarks.map(b => b.key);
            },
            sortBy(col) {
                if (this.sortColumn === col) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = col;
                    this.sortDirection = col === 'name' || col === 'type' ? 'asc' : 'desc';
                }
            },
            getValue(item, benchKey) {
                const bench = this.sharedBenchmarks.find(b => b.key === benchKey);
                if (!bench) return null;
                let raw;
                if (item.type === 'vlm') {
                    raw = item.data[bench.vlmKey];
                } else {
                    raw = item.data[bench.pruneKey];
                }
                if (!raw || raw === '' || raw === '-' || raw === 'N/A') return null;
                // Handle MME format "1234.5/2000" -> use first number
                const str = String(raw);
                if (str.includes('/')) {
                    const parts = str.split('/');
                    return parseFloat(parts[0]) || null;
                }
                return parseFloat(str) || null;
            },
            getDisplayValue(item, benchKey) {
                const v = this.getValue(item, benchKey);
                return v !== null ? v.toFixed(1) : '-';
            },
            isBestInColumn(item, benchKey) {
                const vals = this.allSelected.map(s => this.getValue(s, benchKey)).filter(v => v !== null);
                if (vals.length === 0) return false;
                const myVal = this.getValue(item, benchKey);
                if (myVal === null) return false;
                return myVal >= Math.max(...vals);
            },
            getNormalizedValue(item, benchKey) {
                // Normalize to 0-100 scale for radar chart
                // MME typically 0-2000, others 0-100
                const v = this.getValue(item, benchKey);
                if (v === null) return 0;
                if (benchKey === 'mme') {
                    return Math.min(100, (v / 2000) * 100);
                }
                return Math.min(100, v);
            },
            drawRadar() {
                const canvas = this.$refs.compareRadar;
                if (!canvas) return;
                if (this._chart) {
                    this._chart.destroy();
                    this._chart = null;
                }
                if (this.allSelected.length === 0 || this.activeBenchmarks.length < 3) return;

                const labels = this.activeBenchmarks.map(b => b.label);
                const datasets = this.allSelected.map((item, i) => ({
                    label: item.label,
                    data: this.activeBenchmarks.map(b => this.getNormalizedValue(item, b.key)),
                    borderColor: this.chartColors[i % this.chartColors.length],
                    backgroundColor: this.chartColors[i % this.chartColors.length] + '22',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: this.chartColors[i % this.chartColors.length],
                    fill: true
                }));

                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const gridColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
                const labelColor = isDark ? '#e0e0e0' : '#333333';

                this._chart = new Chart(canvas, {
                    type: 'radar',
                    data: { labels, datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    stepSize: 20,
                                    color: labelColor,
                                    backdropColor: 'transparent'
                                },
                                grid: { color: gridColor },
                                angleLines: { color: gridColor },
                                pointLabels: {
                                    color: labelColor,
                                    font: { size: 12, weight: '600' }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: labelColor,
                                    padding: 16,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => {
                                        const item = this.allSelected[ctx.datasetIndex];
                                        const bench = this.activeBenchmarks[ctx.dataIndex];
                                        const raw = this.getValue(item, bench.key);
                                        return ctx.dataset.label + ': ' + (raw !== null ? raw.toFixed(1) : 'N/A');
                                    }
                                }
                            }
                        }
                    }
                });
            }
        },
        async mounted() {
            await this.loadData();

            // Watch global theme changes to redraw radar with correct text colors
            this._themeObserver = new MutationObserver(() => {
                this.$nextTick(() => this.drawRadar());
            });
            this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        },
        beforeUnmount() {
            if (this._themeObserver) this._themeObserver.disconnect();
        }
    });
}
