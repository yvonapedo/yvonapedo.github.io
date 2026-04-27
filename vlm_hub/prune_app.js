// Pruning App - wrapped for unified project
function createPruneApp() {
const { createApp } = Vue;

return createApp({
    template: `
        <div class="container">
            <!-- Messages -->
            <div v-if="message" :class="['message', message.type]">
                {{ message.text }}
            </div>

            <!-- Navigation Tabs -->
            <div class="nav-tabs">
                <button class="nav-tab" :class="{ active: currentPage === 'timeline' }" @click="currentPage = 'timeline'">
                    <i class="fas fa-stream"></i>
                    Timeline
                </button>
                <button class="nav-tab" :class="{ active: currentPage === 'add' }" @click="currentPage = 'add'">
                    <i class="fas fa-plus"></i>
                    Add Pruning Method
                </button>
                <button class="nav-tab" :class="{ active: currentPage === 'comparison' }" @click="currentPage = 'comparison'">
                    <i class="fas fa-th-large"></i>
                    Comparison
                </button>
                <button class="nav-tab" :class="{ active: currentPage === 'all' }" @click="currentPage = 'all'">
                    <i class="fas fa-search"></i>
                    Search
                </button>
                <button class="nav-tab" :class="{ active: currentPage === 'benchmarks' }" @click="currentPage = 'benchmarks'">
                    <i class="fas fa-trophy"></i>
                    Benchmarks
                </button>
                <button class="nav-tab" :class="{ active: currentPage === 'edit' }" @click="currentPage = 'edit'">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
            </div>

            <!-- TIMELINE PAGE -->
            <div v-if="currentPage === 'timeline'">
                <!-- Timeline Layout Options -->
                <div class="timeline-controls">
                    <label>Timeline Layout:</label>
                    <div class="layout-buttons">
                        <button 
                            class="layout-btn" 
                            :class="{ active: timelineOrientation === 'vertical' }"
                            @click="timelineOrientation = 'vertical'"
                        >
                            <i class="fas fa-arrow-down"></i> Vertical
                        </button>
                        <button 
                            class="layout-btn" 
                            :class="{ active: timelineOrientation === 'horizontal' }"
                            @click="timelineOrientation = 'horizontal'"
                        >
                            <i class="fas fa-arrow-right"></i> Horizontal
                        </button>
                    </div>
                </div>
                <!-- Controls Section -->
                <div class="controls-section">
                    <button class="btn-success" @click="exportCSV"><i class="fas fa-save"></i> Export CSV</button>
                </div>

                <!-- Timeline Section -->
                <div class="timeline-section" v-if="sortedEvents.length > 0">
                    <!-- VERTICAL TIMELINE (grouped by method) -->
                    <div v-if="timelineOrientation === 'vertical'" class="timeline timeline-vertical">
                        <div class="timeline-items items-vertical">
                            <div 
                                v-for="(group, eIndex) in groupedEvents" 
                                :key="eIndex"
                                class="timeline-item"
                            >
                                <div class="timeline-marker"></div>
                                <div class="timeline-content">
                                    <div class="timeline-year">{{ group.firstEvent.Year }}</div>
                                    <div class="timeline-title">{{ group.firstEvent.Pruning_Method }}</div>
                                    <div class="timeline-venue" v-if="group.firstEvent.Venue">
                                        <i class="fas fa-building"></i> {{ group.firstEvent.Venue }}
                                    </div>
                                    <div class="variant-list">
                                        <div class="variant-chip" @click="openModal(group)">
                                            <span class="variant-name">{{ group.firstEvent.Pruning_Method }}</span>
                                            <span class="variant-count" v-if="group.variants.length > 1">({{ group.variants.length }} configs)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- HORIZONTAL TIMELINE (alternating above/below) -->
                    <div v-else class="ht-wrapper">
                        <div class="ht-scroll">
                            <template v-for="(group, idx) in groupedEvents" :key="idx">
                                <div v-if="idx === 0 || group.firstEvent.Year !== groupedEvents[idx-1].firstEvent.Year" class="ht-year-marker">
                                    <span>{{ group.firstEvent.Year }}</span>
                                </div>
                                <div class="ht-item"
                                     :class="(idx % 2 === 0 ? 'ht-above' : 'ht-below') + ' ht-level-' + (Math.floor(idx / 2) % 4)"
                                     :style="{ '--dot-color': dotColors[idx % dotColors.length], '--vc': 1 }">
                                    <div class="ht-name-group">
                                        <div class="ht-variant" @click="openModal(group)">
                                            <span class="ht-variant-title">{{ group.firstEvent.Pruning_Method }}</span>
                                        </div>
                                    </div>
                                    <div class="ht-dot"></div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="empty-state">
                    <h3>No pruning methods yet</h3>
                    <p>Add your first pruning method using the form above or import data from a CSV file.</p>
                </div>
            </div>

            <!-- ADD PRUNING METHOD PAGE -->
            <div v-else-if="currentPage === 'add'">
                <div class="form-section">
                    <h2>Add New Pruning Method</h2>
                    <div class="form-group">
                        <div>
                            <label>Pruning Method Name</label>
                            <input v-model="newEvent.Pruning_Method" type="text" placeholder="e.g., ToMe, FastV, etc.">
                        </div>
                        <div>
                            <label>Venue</label>
                            <input v-model="newEvent.Venue" type="text" placeholder="e.g., CVPR'24">
                        </div>
                        <div>
                            <label>Year</label>
                            <input v-model.number="newEvent.Year" type="number" placeholder="e.g., 2024">
                        </div>
                    </div>
                    <div class="form-group">
                        <div>
                            <label>Pruning Location</label>
                            <input v-model="newEvent.Pruning_Location" type="text" placeholder="e.g., vision encoder">
                        </div>
                        <div>
                            <label>Pruned Target</label>
                            <input v-model="newEvent.Pruned_Target" type="text" placeholder="e.g., visual token">
                        </div>
                        <div>
                            <label>VLM</label>
                            <input v-model="newEvent.VLM" type="text" placeholder="e.g., LLaVA-1.5-7B">
                        </div>
                        <div>
                            <label>Token Retention</label>
                            <input v-model="newEvent.Token_Retention" type="text" placeholder="e.g., 192">
                        </div>
                    </div>
                    <div class="form-group">
                        <div>
                            <label>FLOPs</label>
                            <input v-model="newEvent.FLOPs" type="text" placeholder="e.g., 1780">
                        </div>
                        <div>
                            <label>Inference (ms)</label>
                            <input v-model="newEvent['Inference (ms)']" type="text" placeholder="e.g., 0">
                        </div>
                        <div>
                            <label>GitHub</label>
                            <input v-model="newEvent.GitHub" type="text" placeholder="e.g., https://github.com/...">
                        </div>
                    </div>

                    <h3 style="margin: 20px 0 10px; color: var(--text-primary);">Benchmarks</h3>
                    <div class="form-group">
                        <div>
                            <label>GQA</label>
                            <input v-model="newEvent.GQA" type="text" placeholder="e.g., 61.9">
                        </div>
                        <div>
                            <label>MMB</label>
                            <input v-model="newEvent.MMB" type="text" placeholder="e.g., 64.7">
                        </div>
                        <div>
                            <label>MM-CN</label>
                            <input v-model="newEvent['MM-CN']" type="text" placeholder="e.g., 58.1">
                        </div>
                        <div>
                            <label>MME</label>
                            <input v-model="newEvent.MME" type="text" placeholder="e.g., 1862">
                        </div>
                    </div>
                    <div class="form-group">
                        <div>
                            <label>POPE</label>
                            <input v-model="newEvent.POPE" type="text" placeholder="e.g., 85.9">
                        </div>
                        <div>
                            <label>SQA</label>
                            <input v-model="newEvent.SQA" type="text" placeholder="e.g., 69.5">
                        </div>
                        <div>
                            <label>VQA_v2</label>
                            <input v-model="newEvent.VQA_v2" type="text" placeholder="e.g., 78.5">
                        </div>
                        <div>
                            <label>VQA_Text</label>
                            <input v-model="newEvent.VQA_Text" type="text" placeholder="e.g., 58.2">
                        </div>
                    </div>
                    <div class="form-group">
                        <div>
                            <label>VizWiz</label>
                            <input v-model="newEvent.VizWiz" type="text" placeholder="e.g., 50">
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn-primary" @click="addEvent">Add Pruning Method</button>
                        <button class="btn-secondary" @click="clearForm">Clear</button>
                    </div>
                </div>
            </div>

            <!-- COMPARISON PAGE -->
            <div v-else-if="currentPage === 'comparison'">
                <div class="comparison-section">
                    <div class="model-selector">
                        <h3>Select Methods to Compare (up to 5)</h3>
                        <div class="model-list">
                            <label 
                                v-for="(group, index) in groupedEvents" 
                                :key="index"
                                class="model-checkbox"
                                :class="{ selected: selectedModels.includes(index) }"
                            >
                                <input 
                                    type="checkbox"
                                    :value="index"
                                    v-model.number="selectedModels"
                                    @change="limitSelection"
                                >
                                {{ group.title }} ({{ group.firstEvent.Venue }}, {{ group.firstEvent.Year }})
                            </label>
                        </div>
                    </div>

                    <!-- Comparison Cards View -->
                    <div v-if="selectedModels.length > 0" class="comparison-cards">
                        <div 
                            v-for="modelIdx in selectedModels" 
                            :key="modelIdx"
                            class="comparison-card"
                        >
                            <h3>
                                {{ groupedEvents[modelIdx].title }}
                                <button class="comparison-card-remove" @click="removeFromComparison(modelIdx)"><i class="fas fa-times"></i></button>
                            </h3>
                            <div class="comparison-card-row">
                                <span class="comparison-card-label">Venue:</span>
                                <span class="comparison-card-value">{{ groupedEvents[modelIdx].firstEvent.Venue || '-' }}</span>
                            </div>
                            <div class="comparison-card-row">
                                <span class="comparison-card-label">Year:</span>
                                <span class="comparison-card-value">{{ groupedEvents[modelIdx].firstEvent.Year }}</span>
                            </div>
                            <div class="comparison-card-row">
                                <span class="comparison-card-label">Pruning Location:</span>
                                <span class="comparison-card-value">{{ groupedEvents[modelIdx].firstEvent.Pruning_Location || '-' }}</span>
                            </div>
                            <div class="comparison-card-row">
                                <span class="comparison-card-label">Pruned Target:</span>
                                <span class="comparison-card-value">{{ groupedEvents[modelIdx].firstEvent.Pruned_Target || '-' }}</span>
                            </div>
                            <div class="comparison-card-row">
                                <span class="comparison-card-label">Variants:</span>
                                <span class="comparison-card-value">{{ groupedEvents[modelIdx].variants.length }} configurations</span>
                            </div>
                            <div class="comparison-card-row">
                                <span class="comparison-card-label">GitHub:</span>
                                <span class="comparison-card-value">
                                    <a v-if="groupedEvents[modelIdx].firstEvent.GitHub && groupedEvents[modelIdx].firstEvent.GitHub !== '-'" :href="groupedEvents[modelIdx].firstEvent.GitHub" target="_blank">Link</a>
                                    <span v-else>-</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Comparison Table View -->
                    <table v-if="selectedModels.length > 0" class="comparison-table">
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th v-for="modelIdx in selectedModels" :key="modelIdx">
                                    {{ groupedEvents[modelIdx].title }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="row-header">Venue</td>
                                <td v-for="modelIdx in selectedModels" :key="'venue-' + modelIdx" class="value-cell">
                                    {{ groupedEvents[modelIdx].firstEvent.Venue || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Year</td>
                                <td v-for="modelIdx in selectedModels" :key="'year-' + modelIdx" class="value-cell">
                                    {{ groupedEvents[modelIdx].firstEvent.Year }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Pruning Location</td>
                                <td v-for="modelIdx in selectedModels" :key="'loc-' + modelIdx" class="value-cell">
                                    {{ groupedEvents[modelIdx].firstEvent.Pruning_Location || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Pruned Target</td>
                                <td v-for="modelIdx in selectedModels" :key="'target-' + modelIdx" class="value-cell">
                                    {{ groupedEvents[modelIdx].firstEvent.Pruned_Target || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header"># Configurations</td>
                                <td v-for="modelIdx in selectedModels" :key="'count-' + modelIdx" class="value-cell">
                                    {{ groupedEvents[modelIdx].variants.length }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">GitHub</td>
                                <td v-for="modelIdx in selectedModels" :key="'gh-' + modelIdx" class="value-cell">
                                    <a v-if="groupedEvents[modelIdx].firstEvent.GitHub && groupedEvents[modelIdx].firstEvent.GitHub !== '-'" :href="groupedEvents[modelIdx].firstEvent.GitHub" target="_blank">Link</a>
                                    <span v-else>-</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Empty State -->
                    <div v-else class="empty-state">
                        <h3>Select methods to compare</h3>
                        <p>Choose 2-5 methods from the list above to see their comparison.</p>
                    </div>
                </div>
            </div>

            <!-- ALL PRUNING METHODS PAGE -->
            <div v-else-if="currentPage === 'all'">
                <div class="all-section">
                    <div class="all-search-bar">
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            placeholder="Search by method, venue, VLM, pruning location..."
                            class="all-search-input"
                        >
                    </div>

                    <!-- Filters -->
                    <div class="all-filters">
                        <div class="all-filter">
                            <label>Year</label>
                            <select v-model="filterYear">
                                <option value="">All Years</option>
                                <option v-for="y in uniqueYears" :key="y" :value="y">{{ y }}</option>
                            </select>
                        </div>
                        <div class="all-filter">
                            <label>Venue</label>
                            <select v-model="filterVenue">
                                <option value="">All Venues</option>
                                <option v-for="v in uniqueVenues" :key="v" :value="v">{{ v }}</option>
                            </select>
                        </div>
                        <div class="all-filter">
                            <label>Pruning Location</label>
                            <select v-model="filterLocation">
                                <option value="">All Locations</option>
                                <option v-for="l in uniqueLocations" :key="l" :value="l">{{ l }}</option>
                            </select>
                        </div>
                        <div class="all-filter">
                            <label>Pruned Target</label>
                            <select v-model="filterTarget">
                                <option value="">All Targets</option>
                                <option v-for="t in uniqueTargets" :key="t" :value="t">{{ t }}</option>
                            </select>
                        </div>
                        <button class="btn-secondary btn-small" @click="clearFilters" style="align-self: flex-end; margin-bottom: 2px;">Clear Filters</button>
                    </div>

                    <!-- Results count -->
                    <div class="all-results-count">
                        Showing <strong>{{ filteredEvents.length }}</strong> of <strong>{{ events.length }}</strong> entries
                    </div>

                    <!-- Data Table -->
                    <div class="all-table-wrapper" v-if="filteredEvents.length > 0">
                        <table class="all-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th class="sortable" :class="{ active: sortColumn === 'Pruning_Method' }" @click="toggleSort('Pruning_Method')">
                                        Method <span class="sort-icon">{{ sortColumn === 'Pruning_Method' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'Venue' }" @click="toggleSort('Venue')">
                                        Venue <span class="sort-icon">{{ sortColumn === 'Venue' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'Year' }" @click="toggleSort('Year')">
                                        Year <span class="sort-icon">{{ sortColumn === 'Year' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'Pruning_Location' }" @click="toggleSort('Pruning_Location')">
                                        Location <span class="sort-icon">{{ sortColumn === 'Pruning_Location' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'Pruned_Target' }" @click="toggleSort('Pruned_Target')">
                                        Target <span class="sort-icon">{{ sortColumn === 'Pruned_Target' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'VLM' }" @click="toggleSort('VLM')">
                                        VLM <span class="sort-icon">{{ sortColumn === 'VLM' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'Token_Retention' }" @click="toggleSort('Token_Retention')">
                                        Tokens <span class="sort-icon">{{ sortColumn === 'Token_Retention' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'GQA' }" @click="toggleSort('GQA')">
                                        GQA <span class="sort-icon">{{ sortColumn === 'GQA' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'MMB' }" @click="toggleSort('MMB')">
                                        MMB <span class="sort-icon">{{ sortColumn === 'MMB' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'MME' }" @click="toggleSort('MME')">
                                        MME <span class="sort-icon">{{ sortColumn === 'MME' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'POPE' }" @click="toggleSort('POPE')">
                                        POPE <span class="sort-icon">{{ sortColumn === 'POPE' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'VQA_v2' }" @click="toggleSort('VQA_v2')">
                                        VQA_v2 <span class="sort-icon">{{ sortColumn === 'VQA_v2' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'FLOPs' }" @click="toggleSort('FLOPs')">
                                        FLOPs <span class="sort-icon">{{ sortColumn === 'FLOPs' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(event, idx) in sortedFilteredEvents" :key="idx" @click="openModalSingleEvent(event)" class="all-table-row">
                                    <td>{{ idx + 1 }}</td>
                                    <td class="all-td-name">{{ event.Pruning_Method || '-' }}</td>
                                    <td>{{ event.Venue || '-' }}</td>
                                    <td>{{ event.Year || '-' }}</td>
                                    <td>{{ event.Pruning_Location || '-' }}</td>
                                    <td>{{ event.Pruned_Target || '-' }}</td>
                                    <td>{{ event.VLM || '-' }}</td>
                                    <td>{{ event.Token_Retention || '-' }}</td>
                                    <td class="all-td-bench">{{ event.GQA || '-' }}</td>
                                    <td class="all-td-bench">{{ event.MMB || '-' }}</td>
                                    <td class="all-td-bench">{{ event.MME || '-' }}</td>
                                    <td class="all-td-bench">{{ event.POPE || '-' }}</td>
                                    <td class="all-td-bench">{{ event.VQA_v2 || '-' }}</td>
                                    <td class="all-td-bench">{{ event.FLOPs || '-' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else class="empty-state">
                        <h3>No matching methods</h3>
                        <p>Try adjusting your search or filters.</p>
                    </div>
                </div>
            </div>

            <!-- BENCHMARKS PAGE -->
            <div v-else-if="currentPage === 'benchmarks'">
                <div class="bench-page">
                                        <!-- Radar Chart -->
                                        <!-- Removed duplicate radar chart at top -->
                    <h2 class="bench-page-title"><i class="fas fa-trophy"></i> Pruning Benchmark Comparison</h2>

                    <!-- Filter selectors -->
                    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
                        <div class="bench-selector" style="flex: 1; min-width: 180px;">
                            <h3>Methods</h3>
                            <div class="bench-toggle-row">
                                <button class="btn-small btn-primary" @click="benchFilterMethods = benchUniqueMethods.slice()">All</button>
                                <button class="btn-small btn-secondary" @click="benchFilterMethods = []">Clear</button>
                            </div>
                            <div class="model-list" style="max-height: 250px; overflow-y: auto;">
                                <label v-for="m in benchUniqueMethods" :key="m" class="model-checkbox" :class="{ selected: benchFilterMethods.includes(m) }">
                                    <input type="checkbox" :value="m" v-model="benchFilterMethods">
                                    {{ m }}
                                </label>
                            </div>
                        </div>
                        <div class="bench-selector" style="flex: 1; min-width: 180px;">
                            <h3>VLMs</h3>
                            <div class="bench-toggle-row">
                                <button class="btn-small btn-primary" @click="benchFilterVLMs = benchUniqueVLMs.slice()">All</button>
                                <button class="btn-small btn-secondary" @click="benchFilterVLMs = []">Clear</button>
                            </div>
                            <div class="model-list" style="max-height: 250px; overflow-y: auto;">
                                <label v-for="v in benchUniqueVLMs" :key="v" class="model-checkbox" :class="{ selected: benchFilterVLMs.includes(v) }">
                                    <input type="checkbox" :value="v" v-model="benchFilterVLMs">
                                    {{ v }}
                                </label>
                            </div>
                        </div>
                        <div class="bench-selector" style="flex: 1; min-width: 180px;">
                            <h3>Token Retention</h3>
                            <div class="bench-toggle-row">
                                <button class="btn-small btn-primary" @click="benchFilterTokens = benchUniqueTokens.slice()">All</button>
                                <button class="btn-small btn-secondary" @click="benchFilterTokens = []">Clear</button>
                            </div>
                            <div class="model-list" style="max-height: 250px; overflow-y: auto;">
                                <label v-for="t in benchUniqueTokens" :key="t" class="model-checkbox" :class="{ selected: benchFilterTokens.includes(t) }">
                                    <input type="checkbox" :value="t" v-model="benchFilterTokens">
                                    {{ t }}
                                </label>
                            </div>
                        </div>
                    </div>
                    <p class="bench-hint">{{ benchSelectedModels.length }} entries match your filters</p>

                    <!-- Benchmark selector -->
                    <div class="bench-selector" v-if="benchSelectedModels.length > 0">
                        <h3>Select Benchmarks</h3>
                        <div class="bench-toggle-row">
                            <button class="btn-small btn-primary" @click="selectAllBenchmarks">Select All</button>
                            <button class="btn-small btn-secondary" @click="benchSelectedBenchmarks = []">Clear</button>
                        </div>
                        <div class="bench-check-grid">
                            <label v-for="b in benchmarkList" :key="b.key" class="bench-check-item" :class="{ selected: benchSelectedBenchmarks.includes(b.key) }">
                                <input type="checkbox" :value="b.key" v-model="benchSelectedBenchmarks">
                                {{ b.label }}
                            </label>
                        </div>
                    <!-- Radar Chart -->
                    <div class="bench-radar-section" v-if="benchSelectedModels.length > 0 && benchSelectedBenchmarks.length > 0">
                        <h3>Radar Comparison</h3>
                        <div class="bench-radar-wrap">
                            <canvas ref="radarCanvas"></canvas>
                        </div>
                    </div>
                    </div>

                    <!-- Comparison Table -->
                    <div class="bench-table-wrapper" v-if="benchSelectedModels.length > 0 && benchSelectedBenchmarks.length > 0">
                        <table class="bench-table">
                            <thead>
                                <tr>
                                    <th class="bench-th-model sortable-header" @click="toggleBenchSort('title')">
                                        Method <span v-if="benchSortKey === 'title'">{{ benchSortDir === 'asc' ? '▲' : '▼' }}</span>
                                    </th>
                                    <th class="bench-th-size sortable-header" @click="toggleBenchSort('VLM')">
                                        VLM <span v-if="benchSortKey === 'VLM'">{{ benchSortDir === 'asc' ? '▲' : '▼' }}</span>
                                    </th>
                                    <th class="bench-th-size sortable-header" @click="toggleBenchSort('Token_Retention')">
                                        Tokens <span v-if="benchSortKey === 'Token_Retention'">{{ benchSortDir === 'asc' ? '▲' : '▼' }}</span>
                                    </th>
                                    <th v-for="b in selectedBenchmarkList" :key="b.key" class="sortable-header" @click="toggleBenchSort(b.key)">
                                        {{ b.label }} <span v-if="benchSortKey === b.key">{{ benchSortDir === 'asc' ? '▲' : '▼' }}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="idx in sortedBenchModels" :key="idx">
                                    <td class="bench-td-model">{{ modelsWithBenchmarks[idx].Pruning_Method || modelsWithBenchmarks[idx].title }}</td>
                                    <td class="bench-td-size">{{ modelsWithBenchmarks[idx].VLM }}</td>
                                    <td class="bench-td-size">{{ modelsWithBenchmarks[idx].Token_Retention }}</td>
                                    <td v-for="b in selectedBenchmarkList" :key="b.key"
                                        :class="benchCellClass(idx, b.key)">
                                        {{ formatBenchVal(modelsWithBenchmarks[idx][b.key], b.key) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Radar Chart -->
                    <!-- Radar chart moved above table -->

                    <!-- Bar Chart -->
                    <div class="bench-chart-section" v-if="benchSelectedModels.length > 0 && benchSelectedBenchmarks.length > 0">
                        <h3>Visual Comparison</h3>
                        <div v-for="b in selectedBenchmarkList" :key="'chart-' + b.key" class="bench-chart-group">
                            <div class="bench-chart-label">{{ b.label }}</div>
                            <div class="bench-bars">
                                <div v-for="(idx, i) in benchSelectedModels" :key="idx" class="bench-bar-row">
                                    <span class="bench-bar-name">{{ modelsWithBenchmarks[idx].Pruning_Method || modelsWithBenchmarks[idx].title }} ({{ modelsWithBenchmarks[idx].VLM }})</span>
                                    <div class="bench-bar-track">
                                        <div class="bench-bar-fill" 
                                             :style="{ width: benchBarWidth(idx, b.key) + '%', background: dotColors[i % dotColors.length] }">
                                        </div>
                                    </div>
                                    <span class="bench-bar-val">{{ formatBenchVal(modelsWithBenchmarks[idx][b.key], b.key) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="benchSelectedModels.length === 0" class="empty-state">
                        <h3>Select methods to compare benchmarks</h3>
                        <p>Choose methods from the list above.</p>
                    </div>
                </div>
            </div>

            <!-- EDIT PAGE -->
            <div v-else-if="currentPage === 'edit'">
                <h2><i class="fas fa-edit"></i> Edit Pruning Method</h2>
                <div class="edit-search-bar">
                    <input type="text" v-model="editSearchQuery" placeholder="Search editable pruning methods..." class="search-input" />
                </div>
                <div v-if="!editSelectedEvent" class="edit-list">
                    <div v-if="editableEvents.length === 0" class="flow-placeholder">No editable methods found. Only methods you added (edit=1) can be edited here.</div>
                    <div v-for="(evt, idx) in filteredEditableEvents" :key="'edit-'+idx" class="edit-list-item" @click="selectForEdit(evt)">
                        <span class="edit-item-title">{{ evt.Pruning_Method || evt.title }}</span>
                        <span class="edit-item-meta">{{ evt.Year }} · {{ evt.VLM || 'No VLM' }} · {{ evt.Pruning_Location || 'No location' }} · {{ evt.Token_Retention || '-' }}</span>
                    </div>
                </div>
                <div v-else class="edit-form-container">
                    <div class="edit-form-header">
                        <h3>Editing: {{ editSelectedEvent.Pruning_Method || editSelectedEvent.title }}</h3>
                        <button class="btn-secondary" @click="cancelEdit"><i class="fas fa-chevron-left"></i> Back to list</button>
                    </div>
                    <div class="form-group">
                        <div><label>Pruning Method</label><input v-model="editSelectedEvent.Pruning_Method" /></div>
                        <div><label>Venue</label><input v-model="editSelectedEvent.Venue" /></div>
                        <div><label>Year</label><input v-model.number="editSelectedEvent.Year" type="number" /></div>
                    </div>
                    <h4 class="form-section-title">Method Details</h4>
                    <div class="form-group">
                        <div><label>Pruning Location</label><input v-model="editSelectedEvent.Pruning_Location" /></div>
                        <div><label>Pruned Target</label><input v-model="editSelectedEvent.Pruned_Target" /></div>
                        <div><label>VLM</label><input v-model="editSelectedEvent.VLM" /></div>
                        <div><label>Token Retention</label><input v-model="editSelectedEvent.Token_Retention" /></div>
                    </div>
                    <div class="form-group">
                        <div><label>FLOPs</label><input v-model="editSelectedEvent.FLOPs" /></div>
                        <div><label>Inference (ms)</label><input v-model="editSelectedEvent['Inference (ms)']" /></div>
                        <div style="grid-column: span 2;"><label>GitHub</label><input v-model="editSelectedEvent.GitHub" /></div>
                    </div>
                    <h4 class="form-section-title">Benchmarks</h4>
                    <div class="form-group">
                        <div><label>GQA</label><input v-model="editSelectedEvent.GQA" /></div>
                        <div><label>MMB</label><input v-model="editSelectedEvent.MMB" /></div>
                        <div><label>MM-CN</label><input v-model="editSelectedEvent['MM-CN']" /></div>
                        <div><label>MME</label><input v-model="editSelectedEvent.MME" /></div>
                    </div>
                    <div class="form-group">
                        <div><label>POPE</label><input v-model="editSelectedEvent.POPE" /></div>
                        <div><label>SQA</label><input v-model="editSelectedEvent.SQA" /></div>
                        <div><label>VQA_v2</label><input v-model="editSelectedEvent.VQA_v2" /></div>
                        <div><label>VQA_Text</label><input v-model="editSelectedEvent.VQA_Text" /></div>
                    </div>
                    <div class="form-group">
                        <div><label>VizWiz</label><input v-model="editSelectedEvent.VizWiz" /></div>
                    </div>
                    <div class="edit-actions">
                        <button class="btn-primary" @click="saveEdit"><i class="fas fa-save"></i> Save Changes</button>
                        <button class="btn-secondary" @click="cancelEdit">Cancel</button>
                        <button @click="showDeleteConfirm = true" style="margin-left:auto;background:linear-gradient(135deg,#e53935,#b71c1c);color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-trash-alt"></i> Delete Entry</button>
                    </div>

                    <!-- Delete Confirmation Modal -->
                    <div v-if="showDeleteConfirm" class="modal show" @click.self="showDeleteConfirm = false">
                        <div class="modal-content" style="max-width:420px;text-align:center;padding:36px 32px;">
                            <div style="font-size:42px;margin-bottom:16px;"><i class="fas fa-exclamation-triangle" style="color:#e53935;"></i></div>
                            <h3 style="color:var(--text-primary);margin-bottom:8px;">Delete Entry?</h3>
                            <p style="color:var(--text-secondary);margin-bottom:24px;font-size:14px;">Are you sure you want to delete <strong>{{ editSelectedEvent.Pruning_Method || editSelectedEvent.title }}</strong>? This action cannot be undone.</p>
                            <div style="display:flex;gap:12px;justify-content:center;">
                                <button @click="showDeleteConfirm = false" style="padding:9px 22px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);cursor:pointer;font-weight:600;font-size:13px;">Cancel</button>
                                <button @click="confirmDeleteEntry" style="padding:9px 22px;border-radius:6px;border:none;background:linear-gradient(135deg,#e53935,#b71c1c);color:#fff;cursor:pointer;font-weight:600;font-size:13px;"><i class="fas fa-trash-alt"></i> Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal for Details -->
            <div class="modal" :class="{ show: showModal }" @click.self="closeModal">
                <div class="modal-content" v-if="selectedEvent">
                    <div class="modal-header">
                        <h2 class="modal-title">{{ selectedEvent.title }}</h2>
                        <button class="modal-close" @click="closeModal"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-field">
                            <div class="modal-field-label">Venue</div>
                            <div class="modal-field-value">{{ selectedEvent.firstEvent.Venue || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Year</div>
                            <div class="modal-field-value accent">{{ selectedEvent.firstEvent.Year }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Pruning Location</div>
                            <div class="modal-field-value">{{ selectedEvent.firstEvent.Pruning_Location || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Pruned Target</div>
                            <div class="modal-field-value">{{ selectedEvent.firstEvent.Pruned_Target || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">GitHub</div>
                            <div class="modal-field-value">
                                <a v-if="selectedEvent.firstEvent.GitHub && selectedEvent.firstEvent.GitHub !== '-'" :href="selectedEvent.firstEvent.GitHub" target="_blank">{{ selectedEvent.firstEvent.GitHub }}</a>
                                <span v-else>-</span>
                            </div>
                        </div>
                        <div class="modal-field modal-full">
                            <div class="modal-field-label">Performance ({{ selectedEvent.variants.length }} configurations)</div>
                            <table class="modal-bench-table">
                                <thead>
                                    <tr>
                                        <th>VLM</th>
                                        <th>Token Retention</th>
                                        <th>GQA</th>
                                        <th>MMB</th>
                                        <th>MM-CN</th>
                                        <th>MME</th>
                                        <th>POPE</th>
                                        <th>SQA</th>
                                        <th>VQA_v2</th>
                                        <th>VQA_Text</th>
                                        <th>VizWiz</th>
                                        <th>FLOPs</th>
                                        <th>Inference (ms)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="v in selectedEvent.variants" :key="v.VLM + '-' + v.Token_Retention">
                                        <td>{{ v.VLM || '-' }}</td>
                                        <td>{{ v.Token_Retention || '-' }}</td>
                                        <td>{{ v.GQA || '-' }}</td>
                                        <td>{{ v.MMB || '-' }}</td>
                                        <td>{{ v['MM-CN'] || '-' }}</td>
                                        <td>{{ v.MME || '-' }}</td>
                                        <td>{{ v.POPE || '-' }}</td>
                                        <td>{{ v.SQA || '-' }}</td>
                                        <td>{{ v.VQA_v2 || '-' }}</td>
                                        <td>{{ v.VQA_Text || '-' }}</td>
                                        <td>{{ v.VizWiz || '-' }}</td>
                                        <td>{{ v.FLOPs || '-' }}</td>
                                        <td>{{ v['Inference (ms)'] || '-' }}</td>
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
            events: [],
            selectedModels: [],
            currentPage: 'timeline',
            darkMode: false,
            timelineOrientation: 'horizontal',
            dotColors: [
                '#667eea', '#e84393', '#00b894', '#fd79a8', '#6c5ce7',
                '#00cec9', '#e17055', '#0984e3', '#d63031', '#fdcb6e',
                '#a29bfe', '#55efc4', '#fab1a0', '#74b9ff', '#ff7675',
                '#636e72', '#81ecec'
            ],
            benchSelectedModels: [],
            benchFilterMethods: [],
            benchFilterVLMs: [],
            benchFilterTokens: [],
            searchQuery: '',
            filterYear: '',
            filterVenue: '',
            filterLocation: '',
            filterTarget: '',
            sortColumn: '',
            sortDirection: 'asc',
            benchSelectedMethods: [],
            benchSortKey: '',
            benchSortDir: 'desc',
            benchSelectedBenchmarks: ['GQA', 'MMB', 'MM-CN', 'MME', 'POPE', 'SQA', 'VQA_v2', 'VQA_Text', 'VizWiz'],
            benchmarkList: [
                { key: 'GQA', label: 'GQA' },
                { key: 'MMB', label: 'MMB' },
                { key: 'MM-CN', label: 'MM-CN' },
                { key: 'MME', label: 'MME' },
                { key: 'POPE', label: 'POPE' },
                { key: 'SQA', label: 'SQA' },
                { key: 'VQA_v2', label: 'VQA_v2' },
                { key: 'VQA_Text', label: 'VQA_Text' },
                { key: 'VizWiz', label: 'VizWiz' }
            ],
            editSearchQuery: '',
            editSelectedEvent: null,
            showDeleteConfirm: false,
            showModal: false,
            selectedEvent: null,
            newEvent: {
                Pruning_Method: '',
                Venue: '',
                Year: new Date().getFullYear(),
                Pruning_Location: '',
                Pruned_Target: '',
                VLM: '',
                edit: '1',
                Token_Retention: '',
                GQA: '',
                MMB: '',
                'MM-CN': '',
                MME: '',
                POPE: '',
                SQA: '',
                VQA_v2: '',
                VQA_Text: '',
                VizWiz: '',
                FLOPs: '',
                'Inference (ms)': '',
                GitHub: ''
            },
            message: null
        }
    },
    computed: {
        editableEvents() {
            return this.events.filter(e => String(e.edit) === '1');
        },
        filteredEditableEvents() {
            if (!this.editSearchQuery) return this.editableEvents;
            const q = this.editSearchQuery.toLowerCase();
            return this.editableEvents.filter(e =>
                (e.Pruning_Method || '').toLowerCase().includes(q) ||
                (e.VLM || '').toLowerCase().includes(q) ||
                (e.Venue || '').toLowerCase().includes(q) ||
                (e.Pruning_Location || '').toLowerCase().includes(q)
            );
        },
        sortedEvents() {
            return [...this.events].sort((a, b) => {
                const ya = parseInt(a.Year) || 0;
                const yb = parseInt(b.Year) || 0;
                if (ya !== yb) return ya - yb;
                return (a.Pruning_Method || '').localeCompare(b.Pruning_Method || '');
            });
        },
        groupedEvents() {
            const groups = [];
            const seen = new Map();
            for (const event of this.sortedEvents) {
                const key = event.Pruning_Method;
                if (!key) continue;
                if (seen.has(key)) {
                    seen.get(key).variants.push(event);
                } else {
                    const group = { title: key, variants: [event], firstEvent: event };
                    seen.set(key, group);
                    groups.push(group);
                }
            }
            return groups;
        },
        horizontalTimelineItems() {
            const items = [];
            let lastYear = null;
            let modelIndex = 0;
            for (const group of this.groupedEvents) {
                const year = group.firstEvent.Year;
                if (year !== lastYear) {
                    items.push({ type: 'year', year });
                    lastYear = year;
                }
                items.push({ type: 'model', group, modelIndex });
                modelIndex++;
            }
            return items;
        },
        filteredEvents() {
            const q = this.searchQuery.toLowerCase();
            return this.sortedEvents.filter(e => {
                if (q) {
                    const haystack = [e.Pruning_Method, e.Venue, e.Pruning_Location, e.Pruned_Target, e.VLM]
                        .filter(Boolean).join(' ').toLowerCase();
                    if (!haystack.includes(q)) return false;
                }
                if (this.filterYear && parseInt(e.Year) !== parseInt(this.filterYear)) return false;
                if (this.filterVenue && e.Venue !== this.filterVenue) return false;
                if (this.filterLocation && e.Pruning_Location !== this.filterLocation) return false;
                if (this.filterTarget && e.Pruned_Target !== this.filterTarget) return false;
                return true;
            });
        },
        uniqueYears() {
            return [...new Set(this.events.map(e => e.Year).filter(Boolean))].sort();
        },
        uniqueVenues() {
            return [...new Set(this.events.map(e => e.Venue).filter(Boolean))].sort();
        },
        uniqueLocations() {
            return [...new Set(this.events.map(e => e.Pruning_Location).filter(Boolean))].sort();
        },
        uniqueTargets() {
            return [...new Set(this.events.map(e => e.Pruned_Target).filter(Boolean))].sort();
        },
        modelsWithBenchmarks() {
            const benchKeys = this.benchmarkList.map(b => b.key);
            return this.sortedEvents.filter(e => benchKeys.some(k => e[k] && e[k] !== '-'));
        },
        benchUniqueMethods() {
            return [...new Set(this.modelsWithBenchmarks.map(e => e.Pruning_Method).filter(Boolean))].sort();
        },
        benchUniqueVLMs() {
            return [...new Set(this.modelsWithBenchmarks.map(e => e.VLM).filter(Boolean))].sort();
        },
        benchUniqueTokens() {
            return [...new Set(this.modelsWithBenchmarks.map(e => e.Token_Retention).filter(Boolean))].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
        },
        selectedBenchmarkList() {
            return this.benchmarkList.filter(b => this.benchSelectedBenchmarks.includes(b.key));
        },
        sortedBenchModels() {
            if (!this.benchSortKey) return [...this.benchSelectedModels];
            const key = this.benchSortKey;
            const dir = this.benchSortDir === 'asc' ? 1 : -1;
            return [...this.benchSelectedModels].sort((a, b) => {
                const ma = this.modelsWithBenchmarks[a];
                const mb = this.modelsWithBenchmarks[b];
                if (key === 'title') return dir * (ma.Pruning_Method || '').localeCompare(mb.Pruning_Method || '');
                if (key === 'VLM') return dir * (ma.VLM || '').localeCompare(mb.VLM || '');
                if (key === 'Token_Retention') return dir * ((parseFloat(ma.Token_Retention) || 0) - (parseFloat(mb.Token_Retention) || 0));
                const va = this.parseBenchVal(ma[key], key);
                const vb = this.parseBenchVal(mb[key], key);
                return dir * ((isNaN(va) ? -1 : va) - (isNaN(vb) ? -1 : vb));
            });
        },
        sortedFilteredEvents() {
            if (!this.sortColumn) return this.filteredEvents;
            const col = this.sortColumn;
            const dir = this.sortDirection === 'asc' ? 1 : -1;
            return [...this.filteredEvents].sort((a, b) => {
                let va = a[col], vb = b[col];
                if (col === 'Year' || col === 'Token_Retention' || col === 'FLOPs') {
                    return ((parseFloat(va) || 0) - (parseFloat(vb) || 0)) * dir;
                }
                // Try numeric comparison for benchmark columns
                const na = parseFloat(va), nb = parseFloat(vb);
                if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
                va = (va || '').toString().toLowerCase();
                vb = (vb || '').toString().toLowerCase();
                return va.localeCompare(vb) * dir;
            });
        }
    },
    methods: {
        async addEvent() {
            if (!this.newEvent.Pruning_Method || !this.newEvent.Year) {
                this.showMessage('Please fill in at least the year and method name', 'error');
                return;
            }
            this.events.push({ ...this.newEvent });
            await this.saveToServer();
            this.showMessage(`Pruning method "${this.newEvent.Pruning_Method}" added successfully!`, 'success');
            this.clearForm();
            this.currentPage = 'timeline';
        },
        clearForm() {
            this.newEvent = {
                Pruning_Method: '',
                Venue: '',
                Year: new Date().getFullYear(),
                Pruning_Location: '',
                Pruned_Target: '',
                VLM: '',
                edit: '1',
                Token_Retention: '',
                GQA: '',
                MMB: '',
                'MM-CN': '',
                MME: '',
                POPE: '',
                SQA: '',
                VQA_v2: '',
                VQA_Text: '',
                VizWiz: '',
                FLOPs: '',
                'Inference (ms)': '',
                GitHub: ''
            };
        },
        deleteEvent(index) {
            const evt = this.sortedEvents[index];
            const title = evt.Pruning_Method || evt.title;
            this.events.splice(this.events.indexOf(evt), 1);
            this.saveToServer();
            this.showMessage(`Pruning method "${title}" deleted`, 'success');
        },
        removeFromComparison(idx) {
            this.selectedModels = this.selectedModels.filter(i => i !== idx);
        },
        openModal(group) {
            // Accept a group object with variants array
            if (group && group.variants) {
                this.selectedEvent = group;
            } else {
                // Single event — find its group from groupedEvents
                const method = group.Pruning_Method || group.title;
                const found = this.groupedEvents.find(g => g.title === method);
                if (found) {
                    this.selectedEvent = found;
                } else {
                    this.selectedEvent = { title: method, variants: [group], firstEvent: group };
                }
            }
            this.showModal = true;
            document.body.style.overflow = 'hidden';
        },
        openModalSingleEvent(event) {
            // When clicking a row in the search/all table, find the group for that method
            const method = event.Pruning_Method;
            const found = this.groupedEvents.find(g => g.title === method);
            if (found) {
                this.selectedEvent = found;
            } else {
                this.selectedEvent = { title: method, variants: [event], firstEvent: event };
            }
            this.showModal = true;
            document.body.style.overflow = 'hidden';
        },
        closeModal() {
            this.showModal = false;
            this.selectedEvent = null;
            document.body.style.overflow = 'auto';
        },
        limitSelection() {
            if (this.selectedModels.length > 5) {
                this.selectedModels.pop();
                this.showMessage('Maximum 5 methods can be compared', 'error');
            }
        },
        exportCSV() {
            if (this.events.length === 0) {
                this.showMessage('No pruning methods to export', 'error');
                return;
            }
            const headers = [
                'Pruning_Method','Venue','Year','Pruning_Location','Pruned_Target','VLM','Token_Retention',
                'GQA','MMB','MM-CN','MME','POPE','SQA','VQA_v2','VQA_Text','VizWiz','FLOPs','Inference (ms)','GitHub'
            ];
            const rows = this.sortedEvents.map(event => headers.map(h => event[h] || ''));
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(v => this.escapeCSV(String(v))).join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `pruning_methods_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showMessage('CSV exported successfully!', 'success');
        },
        importCSV(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.trim().split('\n');
                    if (lines.length < 2) {
                        this.showMessage('CSV file is empty', 'error');
                        return;
                    }
                    const headers = lines[0].split(',').map(h => h.trim());
                    let importedCount = 0;
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        const values = this.parseCSVLine(line);
                        const row = {};
                        headers.forEach((h, idx) => {
                            row[h] = values[idx] || '';
                        });
                        if (row.Year) row.Year = parseInt(row.Year) || row.Year;
                        if (row.Pruning_Method && row.Year) {
                            this.events.push(row);
                            importedCount++;
                        }
                    }
                    this.saveToServer();
                    this.showMessage(`Imported ${importedCount} pruning methods successfully!`, 'success');
                    this.$refs.csvInput.value = '';
                } catch (error) {
                    this.showMessage('Error importing CSV: ' + error.message, 'error');
                    this.$refs.csvInput.value = '';
                }
            };
            reader.readAsText(file);
        },
        parseCSVLine(line) {
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
        },
        escapeCSV(str) {
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        },
        async saveToServer() {
            savePruneData(this.events);
        },
        async loadFromServer() {
            const data = await loadPruneData();
            if (data.length > 0) {
                this.events = data;
                return true;
            }
            return false;
        },
        toggleSort(col) {
            if (this.sortColumn === col) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortColumn = col;
                this.sortDirection = 'asc';
            }
        },
        parseBenchVal(raw, key) {
            if (!raw || raw === '-') return NaN;
            const v = parseFloat(raw);
            if (key === 'MME') return isNaN(v) ? NaN : Math.round((v / 2000) * 1000) / 10;
            return v;
        },
        formatBenchVal(raw, key) {
            if (!raw || raw === '-') return '-';
            if (key === 'MME') {
                const v = this.parseBenchVal(raw, key);
                return isNaN(v) ? raw : v.toFixed(1) + '%';
            }
            return raw;
        },
        selectAllBenchmarks() {
            this.benchSelectedBenchmarks = this.benchmarkList.map(b => b.key);
        },
        toggleBenchSort(key) {
            if (this.benchSortKey === key) {
                this.benchSortDir = this.benchSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                this.benchSortKey = key;
                this.benchSortDir = 'desc';
            }
        },
        benchBarWidth(modelIdx, benchKey) {
            const val = this.parseBenchVal(this.modelsWithBenchmarks[modelIdx][benchKey], benchKey);
            if (isNaN(val)) return 0;
            let max = 0;
            for (const idx of this.benchSelectedModels) {
                const v = this.parseBenchVal(this.modelsWithBenchmarks[idx][benchKey], benchKey);
                if (!isNaN(v) && v > max) max = v;
            }
            return max > 0 ? (val / max) * 100 : 0;
        },
        benchCellClass(modelIdx, benchKey) {
            const val = this.parseBenchVal(this.modelsWithBenchmarks[modelIdx][benchKey], benchKey);
            if (isNaN(val)) return '';
            let max = -Infinity;
            for (const idx of this.benchSelectedModels) {
                const v = this.parseBenchVal(this.modelsWithBenchmarks[idx][benchKey], benchKey);
                if (!isNaN(v) && v > max) max = v;
            }
            return val === max ? 'bench-best' : '';
        },
        updateBenchSelection() {
            const indices = [];
            this.modelsWithBenchmarks.forEach((e, idx) => {
                const methodOk = this.benchFilterMethods.length === 0 || this.benchFilterMethods.includes(e.Pruning_Method);
                const vlmOk = this.benchFilterVLMs.length === 0 || this.benchFilterVLMs.includes(e.VLM);
                const tokenOk = this.benchFilterTokens.length === 0 || this.benchFilterTokens.includes(e.Token_Retention);
                if (methodOk && vlmOk && tokenOk) indices.push(idx);
            });
            this.benchSelectedModels = indices;
        },
        clearFilters() {
            this.searchQuery = '';
            this.filterYear = '';
            this.filterVenue = '';
            this.filterLocation = '';
            this.filterTarget = '';
            this.sortColumn = '';
            this.sortDirection = 'asc';
        },
        clearAllData() {
            if (confirm('Are you sure you want to delete all pruning methods? This cannot be undone.')) {
                this.events = [];
                this.selectedModels = [];
                this.saveToServer();
                this.showMessage('All data cleared', 'success');
            }
        },
        showMessage(text, type = 'success') {
            this.message = { text, type };
            setTimeout(() => {
                this.message = null;
            }, 4000);
        },
        selectForEdit(evt) {
            this.editSelectedEvent = evt;
        },
        cancelEdit() {
            this.editSelectedEvent = null;
            this.showDeleteConfirm = false;
        },
        confirmDeleteEntry() {
            const title = this.editSelectedEvent.Pruning_Method || this.editSelectedEvent.title;
            const idx = this.events.indexOf(this.editSelectedEvent);
            if (idx !== -1) {
                this.events.splice(idx, 1);
            }
            this.saveToServer();
            this.showDeleteConfirm = false;
            this.editSelectedEvent = null;
            this.showMessage(`Entry "${title}" deleted`, 'success');
        },
        async saveEdit() {
            await this.saveToServer();
            this.showMessage(`Pruning method "${this.editSelectedEvent.Pruning_Method || this.editSelectedEvent.title}" updated!`, 'success');
            this.editSelectedEvent = null;
        },
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            this.setTheme();
        },
        setTheme() {
            const theme = this.darkMode ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        },
        drawRadarChart() {
            this.$nextTick(() => {
                const canvas = this.$refs.radarCanvas;
                if (!canvas) return;
                if (this._radarChart) {
                    this._radarChart.destroy();
                    this._radarChart = null;
                }
                const labels = this.selectedBenchmarkList.map(b => b.label);
                const datasets = this.benchSelectedModels.map((idx, i) => {
                    const model = this.modelsWithBenchmarks[idx];
                    const color = this.dotColors[i % this.dotColors.length];
                    return {
                        label: (model.Pruning_Method || model.title) + ' (' + (model.VLM || '') + ')',
                        data: this.selectedBenchmarkList.map(b => {
                            const v = this.parseBenchVal(model[b.key], b.key);
                            return isNaN(v) ? 0 : v;
                        }),
                        borderColor: color,
                        backgroundColor: 'transparent',
                        borderWidth: 2.5,
                        pointBackgroundColor: color,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false
                    };
                });
                const isDark = this.darkMode;
                this._radarChart = new Chart(canvas, {
                    type: 'radar',
                    data: { labels, datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            r: {
                                beginAtZero: true,
                                angleLines: { color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
                                grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                                pointLabels: {
                                    color: isDark ? '#dfe6e9' : '#2d3436',
                                    font: { size: 12, weight: '600' }
                                },
                                ticks: {
                                    color: isDark ? '#b2bec3' : '#636e72',
                                    backdropColor: 'transparent',
                                    font: { size: 10 }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: isDark ? '#dfe6e9' : '#2d3436',
                                    font: { size: 12 },
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => ctx.dataset.label + ': ' + ctx.parsed.r
                                }
                            }
                        }
                    }
                });
            });
        }
    },
    watch: {
        benchSelectedModels: {
            handler() { this.drawRadarChart(); },
            deep: true
        },
        benchFilterMethods: {
            handler() { this.updateBenchSelection(); },
            deep: true
        },
        benchFilterVLMs: {
            handler() { this.updateBenchSelection(); },
            deep: true
        },
        benchFilterTokens: {
            handler() { this.updateBenchSelection(); },
            deep: true
        },
        benchSelectedBenchmarks: {
            handler() { this.drawRadarChart(); },
            deep: true
        },
        darkMode() { this.drawRadarChart(); },
        currentPage(val) { localStorage.setItem('pruneCurrentPage', val); }
    },
    async mounted() {
        const savedPage = localStorage.getItem('pruneCurrentPage');
        if (savedPage && ['timeline','add','comparison','all','benchmarks','edit'].includes(savedPage)) {
            this.currentPage = savedPage;
        }
        const globalTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.darkMode = globalTheme === 'dark';
        const loaded = await this.loadFromServer();
        if (!loaded) {
            this.showMessage('No data found. Import a CSV or add pruning methods manually.', 'error');
        }

        // Watch global theme changes to redraw charts with correct text colors
        this._themeObserver = new MutationObserver(() => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (this.darkMode !== isDark) this.darkMode = isDark;
        });
        this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },
    beforeUnmount() {
        if (this._themeObserver) this._themeObserver.disconnect();
    }
});
}
