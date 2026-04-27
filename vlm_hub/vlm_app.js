// VLM App - wrapped for unified project
function createVlmApp() {
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
                    Add VLM
                </button>
                <button class="nav-tab" :class="{ active: currentPage === 'comparison' }" @click="currentPage = 'comparison'">
                    <i class="fas fa-th-large"></i>
                    Comparison
                </button>
                <button class="nav-tab" :class="{ active: currentPage === 'flow' }" @click="currentPage = 'flow'">
                    <i class="fas fa-project-diagram"></i>
                    Flow
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

            <!-- FLOW PAGE -->
            <div v-if="currentPage === 'flow'">
                <div class="flow-section">
                    <h2>
                        <i class="fas fa-project-diagram" style="margin-right: 6px; vertical-align: middle;"></i>
                        VLM Architecture Flow
                    </h2>
                    <div class="flow-model-select">
                        <!-- Selected chips on top -->
                        <div class="flow-selected-row">
                            <label>Selected Models:</label>
                            <div class="bench-chips" v-if="flowSelectedModels.length > 0">
                                <span class="bench-chip" v-for="idx in flowSelectedModels" :key="idx">
                                    {{ events[idx].title }}{{ events[idx].size_params ? ' (' + events[idx].size_params + ')' : '' }}
                                    <button class="bench-chip-remove" @click="flowSelectedModels = flowSelectedModels.filter(i => i !== idx)">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </span>
                                <button class="btn-small btn-secondary" @click="flowSelectedModels = []">Clear all</button>
                            </div>
                            <span v-else class="flow-no-selection">No models selected</span>
                        </div>

                        <!-- Search box below -->
                        <div class="flow-search-row">
                            <label>Add Models (up to 5):</label>
                            <div class="flow-search-wrap" ref="flowSearchWrap">
                                <input
                                    type="text"
                                    class="flow-search-input"
                                    v-model="flowSearchQuery"
                                    placeholder="Search and select models..."
                                    @click.stop="flowDropdownOpen = true"
                                    @input="flowDropdownOpen = true"
                                    style="padding-left: 28px;"
                                >
                                <i class="fas fa-search" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%);"></i>
                                <div class="flow-dropdown" v-show="flowDropdownOpen" @mousedown.prevent>
                                    <div
                                        v-for="item in filteredFlowModels"
                                        :key="item.index"
                                        class="flow-dropdown-item"
                                        :class="{ active: flowSelectedModels.includes(item.index) }"
                                        @click.stop="toggleFlowModel(item.index)"
                                    >
                                        <span class="flow-dropdown-check">
                                            <i v-if="flowSelectedModels.includes(item.index)" class="fas fa-check"></i>
                                        </span>
                                        {{ item.event.title }}{{ item.event.size_params ? ' (' + item.event.size_params + ')' : '' }}
                                    </div>
                                    <div v-if="filteredFlowModels.length === 0" class="flow-dropdown-empty">No models found</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Architecture diagrams for each selected model -->
                    <div v-for="(modelIdx, mi) in flowSelectedModels" :key="modelIdx" class="arch-outer">
                        <h3 class="arch-model-title">{{ events[modelIdx].title }}{{ events[modelIdx].size_params ? ' (' + events[modelIdx].size_params + ')' : '' }}</h3>
                        <div class="arch-canvas" :ref="'archCanvas_' + mi">
                            <svg class="arch-svg" :ref="'archSvg_' + mi"></svg>
                            <div class="arch-inner">
                                <!-- Text Row -->
                                <div class="arch-text-row">
                                    <div class="arch-input-box">text</div>
                                    <div class="arch-hline" style="width:14px"></div>
                                    <div class="arch-gray-box" :ref="'archTokenizer_' + mi" style="width:36px;height:90px;">Tokenizer</div>
                                    <template v-if="getFlowTextEncoder(events[modelIdx])">
                                        <div class="arch-hline" style="width:14px"></div>
                                        <div class="arch-text-encoder-wrapper">
                                            <div class="arch-text-encoder-label">Text encoder — {{ getFlowTextEncoder(events[modelIdx]) }}</div>
                                            <div class="arch-blocks-row">
                                                <div v-for="i in getFlowTextEncoderBlocks(events[modelIdx])" :key="'tenc-'+modelIdx+'-'+i"
                                                     class="arch-text-enc-block"
                                                     style="background:#2d7d9a">
                                                    block text enc.
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                                <!-- Image Row -->
                                <div class="arch-image-row">
                                    <div class="arch-input-box">image</div>
                                    <div class="arch-hline" style="width:14px"></div>

                                    <template v-if="getFlowBeforeEncoder(events[modelIdx])">
                                        <div class="arch-stage-box before-enc">
                                            {{ getFlowBeforeEncoder(events[modelIdx]) }}
                                            <div class="arch-stage-label before-enc">{{ getFlowBeforeEncoder(events[modelIdx]) }}</div>
                                        </div>
                                        <div class="arch-hline" style="width:14px"></div>
                                    </template>

                                    <div class="arch-encoder-wrapper">
                                        <div class="arch-encoder-label">Vision encoder — {{ getFlowEncoderName(events[modelIdx]) }}</div>
                                        <div class="arch-blocks-row">
                                            <div v-for="i in getFlowEncoderBlocks(events[modelIdx])" :key="'enc-'+modelIdx+'-'+i"
                                                 class="arch-enc-block"
                                                 style="background:#2a5aaa">
                                                block vis. enc.
                                            </div>
                                        </div>
                                    </div>
                                    <div class="arch-hline" style="width:14px"></div>

                                    <template v-if="getFlowAfterEncoder(events[modelIdx])">
                                        <div class="arch-stage-box after-enc">
                                            {{ getFlowAfterEncoder(events[modelIdx]) }}
                                            <div class="arch-stage-label after-enc">{{ getFlowAfterEncoder(events[modelIdx]) }}</div>
                                        </div>
                                        <div class="arch-hline" style="width:14px"></div>
                                    </template>

                                    <div class="arch-projector-box">
                                        proj.
                                        <div class="arch-projector-label">{{ getFlowProjectorName(events[modelIdx]) }}</div>
                                    </div>
                                    <div class="arch-hline" style="width:14px"></div>

                                    <template v-if="getFlowAfterProjector(events[modelIdx])">
                                        <div class="arch-stage-box after-proj">
                                            {{ getFlowAfterProjector(events[modelIdx]) }}
                                            <div class="arch-stage-label after-proj">{{ getFlowAfterProjector(events[modelIdx]) }}</div>
                                        </div>
                                        <div class="arch-hline" style="width:14px"></div>
                                    </template>

                                    <div class="arch-concat-box" :ref="'archConcat_' + mi"><span>Concat</span></div>
                                    <div class="arch-hline" style="width:14px"></div>

                                    <div class="arch-llm-wrapper">
                                        <div class="arch-llm-label">LLM — {{ getFlowLLMName(events[modelIdx]) }}</div>
                                        <div class="arch-blocks-row">
                                            <div v-for="i in getFlowLLMBlocks(events[modelIdx])" :key="'llm-'+modelIdx+'-'+i"
                                                 class="arch-llm-block"
                                                 style="background:#a07818">
                                                block llm
                                            </div>
                                        </div>
                                    </div>
                                    <div class="arch-hline" style="width:14px"></div>

                                    <div class="arch-gray-box" style="width:36px;height:90px;">LM Head</div>
                                    <div class="arch-hline" style="width:14px"></div>
                                    <div class="arch-gray-box" style="width:36px;height:90px;">output</div>
                                </div>
                            </div>

                            <div class="arch-legend">
                                <div class="arch-legend-item" v-if="getFlowBeforeEncoder(events[modelIdx])"><div class="arch-legend-dot" style="background:#2d7d9a"></div>Before Encoder: {{ getFlowBeforeEncoder(events[modelIdx]) }}</div>
                                <div class="arch-legend-item"><div class="arch-legend-dot" style="background:#2a5aaa"></div>Vision Encoder: {{ getFlowEncoderName(events[modelIdx]) }}</div>
                                <div class="arch-legend-item" v-if="getFlowAfterEncoder(events[modelIdx])"><div class="arch-legend-dot" style="background:#8a5a2a"></div>After Encoder: {{ getFlowAfterEncoder(events[modelIdx]) }}</div>
                                <div class="arch-legend-item" v-if="getFlowTextEncoder(events[modelIdx])"><div class="arch-legend-dot" style="background:#3a7ac8"></div>Text Encoder: {{ getFlowTextEncoder(events[modelIdx]) }}</div>
                                <div class="arch-legend-item"><div class="arch-legend-dot" style="background:#5a9a28"></div>Projector: {{ getFlowProjectorName(events[modelIdx]) }}</div>
                                <div class="arch-legend-item" v-if="getFlowAfterProjector(events[modelIdx])"><div class="arch-legend-dot" style="background:#7a5a28"></div>After Projector: {{ getFlowAfterProjector(events[modelIdx]) }}</div>
                                <div class="arch-legend-item"><div class="arch-legend-dot" style="background:#5a2d82"></div>Multimodal Fusion</div>
                                <div class="arch-legend-item"><div class="arch-legend-dot" style="background:#8b6914"></div>LLM: {{ getFlowLLMName(events[modelIdx]) }}</div>
                            </div>
                        </div>
                    </div>
                    <div v-if="flowSelectedModels.length === 0" class="flow-placeholder">Search and select models to see their architecture flows.</div>
                </div>
            </div>

            <!-- EDIT PAGE -->
            <div v-else-if="currentPage === 'edit'">
                <h2>
                    <i class="fas fa-edit" style="margin-right: 6px; vertical-align: middle;"></i>
                    Edit VLM
                </h2>
                <div class="edit-search-bar">
                    <input type="text" v-model="editSearchQuery" placeholder="Search editable VLMs..." class="search-input" />
                </div>
                <div v-if="!editSelectedEvent" class="edit-list">
                    <div v-if="editableEvents.length === 0" class="flow-placeholder">No editable VLMs found. Only VLMs you added (edit=1) can be edited here.</div>
                    <div v-for="(evt, idx) in filteredEditableEvents" :key="'edit-'+idx" class="edit-list-item" @click="selectForEdit(evt)">
                        <span class="edit-item-title">{{ evt.title }}</span>
                        <span class="edit-item-meta">{{ evt.year }} · {{ evt.venue || 'No venue' }} · {{ evt.encoder || 'No encoder' }} · {{ evt.decoder || 'No decoder' }}</span>
                    </div>
                </div>
                <div v-else class="edit-form-container">
                    <div class="edit-form-header">
                        <h3>Editing: {{ editSelectedEvent.title }}</h3>
                        <button class="btn-secondary" @click="cancelEdit">← Back to list</button>
                    </div>
                    <div class="form-group">
                        <div><label>Venue</label><input v-model="editSelectedEvent.venue" /></div>
                        <div><label>Year</label><input v-model.number="editSelectedEvent.year" type="number" /></div>
                        <div><label>Month</label>
                            <select v-model="editSelectedEvent.month">
                                <option v-for="m in ['January','February','March','April','May','June','July','August','September','October','November','December']" :key="m" :value="m">{{ m }}</option>
                            </select>
                        </div>
                        <div><label>Day</label><input v-model.number="editSelectedEvent.day" type="number" min="1" max="31" /></div>
                    </div>
                    <div class="form-group">
                        <div style="grid-column: 1 / -1;"><label>Model Name</label><input v-model="editSelectedEvent.title" /></div>
                    </div>
                    <h4 class="form-section-title">Architecture</h4>
                    <div class="form-group">
                        <div><label>Before Encoder</label><input v-model="editSelectedEvent.before_encoder" /></div>
                        <div><label>Encoder</label><input v-model="editSelectedEvent.encoder" /></div>
                        <div><label>After Encoder</label><input v-model="editSelectedEvent.after_encoder" /></div>
                        <div><label>Text Encoder</label><input v-model="editSelectedEvent.text_encoder" /></div>
                    </div>
                    <div class="form-group">
                        <div><label>Projector</label><input v-model="editSelectedEvent.projector" /></div>
                        <div><label>After Projector</label><input v-model="editSelectedEvent.after_projector" /></div>
                        <div><label>Decoder</label><input v-model="editSelectedEvent.decoder" /></div>
                    </div>
                    <h4 class="form-section-title">Details</h4>
                    <div class="form-group">
                        <div><label>Size Params</label><input v-model="editSelectedEvent.size_params" /></div>
                        <div><label>FLOPs</label><input v-model="editSelectedEvent.flops" /></div>
                        <div><label>Code</label><input v-model="editSelectedEvent.code" /></div>
                        <div><label>CKPT</label><input v-model="editSelectedEvent.ckpt" /></div>
                    </div>
                    <div class="form-group">
                        <div><label>Quality</label>
                            <select v-model="editSelectedEvent.quality">
                                <option v-for="q in ['Excellent','Very Good','Good','Fair','Poor']" :key="q" :value="q">{{ q }}</option>
                            </select>
                        </div>
                        <div><label>Citations</label><input v-model="editSelectedEvent.citations" /></div>
                        <div style="grid-column: span 2;"><label>Notes</label><textarea v-model="editSelectedEvent.notes" rows="2"></textarea></div>
                    </div>
                    <h4 class="form-section-title">Benchmarks</h4>
                    <div class="form-group">
                        <div><label>MMMU</label><input v-model="editSelectedEvent.mmmu" /></div>
                        <div><label>MathVista</label><input v-model="editSelectedEvent.mathvista" /></div>
                        <div><label>VQAv2</label><input v-model="editSelectedEvent.vqav2" /></div>
                        <div><label>GQA</label><input v-model="editSelectedEvent.gqa" /></div>
                    </div>
                    <div class="form-group">
                        <div><label>VizWiz</label><input v-model="editSelectedEvent.vizwiz" /></div>
                        <div><label>SQA</label><input v-model="editSelectedEvent.sqa" /></div>
                        <div><label>TextVQA</label><input v-model="editSelectedEvent.textvqa" /></div>
                        <div><label>POPE</label><input v-model="editSelectedEvent.pope" /></div>
                    </div>
                    <div class="form-group">
                        <div><label>MME</label><input v-model="editSelectedEvent.mme" /></div>
                        <div><label>MM-Bench</label><input v-model="editSelectedEvent.mmbench" /></div>
                        <div><label>MM-Bench-CN</label><input v-model="editSelectedEvent.mmbench_cn" /></div>
                        <div><label>SEED-IMG</label><input v-model="editSelectedEvent.seed_img" /></div>
                    </div>
                    <div class="form-group">
                        <div><label>LLaVA-Bench-Wild</label><input v-model="editSelectedEvent.llavabench_wild" /></div>
                        <div><label>MM-Vet</label><input v-model="editSelectedEvent.mmvet" /></div>
                    </div>
                    <div class="edit-actions">
                        <button class="btn-primary" @click="saveEdit"><i class="fas fa-save"></i> Save Changes</button>
                        <button class="btn-secondary" @click="cancelEdit">Cancel</button>
                        <button class="btn-danger" @click="showDeleteConfirm = true" style="margin-left:auto;background:linear-gradient(135deg,#e53935,#b71c1c);color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-trash-alt"></i> Delete VLM</button>
                    </div>

                    <!-- Delete Confirmation Modal -->
                    <div v-if="showDeleteConfirm" class="modal show" @click.self="showDeleteConfirm = false">
                        <div class="modal-content" style="max-width:420px;text-align:center;padding:36px 32px;">
                            <div style="font-size:42px;margin-bottom:16px;"><i class="fas fa-exclamation-triangle" style="color:#e53935;"></i></div>
                            <h3 style="color:var(--text-primary);margin-bottom:8px;">Delete VLM?</h3>
                            <p style="color:var(--text-secondary);margin-bottom:24px;font-size:14px;">Are you sure you want to delete <strong>{{ editSelectedEvent.title }}</strong>? This action cannot be undone.</p>
                            <div style="display:flex;gap:12px;justify-content:center;">
                                <button @click="showDeleteConfirm = false" style="padding:9px 22px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);cursor:pointer;font-weight:600;font-size:13px;">Cancel</button>
                                <button @click="confirmDeleteVlm" style="padding:9px 22px;border-radius:6px;border:none;background:linear-gradient(135deg,#e53935,#b71c1c);color:#fff;cursor:pointer;font-weight:600;font-size:13px;"><i class="fas fa-trash-alt"></i> Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TIMELINE PAGE -->
            <div v-else-if="currentPage === 'timeline'">                <!-- Timeline Layout Options -->
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

                    <div class="tl-sort-controls">
                        <label class="tl-sort-label">Sort by:</label>
                        <select v-model="timelineSortBy" class="tl-sort-select">
                            <option value="date">Date</option>
                            <option value="name">Name</option>
                            <option value="params">Parameters</option>
                            <option value="citations">Citations</option>
                            <option value="quality">Quality</option>
                            <option value="venue">Venue</option>
                        </select>
                        <button class="tl-sort-dir-btn" @click="timelineSortDir = timelineSortDir === 'asc' ? 'desc' : 'asc'" :title="timelineSortDir === 'asc' ? 'Ascending' : 'Descending'">
                            {{ timelineSortDir === 'asc' ? '↑' : '↓' }}
                        </button>
                    </div>

                    <div class="tl-sort-controls">
                        <label class="tl-sort-label">Filter:</label>
                        <select v-model="timelineFilterYear" class="tl-sort-select">
                            <option value="">All Years</option>
                            <option v-for="y in uniqueYears" :key="y" :value="y">{{ y }}</option>
                        </select>
                        <select v-model="timelineFilterVenue" class="tl-sort-select">
                            <option value="">All Venues</option>
                            <option v-for="v in uniqueVenues" :key="v" :value="v">{{ v }}</option>
                        </select>
                    </div>
                </div>
                <!-- Controls Section -->
                <div class="controls-section">
                    <button class="btn-success" @click="exportCSV"><i class="fas fa-save"></i> Export CSV</button>
                </div>

                <!-- Timeline Section -->
                <div class="timeline-section" v-if="sortedEvents.length > 0">
                    <!-- VERTICAL TIMELINE -->
                    <div v-if="timelineOrientation === 'vertical'" class="timeline timeline-vertical">
                        <div class="timeline-items items-vertical">
                            <div 
                                v-for="(group, gIndex) in groupedEvents" 
                                :key="gIndex"
                                class="timeline-item"
                            >
                                <div class="timeline-marker"></div>
                                <div class="timeline-content">
                                    <div class="timeline-year">{{ group.firstEvent.year }}</div>
                                    <div class="timeline-title">{{ group.title }}</div>
                                    <div class="timeline-venue" v-if="group.firstEvent.venue"><i class="fas fa-building"></i> {{ group.firstEvent.venue }}</div>
                                    <div class="timeline-date">
                                        <i class="fas fa-calendar-alt"></i> {{ group.firstEvent.month }} {{ group.firstEvent.day || '' }}
                                    </div>
                                    <div class="variant-list">
                                        <div v-for="(v, vi) in group.variants" :key="vi" class="variant-chip" @click="openModal(v)">
                                            <span class="variant-name">{{ v.title }}</span>
                                            <span class="variant-params" v-if="v.size_params">{{ v.size_params }}</span>
                                        </div>
                                    </div>
                                    <div class="timeline-description" v-if="group.firstEvent.notes">
                                        {{ group.firstEvent.notes }}
                                    </div>
                                    <div class="timeline-details" v-if="group.firstEvent.encoder">
                                        <strong>Tech:</strong> {{ group.firstEvent.before_encoder ? group.firstEvent.before_encoder + ' → ' : '' }}{{ group.firstEvent.encoder }}{{ group.firstEvent.after_encoder ? ' → ' + group.firstEvent.after_encoder : '' }} | {{ group.firstEvent.projector || 'N/A' }}{{ group.firstEvent.after_projector ? ' → ' + group.firstEvent.after_projector : '' }} | {{ group.firstEvent.decoder || 'N/A' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- HORIZONTAL TIMELINE (zigzag staircase) -->
                    <div v-else class="ht-wrapper">
                        <div class="ht-scroll">
                            <template v-for="(item, idx) in horizontalTimelineItems" :key="idx">
                                <div v-if="item.type === 'year'" class="ht-year-marker">
                                    <span>{{ item.year }}</span>
                                </div>
                                <div v-else class="ht-item"
                                     :class="(item.modelIndex % 2 === 0 ? 'ht-above' : 'ht-below') + ' ht-level-' + (Math.floor(item.modelIndex / 2) % 4)"
                                     :style="{ '--dot-color': dotColors[item.modelIndex % dotColors.length], '--vc': item.group.variants.length }">
                                    <div class="ht-name-group">
                                        <div v-for="(v, vi) in item.group.variants" :key="vi" 
                                             class="ht-variant" @click="openModal(v)">
                                            <span class="ht-variant-title">{{ v.title }}</span>
                                            <span class="ht-variant-params" v-if="v.size_params">{{ v.size_params }}</span>
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
                    <h3>No VLMs yet</h3>
                    <p>Add your first VLM using the form above or import data from a CSV file.</p>
                </div>
            </div>

            <!-- ADD VLM PAGE -->
            <div v-else-if="currentPage === 'add'">
                <!-- Form Section -->
                <div class="form-section">
                    <h2>Add New VLM</h2>
                    <div class="form-group">
                        <div>
                            <label>Venue</label>
                            <input 
                                v-model="newEvent.venue" 
                                type="text" 
                                placeholder="e.g., OpenAI"
                            >
                        </div>
                        <div>
                            <label>Year</label>
                            <input 
                                v-model.number="newEvent.year" 
                                type="number" 
                                placeholder="e.g., 2021"
                            >
                        </div>
                        <div>
                            <label>Month</label>
                            <select v-model="newEvent.month">
                                <option v-for="m in ['January','February','March','April','May','June','July','August','September','October','November','December']" :key="m" :value="m">{{ m }}</option>
                            </select>
                        </div>
                        <div>
                            <label>Day</label>
                            <input 
                                v-model.number="newEvent.day" 
                                type="number" 
                                placeholder="e.g., 15"
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <div style="grid-column: 1 / -1;">
                            <label>Model Name</label>
                            <input 
                                v-model="newEvent.title" 
                                type="text" 
                                placeholder="e.g., CLIP"
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <div>
                            <label>Before Encoder</label>
                            <input v-model="newEvent.before_encoder" type="text" placeholder="e.g., Patch Embed">
                        </div>
                        <div>
                            <label>Encoder</label>
                            <input v-model="newEvent.encoder" type="text" placeholder="e.g., ViT-L/14">
                        </div>
                        <div>
                            <label>After Encoder</label>
                            <input v-model="newEvent.after_encoder" type="text" placeholder="e.g., Layer Norm">
                        </div>
                        <div>
                            <label>Text Encoder</label>
                            <input v-model="newEvent.text_encoder" type="text" placeholder="e.g., BERT">
                        </div>
                    </div>
                    <div class="form-group">
                        <div>
                            <label>Projector</label>
                            <input v-model="newEvent.projector" type="text" placeholder="e.g., Linear">
                        </div>
                        <div>
                            <label>After Projector</label>
                            <input v-model="newEvent.after_projector" type="text" placeholder="e.g., LayerNorm">
                        </div>
                        <div>
                            <label>Decoder</label>
                            <input v-model="newEvent.decoder" type="text" placeholder="e.g., Transformer">
                        </div>
                    </div>

                    <div class="form-group">
                        <div>
                            <label>Size (Params)</label>
                            <input v-model="newEvent.size_params" type="text" placeholder="e.g., 427.6M">
                        </div>
                        <div>
                            <label>FLOPs</label>
                            <input v-model="newEvent.flops" type="text" placeholder="e.g., 1.6B">
                        </div>
                        <div>
                            <label>Code Link</label>
                            <input v-model="newEvent.code" type="url" placeholder="https://github.com/...">
                        </div>
                        <div>
                            <label>Checkpoint Link</label>
                            <input v-model="newEvent.ckpt" type="url" placeholder="https://huggingface.co/...">
                        </div>
                    </div>

                    <div class="form-group">
                        <div>
                            <label>Quality</label>
                            <select v-model="newEvent.quality">
                                <option>Excellent</option>
                                <option>Very Good</option>
                                <option>Good</option>
                                <option>Fair</option>
                            </select>
                        </div>
                        <div>
                            <label>Citations Count</label>
                            <input v-model.number="newEvent.citations" type="number" placeholder="e.g., 500">
                        </div>
                    </div>

                    <div class="form-group">
                        <div style="grid-column: 1 / -1;">
                            <label>Notes</label>
                            <textarea 
                                v-model="newEvent.notes" 
                                placeholder="Additional notes about this VLM..."
                            ></textarea>
                        </div>
                    </div>

                    <h3 style="margin: 20px 0 10px; color: var(--text-primary);">Benchmarks</h3>
                    <div class="form-group">
                        <div>
                            <label>MMMU</label>
                            <input v-model="newEvent.mmmu" type="text" placeholder="e.g., 35.8">
                        </div>
                        <div>
                            <label>MathVista</label>
                            <input v-model="newEvent.mathvista" type="text" placeholder="e.g., 34.6">
                        </div>
                        <div>
                            <label>VQAv2</label>
                            <input v-model="newEvent.vqav2" type="text" placeholder="e.g., 81.8">
                        </div>
                        <div>
                            <label>GQA</label>
                            <input v-model="newEvent.gqa" type="text" placeholder="e.g., 64.2">
                        </div>
                    </div>
                    <div class="form-group">
                        <div>
                            <label>VizWiz</label>
                            <input v-model="newEvent.vizwiz" type="text" placeholder="e.g., 57.6">
                        </div>
                        <div>
                            <label>SQA</label>
                            <input v-model="newEvent.sqa" type="text" placeholder="e.g., 70.1">
                        </div>
                        <div>
                            <label>TextVQA</label>
                            <input v-model="newEvent.textvqa" type="text" placeholder="e.g., 64.9">
                        </div>
                        <div>
                            <label>POPE</label>
                            <input v-model="newEvent.pope" type="text" placeholder="e.g., 86.5">
                        </div>
                    </div>
                    <div class="form-group">
                        <div>
                            <label>MME</label>
                            <input v-model="newEvent.mme" type="text" placeholder="e.g., 1519/332">
                        </div>
                        <div>
                            <label>MM-Bench</label>
                            <input v-model="newEvent.mmbench" type="text" placeholder="e.g., 67.4">
                        </div>
                        <div>
                            <label>MM-Bench-CN</label>
                            <input v-model="newEvent.mmbench_cn" type="text" placeholder="e.g., 60.6">
                        </div>
                        <div>
                            <label>SEED-IMG</label>
                            <input v-model="newEvent.seed_img" type="text" placeholder="e.g., 70.2">
                        </div>
                    </div>
                    <div class="form-group">
                        <div>
                            <label>LLaVA-Bench-Wild</label>
                            <input v-model="newEvent.llavabench_wild" type="text" placeholder="e.g., 81.6">
                        </div>
                        <div>
                            <label>MM-Vet</label>
                            <input v-model="newEvent.mmvet" type="text" placeholder="e.g., 43.9">
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn-primary" @click="addEvent">Add VLM</button>
                        <button class="btn-secondary" @click="clearForm">Clear</button>
                    </div>
                </div>
            </div>

            <!-- COMPARISON PAGE -->
            <div v-else-if="currentPage === 'comparison'">
                <div class="comparison-section">
                    <!-- 1. Search & Selection -->
                    <div class="model-selector">
                        <h3>Select Models to Compare (up to 5)</h3>

                        <!-- Selected chips -->
                        <div class="bench-chips" v-if="selectedModels.length > 0">
                            <span class="bench-chip" v-for="idx in selectedModels" :key="idx">
                                {{ events[idx].title }}
                                <button class="bench-chip-remove" @click="removeFromComparison(idx)">&times;</button>
                            </span>
                            <button class="btn-small btn-secondary" @click="selectedModels = []">Clear all</button>
                        </div>

                        <!-- Search input -->
                        <input
                            type="text"
                            class="bench-search-input"
                            v-model="compareSearchQuery"
                            placeholder="Search models by name, encoder, decoder..."
                        >

                        <!-- Filtered model list -->
                        <div class="bench-model-dropdown">
                            <label
                                v-for="item in filteredCompareModels"
                                :key="item.index"
                                class="model-checkbox"
                                :class="{ selected: selectedModels.includes(item.index) }"
                            >
                                <input
                                    type="checkbox"
                                    :value="item.index"
                                    v-model.number="selectedModels"
                                    @change="limitSelection"
                                >
                                {{ item.event.title }}
                            </label>
                            <p v-if="filteredCompareModels.length === 0" class="bench-no-results">No models match your search.</p>
                        </div>
                    </div>

                    <!-- 2. Mini Timeline for Selected VLMs -->
                    <div v-if="selectedModels.length > 0" class="compare-mini-timeline">
                        <h3 class="compare-section-title">Timeline</h3>
                        <div class="ht-wrapper">
                            <div class="ht-scroll">
                                <template v-for="(item, idx) in compareTimelineItems" :key="idx">
                                    <div v-if="item.type === 'year'" class="ht-year-marker">
                                        <span>{{ item.year }}</span>
                                    </div>
                                    <div v-else class="ht-item"
                                         :class="item.modelIndex % 2 === 0 ? 'ht-above' : 'ht-below'"
                                         :style="{ '--dot-color': dotColors[item.modelIndex % dotColors.length], '--vc': 1 }">
                                        <div class="ht-name-group">
                                            <div class="ht-variant" @click="openModal(events[item.idx])">
                                                <span class="ht-variant-title">{{ events[item.idx].title }}</span>
                                                <span class="ht-variant-params" v-if="events[item.idx].size_params">{{ events[item.idx].size_params }}</span>
                                            </div>
                                        </div>
                                        <div class="ht-dot"></div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Scatter Chart -->
                    <div v-if="selectedModels.length > 0" class="scatter-section">
                        <h3 class="compare-section-title">Chart</h3>
                        <div class="scatter-axis-row">
                            <label class="scatter-axis-label">
                                X Axis:
                                <select v-model="scatterXProp" class="scatter-axis-select">
                                    <option v-for="p in scatterProperties" :key="p.key" :value="p.key">{{ p.label }}</option>
                                </select>
                            </label>
                            <label class="scatter-axis-label">
                                Y Axis:
                                <select v-model="scatterYProp" class="scatter-axis-select">
                                    <option v-for="p in scatterProperties" :key="p.key" :value="p.key">{{ p.label }}</option>
                                </select>
                            </label>
                        </div>
                        <p class="scatter-hint" v-if="scatterPlottableModels.length < selectedModels.length">
                            {{ selectedModels.length - scatterPlottableModels.length }} model(s) hidden (missing data for selected axes).
                        </p>
                        <div class="scatter-canvas-wrap">
                            <canvas ref="scatterCanvas"></canvas>
                        </div>
                        <p v-if="scatterPlottableModels.length === 0" class="scatter-hint">None of the selected models have data for both selected properties.</p>
                    </div>

                    <!-- 4. Comparison Table -->
                    <table v-if="selectedModels.length > 0" class="comparison-table">
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th v-for="modelIdx in selectedModels" :key="modelIdx">
                                    {{ events[modelIdx].title }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="row-header">Venue</td>
                                <td v-for="modelIdx in selectedModels" :key="'venue-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].venue || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Year</td>
                                <td v-for="modelIdx in selectedModels" :key="'year-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].year }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Release Date</td>
                                <td v-for="modelIdx in selectedModels" :key="'date-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].month }} {{ events[modelIdx].day || '' }}
                                </td>
                            </tr>
                            <tr v-if="selectedModels.some(i => events[i].before_encoder)">
                                <td class="row-header">Before Encoder</td>
                                <td v-for="modelIdx in selectedModels" :key="'benc-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].before_encoder || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Encoder</td>
                                <td v-for="modelIdx in selectedModels" :key="'encoder-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].encoder || '-' }}
                                </td>
                            </tr>
                            <tr v-if="selectedModels.some(i => events[i].after_encoder)">
                                <td class="row-header">After Encoder</td>
                                <td v-for="modelIdx in selectedModels" :key="'aenc-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].after_encoder || '-' }}
                                </td>
                            </tr>
                            <tr v-if="selectedModels.some(i => events[i].text_encoder)">
                                <td class="row-header">Text Encoder</td>
                                <td v-for="modelIdx in selectedModels" :key="'tenc-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].text_encoder || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Projector</td>
                                <td v-for="modelIdx in selectedModels" :key="'proj-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].projector || '-' }}
                                </td>
                            </tr>
                            <tr v-if="selectedModels.some(i => events[i].after_projector)">
                                <td class="row-header">After Projector</td>
                                <td v-for="modelIdx in selectedModels" :key="'aproj-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].after_projector || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Decoder</td>
                                <td v-for="modelIdx in selectedModels" :key="'decoder-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].decoder || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Size (Params)</td>
                                <td v-for="modelIdx in selectedModels" :key="'size-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].size_params || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">FLOPs</td>
                                <td v-for="modelIdx in selectedModels" :key="'flops-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].flops || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Code Available</td>
                                <td v-for="modelIdx in selectedModels" :key="'code-' + modelIdx" class="value-cell" :class="{ yes: events[modelIdx].code === 'Yes', no: events[modelIdx].code === 'No' }">
                                    {{ events[modelIdx].code }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Checkpoint Available</td>
                                <td v-for="modelIdx in selectedModels" :key="'ckpt-' + modelIdx" class="value-cell" :class="{ yes: events[modelIdx].ckpt === 'Yes', no: events[modelIdx].ckpt === 'No' }">
                                    {{ events[modelIdx].ckpt }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Quality</td>
                                <td v-for="modelIdx in selectedModels" :key="'quality-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].quality || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Citations</td>
                                <td v-for="modelIdx in selectedModels" :key="'citations-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].citations || '-' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="row-header">Notes</td>
                                <td v-for="modelIdx in selectedModels" :key="'notes-' + modelIdx" class="value-cell">
                                    {{ events[modelIdx].notes || '-' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Empty State -->
                    <div v-if="selectedModels.length === 0" class="empty-state">
                        <h3>Select models to compare</h3>
                        <p>Choose 2-5 models from the list above to see their comparison.</p>
                    </div>
                </div>
            </div>

            <!-- ALL VLMs PAGE -->
            <div v-else-if="currentPage === 'all'">
                <div class="all-section">
                    <!-- Search Box -->
                    <div class="all-search-bar">
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            placeholder="Search by name, venue, encoder, decoder, notes..."
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
                            <label>Quality</label>
                            <select v-model="filterQuality">
                                <option value="">All Qualities</option>
                                <option>Excellent</option>
                                <option>Very Good</option>
                                <option>Good</option>
                                <option>Fair</option>
                            </select>
                        </div>
                        <div class="all-filter">
                            <label>Code</label>
                            <select v-model="filterCode">
                                <option value="">All</option>
                                <option value="exists">Exists</option>
                                <option value="na">N/A</option>
                            </select>
                        </div>
                        <div class="all-filter">
                            <label>Checkpoint</label>
                            <select v-model="filterCkpt">
                                <option value="">All</option>
                                <option value="exists">Exists</option>
                                <option value="na">N/A</option>
                            </select>
                        </div>
                        <button class="btn-secondary btn-small" @click="clearFilters" style="align-self: flex-end; margin-bottom: 2px;">Clear Filters</button>
                    </div>

                    <!-- Results count -->
                    <div class="all-results-count">
                        Showing <strong>{{ filteredEvents.length }}</strong> of <strong>{{ events.length }}</strong> models
                    </div>

                    <!-- Data Table -->
                    <div class="all-table-wrapper" v-if="filteredEvents.length > 0">
                        <table class="all-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th class="sortable" :class="{ active: sortColumn === 'title' }" @click="toggleSort('title')">
                                        Name <span class="sort-icon">{{ sortColumn === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'venue' }" @click="toggleSort('venue')">
                                        Venue <span class="sort-icon">{{ sortColumn === 'venue' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'year' }" @click="toggleSort('year')">
                                        Year <span class="sort-icon">{{ sortColumn === 'year' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'month' }" @click="toggleSort('month')">
                                        Month <span class="sort-icon">{{ sortColumn === 'month' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'encoder' }" @click="toggleSort('encoder')">
                                        Encoder <span class="sort-icon">{{ sortColumn === 'encoder' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'text_encoder' }" @click="toggleSort('text_encoder')">
                                        Text Enc. <span class="sort-icon">{{ sortColumn === 'text_encoder' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'projector' }" @click="toggleSort('projector')">
                                        Projector <span class="sort-icon">{{ sortColumn === 'projector' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'decoder' }" @click="toggleSort('decoder')">
                                        Decoder <span class="sort-icon">{{ sortColumn === 'decoder' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'size_params' }" @click="toggleSort('size_params')">
                                        Params <span class="sort-icon">{{ sortColumn === 'size_params' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'flops' }" @click="toggleSort('flops')">
                                        FLOPs <span class="sort-icon">{{ sortColumn === 'flops' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'code' }" @click="toggleSort('code')">
                                        Code <span class="sort-icon">{{ sortColumn === 'code' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'ckpt' }" @click="toggleSort('ckpt')">
                                        CKPT <span class="sort-icon">{{ sortColumn === 'ckpt' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'quality' }" @click="toggleSort('quality')">
                                        Quality <span class="sort-icon">{{ sortColumn === 'quality' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th>Notes</th>
                                    <th class="sortable" :class="{ active: sortColumn === 'mmmu' }" @click="toggleSort('mmmu')">
                                        MMMU <span class="sort-icon">{{ sortColumn === 'mmmu' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'mathvista' }" @click="toggleSort('mathvista')">
                                        MathVista <span class="sort-icon">{{ sortColumn === 'mathvista' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'vqav2' }" @click="toggleSort('vqav2')">
                                        VQAv2 <span class="sort-icon">{{ sortColumn === 'vqav2' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'gqa' }" @click="toggleSort('gqa')">
                                        GQA <span class="sort-icon">{{ sortColumn === 'gqa' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'vizwiz' }" @click="toggleSort('vizwiz')">
                                        VizWiz <span class="sort-icon">{{ sortColumn === 'vizwiz' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'sqa' }" @click="toggleSort('sqa')">
                                        SQA <span class="sort-icon">{{ sortColumn === 'sqa' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'textvqa' }" @click="toggleSort('textvqa')">
                                        TextVQA <span class="sort-icon">{{ sortColumn === 'textvqa' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'pope' }" @click="toggleSort('pope')">
                                        POPE <span class="sort-icon">{{ sortColumn === 'pope' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'mme' }" @click="toggleSort('mme')">
                                        MME <span class="sort-icon">{{ sortColumn === 'mme' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'mmbench' }" @click="toggleSort('mmbench')">
                                        MM-Bench <span class="sort-icon">{{ sortColumn === 'mmbench' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'mmbench_cn' }" @click="toggleSort('mmbench_cn')">
                                        MM-B-CN <span class="sort-icon">{{ sortColumn === 'mmbench_cn' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'seed_img' }" @click="toggleSort('seed_img')">
                                        SEED <span class="sort-icon">{{ sortColumn === 'seed_img' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'llavabench_wild' }" @click="toggleSort('llavabench_wild')">
                                        LLaVA-W <span class="sort-icon">{{ sortColumn === 'llavabench_wild' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                    <th class="sortable" :class="{ active: sortColumn === 'mmvet' }" @click="toggleSort('mmvet')">
                                        MM-Vet <span class="sort-icon">{{ sortColumn === 'mmvet' ? (sortDirection === 'asc' ? '▲' : '▼') : '▴' }}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(event, idx) in sortedFilteredEvents" :key="idx" @click="openModal(event)" class="all-table-row">
                                    <td>{{ idx + 1 }}</td>
                                    <td class="all-td-name" :title="event.title">{{ event.title }}</td>
                                    <td class="all-td-trunc" :title="event.venue">{{ event.venue || '-' }}</td>
                                    <td>{{ event.year }}</td>
                                    <td>{{ event.month || '-' }}</td>
                                    <td class="all-td-trunc" :title="event.encoder">{{ event.encoder || '-' }}</td>
                                    <td class="all-td-trunc" :title="event.text_encoder">{{ event.text_encoder || '-' }}</td>
                                    <td class="all-td-trunc" :title="event.projector">{{ event.projector || '-' }}</td>
                                    <td class="all-td-trunc" :title="event.decoder">{{ event.decoder || '-' }}</td>
                                    <td>{{ event.size_params || '-' }}</td>
                                    <td>{{ event.flops || '-' }}</td>
                                    <td class="all-td-link" :class="{ yes: event.code === 'Yes', no: event.code === 'No' }" :title="event.code">{{ event.code || '-' }}</td>
                                    <td class="all-td-link" :class="{ yes: event.ckpt === 'Yes', no: event.ckpt === 'No' }" :title="event.ckpt">{{ event.ckpt || '-' }}</td>
                                    <td>{{ event.quality || '-' }}</td>
                                    <td class="all-td-notes" :title="event.notes">{{ event.notes || '-' }}</td>
                                    <td class="all-td-bench">{{ event.mmmu || '-' }}</td>
                                    <td class="all-td-bench">{{ event.mathvista || '-' }}</td>
                                    <td class="all-td-bench">{{ event.vqav2 || '-' }}</td>
                                    <td class="all-td-bench">{{ event.gqa || '-' }}</td>
                                    <td class="all-td-bench">{{ event.vizwiz || '-' }}</td>
                                    <td class="all-td-bench">{{ event.sqa || '-' }}</td>
                                    <td class="all-td-bench">{{ event.textvqa || '-' }}</td>
                                    <td class="all-td-bench">{{ event.pope || '-' }}</td>
                                    <td class="all-td-bench">{{ event.mme || '-' }}</td>
                                    <td class="all-td-bench">{{ event.mmbench || '-' }}</td>
                                    <td class="all-td-bench">{{ event.mmbench_cn || '-' }}</td>
                                    <td class="all-td-bench">{{ event.seed_img || '-' }}</td>
                                    <td class="all-td-bench">{{ event.llavabench_wild || '-' }}</td>
                                    <td class="all-td-bench">{{ event.mmvet || '-' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else class="empty-state">
                        <h3>No matching models</h3>
                        <p>Try adjusting your search or filters.</p>
                    </div>
                </div>
            </div>

            <!-- BENCHMARKS PAGE -->
            <div v-else-if="currentPage === 'benchmarks'">
                <div class="bench-page">
                                        <!-- Radar Chart -->
                                        <!-- Removed duplicate radar chart at top -->
                    <h2 class="bench-page-title">
                        <i class="fas fa-trophy" style="margin-right: 6px; vertical-align: middle;"></i>
                        Benchmark Comparison
                    </h2>

                    <!-- Model selector -->
                    <div class="bench-selector">
                        <h3>Select Models to Compare</h3>
                        <p class="bench-hint">Only models with benchmark data are shown. Search to filter.</p>
                        
                        <!-- Selected chips -->
                        <div class="bench-chips" v-if="benchSelectedModels.length > 0">
                            <span class="bench-chip" v-for="idx in benchSelectedModels" :key="idx">
                                {{ modelsWithBenchmarks[idx].title }} ({{ modelsWithBenchmarks[idx].size_params }})
                                <button class="bench-chip-remove" @click="benchSelectedModels = benchSelectedModels.filter(i => i !== idx)">&times;</button>
                            </span>
                            <button class="btn-small btn-secondary" @click="benchSelectedModels = []">Clear all</button>
                        </div>

                        <!-- Search input -->
                        <input 
                            type="text"
                            class="bench-search-input"
                            v-model="benchSearchQuery"
                            placeholder="Search models by name, encoder, decoder..."
                        >

                        <!-- Filtered model list -->
                        <div class="bench-model-dropdown">
                            <label 
                                v-for="item in filteredBenchModels" 
                                :key="item.index"
                                class="model-checkbox"
                                :class="{ selected: benchSelectedModels.includes(item.index) }"
                            >
                                <input 
                                    type="checkbox"
                                    :value="item.index"
                                    v-model.number="benchSelectedModels"
                                >
                                {{ item.event.title }} ({{ item.event.size_params }})
                            </label>
                            <p v-if="filteredBenchModels.length === 0" class="bench-no-results">No models match your search.</p>
                        </div>
                    </div>

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
                                        Model <span v-if="benchSortKey === 'title'">{{ benchSortDir === 'asc' ? '▲' : '▼' }}</span>
                                    </th>
                                    <th class="bench-th-size sortable-header" @click="toggleBenchSort('size_params')">
                                        Size <span v-if="benchSortKey === 'size_params'">{{ benchSortDir === 'asc' ? '▲' : '▼' }}</span>
                                    </th>
                                    <th v-for="b in selectedBenchmarkList" :key="b.key" class="sortable-header" @click="toggleBenchSort(b.key)">
                                        {{ b.label }} <span v-if="benchSortKey === b.key">{{ benchSortDir === 'asc' ? '▲' : '▼' }}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="idx in sortedBenchModels" :key="idx">
                                    <td class="bench-td-model">{{ modelsWithBenchmarks[idx].title }}</td>
                                    <td class="bench-td-size">{{ modelsWithBenchmarks[idx].size_params }}</td>
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
                                    <span class="bench-bar-name">{{ modelsWithBenchmarks[idx].title }} ({{ modelsWithBenchmarks[idx].size_params }})</span>
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
                        <h3>Select models to compare benchmarks</h3>
                        <p>Choose models from the list above.</p>
                    </div>
                </div>
            </div>

            <!-- Modal for Details -->
            <div class="modal" :class="{ show: showModal }" @click.self="closeModal">
                <div class="modal-content" v-if="selectedEvent">
                    <div class="modal-header">
                        <h2 class="modal-title">{{ selectedEvent.title }}</h2>
                        <button class="modal-close" @click="closeModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-field">
                            <div class="modal-field-label">Venue</div>
                            <div class="modal-field-value">{{ selectedEvent.venue || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Year</div>
                            <div class="modal-field-value accent">{{ selectedEvent.year }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Month</div>
                            <div class="modal-field-value">{{ selectedEvent.month || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Day</div>
                            <div class="modal-field-value">{{ selectedEvent.day || '-' }}</div>
                        </div>
                        <div class="modal-field" v-if="selectedEvent.before_encoder">
                            <div class="modal-field-label">Before Encoder</div>
                            <div class="modal-field-value">{{ selectedEvent.before_encoder }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Encoder</div>
                            <div class="modal-field-value">{{ selectedEvent.encoder || '-' }}</div>
                        </div>
                        <div class="modal-field" v-if="selectedEvent.after_encoder">
                            <div class="modal-field-label">After Encoder</div>
                            <div class="modal-field-value">{{ selectedEvent.after_encoder }}</div>
                        </div>
                        <div class="modal-field" v-if="selectedEvent.text_encoder">
                            <div class="modal-field-label">Text Encoder</div>
                            <div class="modal-field-value">{{ selectedEvent.text_encoder }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Projector</div>
                            <div class="modal-field-value">{{ selectedEvent.projector || '-' }}</div>
                        </div>
                        <div class="modal-field" v-if="selectedEvent.after_projector">
                            <div class="modal-field-label">After Projector</div>
                            <div class="modal-field-value">{{ selectedEvent.after_projector }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Decoder</div>
                            <div class="modal-field-value">{{ selectedEvent.decoder || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Size Params</div>
                            <div class="modal-field-value accent">{{ selectedEvent.size_params || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">FLOPs</div>
                            <div class="modal-field-value">{{ selectedEvent.flops || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Quality</div>
                            <div class="modal-field-value accent">{{ selectedEvent.quality || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Code Available</div>
                            <div class="modal-field-value">{{ selectedEvent.code || '-' }}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Checkpoint</div>
                            <div class="modal-field-value">{{ selectedEvent.ckpt || '-' }}</div>
                        </div>
                        <div class="modal-field modal-full" v-if="hasBenchmarks(selectedEvent)">
                            <div class="modal-field-label">Benchmarks</div>
                            <table class="modal-bench-table">
                                <thead>
                                    <tr>
                                        <th>Benchmark</th>
                                        <th>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template v-for="b in benchmarkList" :key="b.key">
                                        <tr v-if="selectedEvent[b.key] && selectedEvent[b.key] !== '-'">
                                            <td>{{ b.label }}</td>
                                            <td>{{ formatBenchVal(selectedEvent[b.key], b.key) }}</td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                        <div class="modal-field modal-full">
                            <div class="modal-field-label">Notes</div>
                            <div class="modal-field-value modal-notes" v-if="selectedEvent.notes">{{ selectedEvent.notes }}</div>
                            <div v-else class="modal-field-value">-</div>
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
            compareSearchQuery: '',
            currentPage: 'timeline',
            darkMode: false,
            timelineOrientation: 'horizontal',
            timelineSortBy: 'date',
            timelineSortDir: 'asc',
            timelineFilterYear: '',
            timelineFilterVenue: '',
            dotColors: [
                '#667eea', '#e84393', '#00b894', '#fd79a8', '#6c5ce7',
                '#00cec9', '#e17055', '#0984e3', '#d63031', '#fdcb6e',
                '#a29bfe', '#55efc4', '#fab1a0', '#74b9ff', '#ff7675',
                '#636e72', '#81ecec'
            ],
            searchQuery: '',
            filterYear: '',
            filterVenue: '',
            filterQuality: '',
            filterCode: '',
            filterCkpt: '',
            sortColumn: '',
            sortDirection: 'asc',
            benchSelectedModels: [],
            benchSearchQuery: '',
            scatterXProp: 'size_params',
            scatterYProp: 'mmvet',
            benchSortKey: '',
            benchSortDir: 'desc',
            benchSelectedBenchmarks: ['mmmu', 'mathvista', 'vqav2', 'gqa', 'textvqa', 'pope', 'mme', 'mmbench', 'mmvet'],
            benchmarkList: [
                { key: 'mmmu', label: 'MMMU' },
                { key: 'mathvista', label: 'MathVista' },
                { key: 'vqav2', label: 'VQAv2' },
                { key: 'gqa', label: 'GQA' },
                { key: 'vizwiz', label: 'VizWiz' },
                { key: 'sqa', label: 'SQA' },
                { key: 'textvqa', label: 'TextVQA' },
                { key: 'pope', label: 'POPE' },
                { key: 'mme', label: 'MME' },
                { key: 'mmbench', label: 'MM-Bench' },
                { key: 'mmbench_cn', label: 'MM-Bench-CN' },
                { key: 'seed_img', label: 'SEED-IMG' },
                { key: 'llavabench_wild', label: 'LLaVA-Wild' },
                { key: 'mmvet', label: 'MM-Vet' }
            ],
            flowSelectedModels: [],
            flowSearchQuery: '',
            flowDropdownOpen: false,
            showModal: false,
            showDeleteConfirm: false,
            selectedEvent: null,
            editSearchQuery: '',
            editSelectedEvent: null,
            newEvent: {
                venue: '',
                year: new Date().getFullYear(),
                month: '',
                day: '',
                title: '',
                before_encoder: '',
                encoder: '',
                after_encoder: '',
                text_encoder: '',
                projector: '',
                after_projector: '',
                decoder: '',
                size_params: '',
                flops: '',
                code: '',
                ckpt: '',
                quality: 'Very Good',
                citations: '',
                notes: '',
                mmmu: '', mathvista: '', vqav2: '', gqa: '', vizwiz: '', sqa: '',
                textvqa: '', pope: '', mme: '', mmbench: '', mmbench_cn: '',
                seed_img: '', llavabench_wild: '', mmvet: ''
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
                (e.title || '').toLowerCase().includes(q) ||
                (e.venue || '').toLowerCase().includes(q) ||
                (e.encoder || '').toLowerCase().includes(q) ||
                (e.decoder || '').toLowerCase().includes(q)
            );
        },
        sortedEvents() {
            const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const qualityOrder = ['Exceptional', 'Very Good', 'Good', 'Average', 'Below Average', 'Unknown'];
            const parseSize = (s) => {
                if (!s) return 0;
                const m = s.toString().match(/([\d.]+)\s*([KMBT]?)/i);
                if (!m) return 0;
                const num = parseFloat(m[1]);
                const unit = (m[2] || '').toUpperCase();
                const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
                return num * (mult[unit] || 1);
            };

            let filtered = [...this.events];
            if (this.timelineFilterYear) {
                filtered = filtered.filter(e => e.year === parseInt(this.timelineFilterYear));
            }
            if (this.timelineFilterVenue) {
                filtered = filtered.filter(e => e.venue === this.timelineFilterVenue);
            }

            const dir = this.timelineSortDir === 'asc' ? 1 : -1;
            const sortBy = this.timelineSortBy;

            return filtered.sort((a, b) => {
                if (sortBy === 'date') {
                    if (a.year !== b.year) return (a.year - b.year) * dir;
                    const mA = monthOrder.indexOf(a.month), mB = monthOrder.indexOf(b.month);
                    if (mA !== mB) return (mA - mB) * dir;
                    return ((a.day || 0) - (b.day || 0)) * dir;
                }
                if (sortBy === 'name') return dir * (a.title || '').localeCompare(b.title || '');
                if (sortBy === 'params') return dir * (parseSize(a.size_params) - parseSize(b.size_params));
                if (sortBy === 'citations') return dir * ((parseInt(a.citations) || 0) - (parseInt(b.citations) || 0));
                if (sortBy === 'quality') return dir * (qualityOrder.indexOf(a.quality || 'Unknown') - qualityOrder.indexOf(b.quality || 'Unknown'));
                if (sortBy === 'venue') return dir * (a.venue || '').localeCompare(b.venue || '');
                return 0;
            });
        },
        uniqueYears() {
            const years = [...new Set(this.events.map(e => e.year).filter(Boolean))];
            return years.sort((a, b) => a - b);
        },
        uniqueVenues() {
            const venues = [...new Set(this.events.map(e => e.venue).filter(Boolean))];
            return venues.sort();
        },
        groupedEvents() {
            const groups = [];
            const seen = new Map();
            for (const event of this.sortedEvents) {
                const key = event.title;
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
                const year = group.firstEvent.year;
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
                    const haystack = [e.title, e.venue, e.encoder, e.projector, e.decoder, e.notes, e.size_params, e.flops]
                        .filter(Boolean).join(' ').toLowerCase();
                    if (!haystack.includes(q)) return false;
                }
                if (this.filterYear && e.year !== parseInt(this.filterYear)) return false;
                if (this.filterVenue && e.venue !== this.filterVenue) return false;
                if (this.filterQuality && e.quality !== this.filterQuality) return false;
                if (this.filterCode === 'exists' && (!e.code || e.code === 'No' || e.code === '-')) return false;
                if (this.filterCode === 'na' && e.code && e.code !== 'No' && e.code !== '-') return false;
                if (this.filterCkpt === 'exists' && (!e.ckpt || e.ckpt === 'No' || e.ckpt === '-')) return false;
                if (this.filterCkpt === 'na' && e.ckpt && e.ckpt !== 'No' && e.ckpt !== '-') return false;
                return true;
            });
        },
        uniqueYears() {
            return [...new Set(this.events.map(e => e.year))].sort();
        },
        uniqueVenues() {
            return [...new Set(this.events.map(e => e.venue).filter(Boolean))].sort();
        },
        filteredCompareModels() {
            const q = this.compareSearchQuery.toLowerCase().trim();
            if (!q) return this.events.map((e, i) => ({ event: e, index: i }));
            return this.events
                .map((e, i) => ({ event: e, index: i }))
                .filter(({ event }) => {
                    const haystack = [event.title, event.size_params, event.encoder, event.decoder].filter(Boolean).join(' ').toLowerCase();
                    return haystack.includes(q);
                });
        },
        filteredFlowModels() {
            const q = this.flowSearchQuery.toLowerCase().trim();
            if (!q) return this.events.map((e, i) => ({ event: e, index: i }));
            return this.events
                .map((e, i) => ({ event: e, index: i }))
                .filter(({ event }) => {
                    const haystack = [event.title, event.size_params, event.encoder, event.decoder].filter(Boolean).join(' ').toLowerCase();
                    return haystack.includes(q);
                });
        },
        scatterProperties() {
            const base = [
                { key: 'size_params', label: 'Parameters', type: 'size' },
                { key: 'flops', label: 'FLOPs', type: 'size' },
                { key: 'citations', label: 'Citations', type: 'number' },
                { key: 'year', label: 'Year', type: 'number' }
            ];
            const benchProps = this.benchmarkList.map(b => ({ key: b.key, label: b.label, type: 'bench' }));
            return [...base, ...benchProps];
        },
        scatterPlottableModels() {
            const xDef = this.scatterProperties.find(p => p.key === this.scatterXProp);
            const yDef = this.scatterProperties.find(p => p.key === this.scatterYProp);
            if (!xDef || !yDef) return [];
            return this.selectedModels.map(idx => {
                const e = this.events[idx];
                const xVal = this.scatterParseVal(e, xDef);
                const yVal = this.scatterParseVal(e, yDef);
                if (xVal == null || yVal == null) return null;
                return { label: e.title, x: xVal, y: yVal };
            }).filter(Boolean);
        },
        compareTimelineItems() {
            if (this.selectedModels.length === 0) return [];
            const monthMap = { January:0, February:1, March:2, April:3, May:4, June:5,
                July:6, August:7, September:8, October:9, November:10, December:11 };
            const sorted = [...this.selectedModels].sort((a, b) => {
                const ea = this.events[a], eb = this.events[b];
                const ta = new Date(ea.year, monthMap[ea.month] || 0, ea.day || 1);
                const tb = new Date(eb.year, monthMap[eb.month] || 0, eb.day || 1);
                return ta - tb;
            });
            const items = [];
            let lastYear = null;
            sorted.forEach((idx, mi) => {
                const e = this.events[idx];
                if (e.year !== lastYear) {
                    items.push({ type: 'year', year: e.year });
                    lastYear = e.year;
                }
                items.push({ type: 'model', idx, modelIndex: mi });
            });
            return items;
        },
        modelsWithBenchmarks() {
            const benchKeys = this.benchmarkList.map(b => b.key);
            return this.sortedEvents.filter(e => benchKeys.some(k => e[k] && e[k] !== '-'));
        },
        filteredBenchModels() {
            const q = this.benchSearchQuery.toLowerCase().trim();
            if (!q) return this.modelsWithBenchmarks.map((e, i) => ({ event: e, index: i }));
            return this.modelsWithBenchmarks
                .map((e, i) => ({ event: e, index: i }))
                .filter(({ event }) => {
                    const haystack = [event.title, event.size_params, event.encoder, event.decoder].filter(Boolean).join(' ').toLowerCase();
                    return haystack.includes(q);
                });
        },
        selectedBenchmarkList() {
            return this.benchmarkList.filter(b => this.benchSelectedBenchmarks.includes(b.key));
        },
        sortedBenchModels() {
            if (!this.benchSortKey) return [...this.benchSelectedModels];
            const key = this.benchSortKey;
            const dir = this.benchSortDir === 'asc' ? 1 : -1;
            const parseSize = (s) => {
                if (!s) return 0;
                const m = s.toString().match(/([\d.]+)\s*([KMBT]?)/i);
                if (!m) return 0;
                const num = parseFloat(m[1]);
                const unit = (m[2] || '').toUpperCase();
                const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
                return num * (mult[unit] || 1);
            };
            return [...this.benchSelectedModels].sort((a, b) => {
                const ma = this.modelsWithBenchmarks[a];
                const mb = this.modelsWithBenchmarks[b];
                if (key === 'title') return dir * ma.title.localeCompare(mb.title);
                if (key === 'size_params') return dir * (parseSize(ma.size_params) - parseSize(mb.size_params));
                const va = this.parseBenchVal(ma[key], key);
                const vb = this.parseBenchVal(mb[key], key);
                return dir * ((isNaN(va) ? -1 : va) - (isNaN(vb) ? -1 : vb));
            });
        },
        sortedFilteredEvents() {
            if (!this.sortColumn) return this.filteredEvents;
            const col = this.sortColumn;
            const dir = this.sortDirection === 'asc' ? 1 : -1;
            const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const parseSize = (s) => {
                if (!s || s === 'Unknown' || s === '-') return 0;
                const match = s.toString().match(/([\d.]+)\s*([KMBT]?)/i);
                if (!match) return 0;
                const num = parseFloat(match[1]);
                const unit = (match[2] || '').toUpperCase();
                const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
                return num * (mult[unit] || 1);
            };
            return [...this.filteredEvents].sort((a, b) => {
                let va = a[col], vb = b[col];
                if (col === 'year') return (va - vb) * dir;
                if (col === 'month') return (monthOrder.indexOf(va) - monthOrder.indexOf(vb)) * dir;
                if (col === 'size_params' || col === 'flops') return (parseSize(va) - parseSize(vb)) * dir;
                va = (va || '').toString().toLowerCase();
                vb = (vb || '').toString().toLowerCase();
                return va.localeCompare(vb) * dir;
            });
        }
    },
    methods: {
        selectForEdit(evt) {
            this.editSelectedEvent = evt;
        },
        cancelEdit() {
            this.editSelectedEvent = null;
            this.showDeleteConfirm = false;
        },
        confirmDeleteVlm() {
            const title = this.editSelectedEvent.title;
            const idx = this.events.indexOf(this.editSelectedEvent);
            if (idx !== -1) {
                this.events.splice(idx, 1);
            }
            this.saveToServer();
            this.showDeleteConfirm = false;
            this.editSelectedEvent = null;
            this.showMessage(`VLM "${title}" deleted`, 'success');
        },
        async saveEdit() {
            await this.saveToServer();
            this.showMessage(`VLM "${this.editSelectedEvent.title}" updated!`, 'success');
            this.editSelectedEvent = null;
        },
        async addEvent() {
            if (!this.newEvent.title || !this.newEvent.year) {
                this.showMessage('Please fill in at least the year and model name', 'error');
                return;
            }

            this.events.push({
                venue: this.newEvent.venue,
                year: this.newEvent.year,
                month: this.newEvent.month || 'January',
                day: this.newEvent.day || null,
                title: this.newEvent.title,
                before_encoder: this.newEvent.before_encoder,
                encoder: this.newEvent.encoder,
                after_encoder: this.newEvent.after_encoder,
                text_encoder: this.newEvent.text_encoder,
                projector: this.newEvent.projector,
                after_projector: this.newEvent.after_projector,
                decoder: this.newEvent.decoder,
                size_params: this.newEvent.size_params,
                flops: this.newEvent.flops,
                code: this.newEvent.code,
                ckpt: this.newEvent.ckpt,
                quality: this.newEvent.quality,
                citations: this.newEvent.citations,
                notes: this.newEvent.notes,
                mmmu: this.newEvent.mmmu, mathvista: this.newEvent.mathvista,
                vqav2: this.newEvent.vqav2, gqa: this.newEvent.gqa,
                vizwiz: this.newEvent.vizwiz, sqa: this.newEvent.sqa,
                textvqa: this.newEvent.textvqa, pope: this.newEvent.pope,
                mme: this.newEvent.mme, mmbench: this.newEvent.mmbench,
                mmbench_cn: this.newEvent.mmbench_cn, seed_img: this.newEvent.seed_img,
                llavabench_wild: this.newEvent.llavabench_wild, mmvet: this.newEvent.mmvet,
                edit: '1'
            });

            await this.saveToServer();
            this.showMessage(`VLM "${this.newEvent.title}" added successfully!`, 'success');
            this.clearForm();
            this.currentPage = 'timeline';
        },
        clearForm() {
            this.newEvent = {
                venue: '',
                year: new Date().getFullYear(),
                month: '',
                day: '',
                title: '',
                before_encoder: '',
                encoder: '',
                after_encoder: '',
                text_encoder: '',
                projector: '',
                after_projector: '',
                decoder: '',
                size_params: '',
                flops: '',
                code: '',
                ckpt: '',
                quality: 'Very Good',
                citations: '',
                notes: '',
                mmmu: '', mathvista: '', vqav2: '', gqa: '', vizwiz: '', sqa: '',
                textvqa: '', pope: '', mme: '', mmbench: '', mmbench_cn: '',
                seed_img: '', llavabench_wild: '', mmvet: ''
            };
        },
        deleteEvent(index) {
            const title = this.sortedEvents[index].title;
            this.events.splice(this.events.indexOf(this.sortedEvents[index]), 1);
            this.selectedModels = this.selectedModels.filter(idx => idx !== this.events.indexOf(this.sortedEvents[index]));
            this.saveToServer();
            this.showMessage(`VLM "${title}" deleted`, 'success');
        },
        removeFromComparison(idx) {
            this.selectedModels = this.selectedModels.filter(i => i !== idx);
        },
        closeFlowDropdown(e) {
            const wrap = this.$refs.flowSearchWrap;
            if (wrap && !wrap.contains(e.target)) {
                this.flowDropdownOpen = false;
            }
        },
        toggleFlowModel(idx) {
            if (this.flowSelectedModels.includes(idx)) {
                this.flowSelectedModels = this.flowSelectedModels.filter(i => i !== idx);
            } else {
                if (this.flowSelectedModels.length >= 5) {
                    this.showMessage('Maximum 5 models can be displayed', 'error');
                    return;
                }
                this.flowSelectedModels.push(idx);
            }
            this.$nextTick(() => this.layoutFlowArrows());
        },
        openFlowDropdown() {
            this.flowSearchQuery = '';
            this.flowDropdownOpen = true;
        },
        getFlowEncoderName(event) {
            return event?.encoder || 'Unknown Encoder';
        },
        getFlowBeforeEncoder(event) {
            const v = (event?.before_encoder || '').trim();
            return (!v || v.toLowerCase() === 'none') ? '' : v;
        },
        getFlowAfterEncoder(event) {
            const v = (event?.after_encoder || '').trim();
            return (!v || v.toLowerCase() === 'none') ? '' : v;
        },
        getFlowTextEncoder(event) {
            const v = (event?.text_encoder || '').trim();
            return (!v || v.toLowerCase() === 'none') ? '' : v;
        },
        getFlowLLMName(event) {
            return event?.decoder || 'Unknown LLM';
        },
        getFlowProjectorName(event) {
            return event?.projector || 'Unknown Projector';
        },
        getFlowAfterProjector(event) {
            const v = (event?.after_projector || '').trim();
            return (!v || v.toLowerCase() === 'none') ? '' : v;
        },
        getFlowEncoderBlocks(event) {
            const enc = (event?.encoder || '').toLowerCase();
            if (enc.includes('bigg') || enc.includes('6b') || enc.includes('eva')) return 5;
            if (enc.includes('vit-h') || enc.includes('internvit') || enc.includes('vit-l')) return 4;
            return 3;
        },
        getFlowTextEncoderBlocks(event) {
            const te = (event?.text_encoder || '').toLowerCase();
            if (te.includes('large') || te.includes('xl') || te.includes('bigge')) return 5;
            if (te.includes('base') || te.includes('clip') || te.includes('bert')) return 4;
            return 3;
        },
        getFlowLLMBlocks(event) {
            const dec = (event?.decoder || '').toLowerCase();
            const params = (event?.size_params || '').toLowerCase();
            const match = (dec + ' ' + params).match(/(\d+\.?\d*)\s*b/i);
            if (match) {
                const billions = parseFloat(match[1]);
                if (billions >= 20) return 7;
                if (billions >= 13) return 6;
                if (billions >= 7) return 5;
                return 4;
            }
            return 5;
        },
        openModal(event) {
            this.selectedEvent = event;
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
                this.showMessage('Maximum 5 models can be compared', 'error');
            }
        },
        exportCSV() {
            if (this.events.length === 0) {
                this.showMessage('No VLMs to export', 'error');
                return;
            }

            const headers = ['Venue', 'Year', 'Month', 'Day', 'Title', 'before_encoder', 'Encoder', 'after_encoder', 'text_encoder', 'Projector', 'after_projector', 'Decoder', 'Size Params', 'FLOPs', 'Code', 'CKPT', 'Quality', 'No citations', 'edit', 'Notes', 'MMMU', 'MathVista', 'VQAv2', 'GQA', 'VizWiz', 'SQA', 'TextVQA', 'POPE', 'MME', 'MM-Bench', 'MM-Bench-CN', 'SEED-IMG', 'LLaVA-Bench-Wild', 'MM-Vet'];
            const rows = this.sortedEvents.map(event => [
                event.venue,
                event.year,
                event.month,
                event.day || '',
                this.escapeCSV(event.title),
                event.before_encoder || '',
                event.encoder,
                event.after_encoder || '',
                event.text_encoder || '',
                event.projector,
                event.after_projector || '',
                event.decoder,
                event.size_params,
                event.flops,
                event.code,
                event.ckpt,
                event.quality,
                event.citations || '',
                event.edit || '0',
                this.escapeCSV(event.notes),
                event.mmmu || '', event.mathvista || '', event.vqav2 || '', event.gqa || '',
                event.vizwiz || '', event.sqa || '', event.textvqa || '', event.pope || '',
                event.mme || '', event.mmbench || '', event.mmbench_cn || '', event.seed_img || '',
                event.llavabench_wild || '', event.mmvet || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `vlm_timeline_${new Date().toISOString().split('T')[0]}.csv`);
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

                    const headers = lines[0].split(',').map(h => h.toLowerCase().trim());
                    const getHeaderIndex = (names) => {
                        for (let name of names) {
                            const idx = headers.findIndex(h => h === name || h === name.replace(/_/g, ' '));
                            if (idx !== -1) return idx;
                        }
                        // Fallback: partial match
                        for (let name of names) {
                            const idx = headers.findIndex(h => h.includes(name));
                            if (idx !== -1) return idx;
                        }
                        return -1;
                    };

                    let importedCount = 0;

                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;

                        const values = this.parseCSVLine(line);
                        
                        const venue = values[getHeaderIndex(['venue'])] || '';
                        const year = parseInt(values[getHeaderIndex(['year'])] || new Date().getFullYear());
                        const month = values[getHeaderIndex(['month'])] || 'January';
                        const day = values[getHeaderIndex(['day'])] || null;
                        const title = values[getHeaderIndex(['title'])] || 'Untitled';
                        const before_encoder = values[getHeaderIndex(['before_encoder'])] || '';
                        const encoder = values[getHeaderIndex(['encoder'])] || '';
                        const after_encoder = values[getHeaderIndex(['after_encoder'])] || '';
                        const text_encoder = values[getHeaderIndex(['text_encoder'])] || '';
                        const projector = values[getHeaderIndex(['projector'])] || '';
                        const after_projector = values[getHeaderIndex(['after_projector'])] || '';
                        const decoder = values[getHeaderIndex(['decoder'])] || '';
                        const size_params = values[getHeaderIndex(['size', 'params'])] || '';
                        const flops = values[getHeaderIndex(['flops'])] || '';
                        const code = values[getHeaderIndex(['code'])] || 'No';
                        const ckpt = values[getHeaderIndex(['ckpt', 'checkpoint'])] || 'No';
                        const quality = values[getHeaderIndex(['quality'])] || 'Good';
                        const citations = values[getHeaderIndex(['citations', 'no citations'])] || '';
                        const notes = values[getHeaderIndex(['notes'])] || '';
                        const edit = values[getHeaderIndex(['edit'])] || '0';

                        if (year && title) {
                            this.events.push({
                                venue, year, month, day: day ? parseInt(day) : null, title,
                                before_encoder, encoder, after_encoder, text_encoder,
                                projector, after_projector, decoder,
                                size_params, flops, code, ckpt, quality, citations, notes,
                                edit
                            });
                            importedCount++;
                        }
                    }

                    this.saveToServer();
                    this.showMessage(`Imported ${importedCount} VLMs successfully!`, 'success');
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
            saveVlmData(this.events);
        },
        async loadFromServer() {
            const data = await loadVlmData();
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
        hasBenchmarks(event) {
            const keys = ['mmmu','mathvista','vqav2','gqa','vizwiz','sqa','textvqa','pope','mme','mmbench','mmbench_cn','seed_img','llavabench_wild','mmvet'];
            return keys.some(k => event[k] && event[k] !== '-');
        },
        parseBenchVal(raw, key) {
            if (!raw || raw === '-') return NaN;
            if (key === 'mme') {
                const parts = String(raw).split('/');
                const perc = parseFloat(parts[0]);
                return isNaN(perc) ? NaN : Math.round((perc / 2000) * 1000) / 10;
            }
            return parseFloat(raw);
        },
        formatBenchVal(raw, key) {
            if (!raw || raw === '-') return '-';
            if (key === 'mme') {
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
        clearFilters() {
            this.searchQuery = '';
            this.filterYear = '';
            this.filterVenue = '';
            this.filterQuality = '';
            this.filterCode = '';
            this.filterCkpt = '';
            this.sortColumn = '';
            this.sortDirection = 'asc';
        },
        clearAllData() {
            if (confirm('Are you sure you want to delete all VLMs? This cannot be undone.')) {
                this.events = [];
                this.selectedModels = [];
                this.saveToServer();
                this.showMessage('All data cleared', 'success');
            }
        },
        layoutFlowArrows() {
            this.$nextTick(() => {
                for (let mi = 0; mi < this.flowSelectedModels.length; mi++) {
                    this.layoutFlowArrowForIndex(mi);
                }
                this.startFlowAnimations();
            });
        },
        layoutFlowArrowForIndex(mi) {
            const canvasArr = this.$refs['archCanvas_' + mi];
            const tokArr = this.$refs['archTokenizer_' + mi];
            const concatArr = this.$refs['archConcat_' + mi];
            const svgArr = this.$refs['archSvg_' + mi];
            const canvas = Array.isArray(canvasArr) ? canvasArr[0] : canvasArr;
            const tokBox = Array.isArray(tokArr) ? tokArr[0] : tokArr;
            const concatEl = Array.isArray(concatArr) ? concatArr[0] : concatArr;
            const svg = Array.isArray(svgArr) ? svgArr[0] : svgArr;
            if (!canvas || !tokBox || !concatEl || !svg) return;

            const cr = canvas.getBoundingClientRect();
            const tokR = tokBox.getBoundingClientRect();
            const conR = concatEl.getBoundingClientRect();

            svg.innerHTML = '';
            svg.setAttribute('width', canvas.offsetWidth);
            svg.setAttribute('height', canvas.offsetHeight);

            const ns = 'http://www.w3.org/2000/svg';
            const defs = document.createElementNS(ns, 'defs');
            const mk = document.createElementNS(ns, 'marker');
            mk.setAttribute('id', 'archAh_' + mi);
            mk.setAttribute('markerWidth', '7');
            mk.setAttribute('markerHeight', '7');
            mk.setAttribute('refX', '6');
            mk.setAttribute('refY', '3.5');
            mk.setAttribute('orient', 'auto');
            const pl = document.createElementNS(ns, 'polygon');
            pl.setAttribute('points', '0 0,7 3.5,0 7');
            pl.setAttribute('fill', '#3a6ab0');
            mk.appendChild(pl);
            defs.appendChild(mk);
            svg.appendChild(defs);

            const sx = tokR.right - cr.left;
            const sy = tokR.top - cr.top + tokR.height / 2;
            const ex = conR.left - cr.left + conR.width / 2;
            const ey = conR.top - cr.top + 2;

            const p = document.createElementNS(ns, 'path');
            p.setAttribute('d', `M ${sx} ${sy} L ${ex} ${sy} L ${ex} ${ey}`);
            p.setAttribute('fill', 'none');
            p.setAttribute('stroke', '#3a6ab0');
            p.setAttribute('stroke-width', '2');
            p.setAttribute('marker-end', 'url(#archAh_' + mi + ')');
            svg.appendChild(p);
        },

        /* ===== Architecture Flow Dot Animations ===== */
        stopFlowAnimations() {
            if (this._flowAnims) {
                this._flowAnims.forEach(a => {
                    a.stopped = true;
                    a.els.forEach(el => el.remove());
                });
            }
            this._flowAnims = [];
        },

        startFlowAnimations() {
            this.stopFlowAnimations();
            this.$nextTick(() => {
                setTimeout(() => {
                    for (let mi = 0; mi < this.flowSelectedModels.length; mi++) {
                        this._startAnimForIndex(mi);
                    }
                }, 200);
            });
        },

        _startAnimForIndex(mi) {
            const canvasArr = this.$refs['archCanvas_' + mi];
            const tokArr    = this.$refs['archTokenizer_' + mi];
            const concatArr = this.$refs['archConcat_' + mi];
            const canvas  = Array.isArray(canvasArr) ? canvasArr[0] : canvasArr;
            const tokBox  = Array.isArray(tokArr) ? tokArr[0] : tokArr;
            const concatEl = Array.isArray(concatArr) ? concatArr[0] : concatArr;
            if (!canvas || !tokBox || !concatEl) return;

            // Find the image-row and text-row inside this canvas
            const textRow  = canvas.querySelector('.arch-text-row');
            const imageRow = canvas.querySelector('.arch-image-row');
            if (!textRow || !imageRow) return;

            // Create dot elements
            const els = [];
            function makeDot(cls) {
                const d = document.createElement('div');
                d.className = 'arch-dot ' + cls;
                canvas.appendChild(d);
                els.push(d);
                return d;
            }
            const textDot   = makeDot('text-dot');
            const imageDot  = makeDot('image-dot');
            const mergedDot = makeDot('merged-dot');

            // Create trail particles
            const TRAIL_PER_TYPE = 14;
            const trails = [];
            ['text-trail','image-trail','merged-trail'].forEach(cls => {
                for (let i = 0; i < TRAIL_PER_TYPE; i++) {
                    const t = document.createElement('div');
                    t.className = 'arch-trail ' + cls;
                    canvas.appendChild(t);
                    els.push(t);
                    trails.push({ el: t, cls, life: 0 });
                }
            });

            // Helper: position relative to canvas
            const cr = () => canvas.getBoundingClientRect();
            const getCenter = (el) => {
                const r = el.getBoundingClientRect(), c = cr();
                return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
            };
            const getRightCenter = (el) => {
                const r = el.getBoundingClientRect(), c = cr();
                return { x: r.right - c.left, y: r.top - c.top + r.height / 2 };
            };
            const getLeftCenter = (el) => {
                const r = el.getBoundingClientRect(), c = cr();
                return { x: r.left - c.left, y: r.top - c.top + r.height / 2 };
            };

            function buildWaypoints() {
                // Text path: text-input → Tokenizer → [Text Encoder] → L-bend → Concat
                const textPts = [];
                const textInput = textRow.querySelector('.arch-input-box');
                textPts.push(getCenter(textInput));
                textPts.push(getCenter(tokBox));

                const textEncWrap = textRow.querySelector('.arch-text-encoder-wrapper');
                let lastTextEl = tokBox;
                if (textEncWrap) {
                    textPts.push(getRightCenter(tokBox));
                    textPts.push(getLeftCenter(textEncWrap));
                    textPts.push(getCenter(textEncWrap));
                    lastTextEl = textEncWrap;
                }
                textPts.push(getRightCenter(lastTextEl));

                // L-shape bend down to concat
                const c = cr();
                const lastR = lastTextEl.getBoundingClientRect();
                const conR = concatEl.getBoundingClientRect();
                const ex = conR.left - c.left + conR.width / 2;
                const sy = lastR.top - c.top + lastR.height / 2;
                const ey = conR.top - c.top + 2;
                textPts.push({ x: ex, y: sy });
                textPts.push({ x: ex, y: ey });
                textPts.push(getCenter(concatEl));

                // Image path: image-input → [before-enc] → [encoder] → [after-enc] → [projector] → [after-proj] → Concat
                const imagePts = [];
                const imgInput = imageRow.querySelector('.arch-input-box');
                imagePts.push(getCenter(imgInput));

                const stages = [
                    imageRow.querySelector('.arch-stage-box.before-enc'),
                    imageRow.querySelector('.arch-encoder-wrapper'),
                    imageRow.querySelector('.arch-stage-box.after-enc'),
                    imageRow.querySelector('.arch-projector-box'),
                    imageRow.querySelector('.arch-stage-box.after-proj'),
                ];
                for (const el of stages) {
                    if (el) {
                        imagePts.push(getLeftCenter(el));
                        imagePts.push(getCenter(el));
                        imagePts.push(getRightCenter(el));
                    }
                }
                imagePts.push(getLeftCenter(concatEl));
                imagePts.push(getCenter(concatEl));

                // Merged path: Concat → [LLM] → LM Head → output
                const mergedPts = [];
                mergedPts.push(getCenter(concatEl));
                mergedPts.push(getRightCenter(concatEl));

                const llmWrap = imageRow.querySelector('.arch-llm-wrapper');
                if (llmWrap) {
                    mergedPts.push(getLeftCenter(llmWrap));
                    mergedPts.push(getCenter(llmWrap));
                    mergedPts.push(getRightCenter(llmWrap));
                }

                // LM Head and output are the .arch-gray-box elements in the image row
                const grayBoxes = imageRow.querySelectorAll('.arch-gray-box');
                for (const gb of grayBoxes) {
                    mergedPts.push(getCenter(gb));
                }

                return { textPts, imagePts, mergedPts };
            }

            function totalDist(pts) {
                let d = 0;
                for (let i = 1; i < pts.length; i++)
                    d += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
                return d;
            }
            function posOnPath(pts, t) {
                const total = totalDist(pts);
                let target = t * total;
                for (let i = 1; i < pts.length; i++) {
                    const seg = Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
                    if (target <= seg) {
                        const frac = seg === 0 ? 0 : target / seg;
                        return {
                            x: pts[i-1].x + (pts[i].x - pts[i-1].x) * frac,
                            y: pts[i-1].y + (pts[i].y - pts[i-1].y) * frac,
                        };
                    }
                    target -= seg;
                }
                return pts[pts.length - 1];
            }
            function placeDot(dot, x, y) {
                dot.style.left = (x - dot.offsetWidth / 2) + 'px';
                dot.style.top  = (y - dot.offsetHeight / 2) + 'px';
            }
            function ease(t) {
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            }
            function spawnTrail(cls, x, y) {
                for (const t of trails) {
                    if (t.cls === cls && t.life <= 0) {
                        t.el.style.left = (x + (Math.random() - 0.5) * 6) + 'px';
                        t.el.style.top  = (y + (Math.random() - 0.5) * 6) + 'px';
                        t.life = 1;
                        t.el.style.opacity = 0.7;
                        return;
                    }
                }
            }
            function updateTrails(dt) {
                for (const t of trails) {
                    if (t.life > 0) {
                        t.life -= dt * 2.5;
                        t.el.style.opacity = Math.max(0, t.life * 0.7);
                        t.el.style.transform = 'scale(' + (0.3 + t.life * 0.7) + ')';
                        if (t.life <= 0) t.el.style.opacity = 0;
                    }
                }
            }

            // Flash effect on architecture boxes
            function flashBox(el, cls) {
                el.classList.remove(cls);
                void el.offsetWidth; // force reflow
                el.classList.add(cls);
                setTimeout(() => el.classList.remove(cls), 600);
            }

            // Animation phases
            const PHASE_TEXT_IMG = 0, PHASE_MERGE = 1, PHASE_OUTPUT = 2, PHASE_FADE = 3;
            const SPEED_TEXT_IMG = 0.28, SPEED_OUTPUT = 0.35;
            const MERGE_DUR = 0.5, FADE_DUR = 0.8;

            const state = { phase: PHASE_TEXT_IMG, t: 0, lastTime: 0, stopped: false, trailTimer: 0 };
            const anim = { stopped: false, els, state };
            this._flowAnims.push(anim);

            let waypoints = null;

            function tick(ts) {
                if (anim.stopped) return;
                if (!state.lastTime) state.lastTime = ts;
                const dt = Math.min((ts - state.lastTime) / 1000, 0.1);
                state.lastTime = ts;
                state.trailTimer += dt;
                const spawnInterval = 0.04;

                if (!waypoints) {
                    try { waypoints = buildWaypoints(); } catch(e) { requestAnimationFrame(tick); return; }
                }

                if (state.phase === PHASE_TEXT_IMG) {
                    state.t += dt * SPEED_TEXT_IMG;
                    const t = Math.min(state.t, 1);
                    const et = ease(t);

                    const tp = posOnPath(waypoints.textPts, et);
                    const ip = posOnPath(waypoints.imagePts, et);

                    textDot.classList.add('visible');
                    imageDot.classList.add('visible');
                    mergedDot.classList.remove('visible');

                    placeDot(textDot, tp.x, tp.y);
                    placeDot(imageDot, ip.x, ip.y);

                    if (state.trailTimer >= spawnInterval) {
                        spawnTrail('text-trail', tp.x, tp.y);
                        spawnTrail('image-trail', ip.x, ip.y);
                        state.trailTimer = 0;
                    }

                    // Flash boxes as dot passes through them
                    if (et > 0.15 && et < 0.2 && !state._flashedTok) {
                        state._flashedTok = true;
                        flashBox(tokBox, 'arch-flash-blue');
                    }
                    const encEl = imageRow.querySelector('.arch-encoder-wrapper');
                    if (et > 0.35 && et < 0.4 && !state._flashedEnc && encEl) {
                        state._flashedEnc = true;
                        flashBox(encEl, 'arch-flash-green');
                    }
                    const projEl = imageRow.querySelector('.arch-projector-box');
                    if (et > 0.6 && et < 0.65 && !state._flashedProj && projEl) {
                        state._flashedProj = true;
                        flashBox(projEl, 'arch-flash-green');
                    }

                    if (t >= 1) { state.phase = PHASE_MERGE; state.t = 0; }
                }
                else if (state.phase === PHASE_MERGE) {
                    state.t += dt;
                    const cp = getCenter(concatEl);
                    placeDot(textDot, cp.x, cp.y);
                    placeDot(imageDot, cp.x, cp.y);

                    const mf = Math.min(state.t / MERGE_DUR, 1);
                    textDot.style.transform  = 'scale(' + (1 - mf) + ')';
                    imageDot.style.transform = 'scale(' + (1 - mf) + ')';
                    mergedDot.classList.add('visible');
                    mergedDot.style.transform = 'scale(' + mf + ')';
                    placeDot(mergedDot, cp.x, cp.y);

                    if (state.t < 0.05) flashBox(concatEl, 'arch-flash-purple');

                    if (mf >= 1) {
                        textDot.classList.remove('visible');
                        imageDot.classList.remove('visible');
                        textDot.style.transform = '';
                        imageDot.style.transform = '';
                        mergedDot.style.transform = '';
                        state.phase = PHASE_OUTPUT;
                        state.t = 0;
                    }
                }
                else if (state.phase === PHASE_OUTPUT) {
                    state.t += dt * SPEED_OUTPUT;
                    const t = Math.min(state.t, 1);
                    const et = ease(t);

                    const mp = posOnPath(waypoints.mergedPts, et);
                    placeDot(mergedDot, mp.x, mp.y);

                    if (state.trailTimer >= spawnInterval) {
                        spawnTrail('merged-trail', mp.x, mp.y);
                        state.trailTimer = 0;
                    }

                    // Flash LLM as merged dot passes
                    const llmEl = imageRow.querySelector('.arch-llm-wrapper');
                    if (et > 0.35 && et < 0.4 && !state._flashedLLM && llmEl) {
                        state._flashedLLM = true;
                        flashBox(llmEl, 'arch-flash-purple');
                    }

                    if (t >= 1) { state.phase = PHASE_FADE; state.t = 0; }
                }
                else if (state.phase === PHASE_FADE) {
                    state.t += dt;
                    mergedDot.style.opacity = Math.max(0, 1 - state.t / FADE_DUR);
                    if (state.t >= FADE_DUR + 0.4) {
                        // Reset everything
                        mergedDot.classList.remove('visible');
                        mergedDot.style.opacity = '';
                        state.phase = PHASE_TEXT_IMG;
                        state.t = 0;
                        state._flashedTok = false;
                        state._flashedEnc = false;
                        state._flashedProj = false;
                        state._flashedLLM = false;
                        waypoints = buildWaypoints(); // recalc positions
                    }
                }

                updateTrails(dt);
                requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        },

        showMessage(text, type = 'success') {
            this.message = { text, type };
            setTimeout(() => {
                this.message = null;
            }, 4000);
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
        parseParamSize(s) {
            if (!s) return null;
            const m = s.toString().match(/([\d.]+)\s*([KMBT]?)/i);
            if (!m) return null;
            const num = parseFloat(m[1]);
            if (isNaN(num)) return null;
            const unit = (m[2] || '').toUpperCase();
            const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
            return num * (mult[unit] || 1);
        },
        scatterParseVal(event, propDef) {
            const raw = event[propDef.key];
            if (propDef.type === 'size') return this.parseParamSize(raw);
            if (propDef.type === 'bench') {
                const v = this.parseBenchVal(raw, propDef.key);
                return isNaN(v) ? null : v;
            }
            // number type (citations, year)
            const v = parseFloat(raw);
            return isNaN(v) || v === 0 ? null : v;
        },
        scatterNeedsLog(propKey) {
            return ['size_params', 'flops', 'citations'].includes(propKey);
        },
        scatterAxisLabel(propKey) {
            const p = this.scatterProperties.find(x => x.key === propKey);
            return p ? p.label : propKey;
        },
        drawScatterChart() {
            this.$nextTick(() => {
                const canvas = this.$refs.scatterCanvas;
                if (!canvas) return;
                if (this._scatterChart) {
                    this._scatterChart.destroy();
                    this._scatterChart = null;
                }
                const points = this.scatterPlottableModels;
                if (points.length === 0) return;

                const xProp = this.scatterXProp;
                const yProp = this.scatterYProp;
                const xLog = this.scatterNeedsLog(xProp);
                const yLog = this.scatterNeedsLog(yProp);
                const xLabel = this.scatterAxisLabel(xProp);
                const yLabel = this.scatterAxisLabel(yProp);
                const fmtTick = (v) => {
                    if (v >= 1e12) return (v/1e12) + 'T';
                    if (v >= 1e9) return (v/1e9) + 'B';
                    if (v >= 1e6) return (v/1e6) + 'M';
                    if (v >= 1e3) return (v/1e3) + 'K';
                    return v;
                };

                const datasets = points.map((pt, i) => ({
                    label: pt.label,
                    data: [{ x: pt.x, y: pt.y, label: pt.label }],
                    backgroundColor: this.dotColors[i % this.dotColors.length],
                    borderColor: this.dotColors[i % this.dotColors.length],
                    pointRadius: 8,
                    pointHoverRadius: 11
                }));

                const isDark = this.darkMode;
                this._scatterChart = new Chart(canvas, {
                    type: 'scatter',
                    data: { datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: {
                                type: xLog ? 'logarithmic' : 'linear',
                                title: { display: true, text: xLabel, color: isDark ? '#dfe6e9' : '#2d3436', font: { size: 14, weight: '600' } },
                                ticks: {
                                    color: isDark ? '#b2bec3' : '#636e72',
                                    callback: xLog ? fmtTick : undefined
                                },
                                grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                            },
                            y: {
                                type: yLog ? 'logarithmic' : 'linear',
                                title: { display: true, text: yLabel, color: isDark ? '#dfe6e9' : '#2d3436', font: { size: 14, weight: '600' } },
                                ticks: {
                                    color: isDark ? '#b2bec3' : '#636e72',
                                    callback: yLog ? fmtTick : undefined
                                },
                                grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => {
                                        const pt = ctx.raw;
                                        const fmtX = xLog ? this.fmtSize(pt.x) : pt.x;
                                        const fmtY = yLog ? this.fmtSize(pt.y) : pt.y;
                                        return pt.label + ' — ' + xLabel + ': ' + fmtX + ', ' + yLabel + ': ' + fmtY;
                                    }
                                }
                            }
                        }
                    },
                    plugins: [{
                        id: 'scatterLabels',
                        afterDatasetsDraw(chart) {
                            const ctx = chart.ctx;
                            ctx.save();
                            ctx.font = '11px IBM Plex Mono, monospace';
                            ctx.fillStyle = isDark ? '#dfe6e9' : '#2d3436';
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'bottom';
                            chart.data.datasets.forEach(ds => {
                                const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(ds));
                                meta.data.forEach((pt, j) => {
                                    const label = ds.data[j].label;
                                    ctx.fillText(label, pt.x + 10, pt.y - 4);
                                });
                            });
                            ctx.restore();
                        }
                    }]
                });
            });
        },
        fmtSize(v) {
            if (v >= 1e12) return (v / 1e12).toFixed(1) + 'T';
            if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
            if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
            if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
            return v.toString();
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
                        label: model.title + (model.size_params ? ' (' + model.size_params + ')' : ''),
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
        benchSelectedBenchmarks: {
            handler() { this.drawRadarChart(); },
            deep: true
        },
        selectedModels: {
            handler() { this.drawScatterChart(); },
            deep: true
        },
        scatterXProp() { this.drawScatterChart(); },
        scatterYProp() { this.drawScatterChart(); },
        darkMode() { this.drawRadarChart(); this.drawScatterChart(); },
        flowSelectedModels: {
            handler() {
                if (this.currentPage === 'flow') this.$nextTick(() => this.layoutFlowArrows());
            },
            deep: true
        },
        events() {
            if (this.currentPage === 'flow') this.$nextTick(() => this.layoutFlowArrows());
        },
        currentPage(val) {
            localStorage.setItem('vlmCurrentPage', val);
            if (val === 'flow') {
                this.$nextTick(() => this.layoutFlowArrows());
            } else {
                this.stopFlowAnimations();
            }
        }
    },
    async mounted() {
        this._flowAnims = [];

        // Load saved page
        const savedPage = localStorage.getItem('vlmCurrentPage');
        if (savedPage && ['timeline','add','comparison','all','benchmarks','flow','edit'].includes(savedPage)) {
            this.currentPage = savedPage;
        }

        // Load saved theme from global
        const globalTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.darkMode = globalTheme === 'dark';
        
        // Auto-load data from server (CSV file)
        const loaded = await this.loadFromServer();
        if (!loaded) {
            this.showMessage('No data found. Import a CSV or add VLMs manually.', 'error');
        }

        window.addEventListener('resize', () => {
            if (this.currentPage === 'flow') this.layoutFlowArrows();
        });

        document.addEventListener('click', this.closeFlowDropdown);

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