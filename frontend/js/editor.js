// =============================================
// CYBERHUB - VISUAL EXERCISE EDITOR
// Éditeur drag & drop sans code
// =============================================

// State
let currentExercise = null;
let contentBlocks = [];
let questions = [];
let blockIdCounter = 0;
let questionIdCounter = 0;

// =============================================
// EXERCISE EDITOR
// =============================================

function openExerciseEditor(exerciseId = null) {
    // Reset state
    currentExercise = exerciseId ? exercises.find(e => e.id === exerciseId) : null;
    contentBlocks = [];
    questions = [];
    blockIdCounter = 0;
    questionIdCounter = 0;

    // Update UI
    document.getElementById('editor-title').textContent = currentExercise
        ? `✏️ Modifier: ${currentExercise.title}`
        : '📝 Nouvel exercice';

    // Clear containers
    document.getElementById('blocks-container').innerHTML = `
        <div class="empty-blocks-message">
            <p>Commencez à créer votre exercice en ajoutant des blocs ci-dessus</p>
            <p class="hint">Vous pouvez réorganiser les blocs par glisser-déposer</p>
        </div>
    `;
    document.getElementById('questions-editor-container').innerHTML = `
        <div class="empty-questions-message">
            <p>Ajoutez des questions pour évaluer les étudiants</p>
            <p class="hint">Les questions apparaîtront dans l'onglet "Questions" de l'exercice</p>
        </div>
    `;

    // Reset form
    document.getElementById('exercise-title-input').value = '';
    document.getElementById('exercise-description-input').value = '';
    document.getElementById('exercise-theme-select').value = '';
    document.getElementById('exercise-difficulty-select').value = 'débutant';
    document.getElementById('exercise-duration-input').value = 60;
    document.getElementById('exercise-container-select').value = '';

    // Load existing data if editing
    if (currentExercise) {
        loadExerciseForEdit(exerciseId);
    }

    // Switch to editor view
    showAdminView('exercise-editor');

    // Init sortable
    initSortable();
}

async function loadExerciseForEdit(exerciseId) {
    const token = localStorage.getItem('admin_token');

    try {
        const response = await fetch(`${API_BASE}/api/admin/exercises/${exerciseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!data.success) return;

        const exercise = data.data;

        // Fill form
        document.getElementById('exercise-title-input').value = exercise.title || '';
        document.getElementById('exercise-description-input').value = exercise.description || '';
        document.getElementById('exercise-theme-select').value = exercise.theme_id || '';
        document.getElementById('exercise-difficulty-select').value = exercise.difficulty || 'débutant';
        document.getElementById('exercise-duration-input').value = exercise.duration_minutes || 60;
        document.getElementById('exercise-container-select').value = exercise.container_template_id || '';

        // Load content blocks
        if (exercise.course_blocks) {
            try {
                const blocks = JSON.parse(exercise.course_blocks);
                blocks.forEach(block => {
                    addBlock(block.type, block);
                });
            } catch (e) {
                console.error('Error parsing blocks:', e);
            }
        }

        // Load questions
        const questionsResponse = await fetch(`${API_BASE}/api/exercises/${exerciseId}/questions`);
        const questionsData = await questionsResponse.json();
        if (questionsData.success && questionsData.data.length) {
            questionsData.data.forEach(q => {
                addQuestion(q.question_type, q);
            });
        }

        updateQuestionsCount();
        updateTotalPoints();
    } catch (error) {
        console.error('Error loading exercise:', error);
    }
}

function closeExerciseEditor() {
    showAdminView('exercises');
}

// =============================================
// EDITOR TABS
// =============================================

function switchEditorTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.editor-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}-editor`).classList.add('active');

    // Update preview if needed
    if (tabName === 'preview') {
        updatePreview();
    }
}

// =============================================
// CONTENT BLOCKS
// =============================================

function addBlock(type, existingData = null) {
    const blockId = `block-${++blockIdCounter}`;
    const container = document.getElementById('blocks-container');

    // Remove empty message
    const emptyMsg = container.querySelector('.empty-blocks-message');
    if (emptyMsg) emptyMsg.remove();

    const blockData = existingData || { type };
    blockData.id = blockId;
    contentBlocks.push(blockData);

    const blockHtml = createBlockHtml(type, blockId, existingData);
    container.insertAdjacentHTML('beforeend', blockHtml);

    // Reinit sortable
    initSortable();

    return blockId;
}

function createBlockHtml(type, blockId, data = {}) {
    const blockTypes = {
        heading: { icon: '📌', label: 'Titre' },
        paragraph: { icon: '📝', label: 'Paragraphe' },
        code: { icon: '💻', label: 'Bloc de code' },
        image: { icon: '🖼️', label: 'Image' },
        alert: { icon: '⚠️', label: 'Alerte' },
        list: { icon: '📋', label: 'Liste' },
        terminal: { icon: '🖥️', label: 'Terminal' },
        divider: { icon: '➖', label: 'Séparateur' },
        collapsible: { icon: '📂', label: 'Section dépliable' }
    };

    const blockInfo = blockTypes[type] || { icon: '📄', label: type };

    let contentHtml = '';

    switch (type) {
        case 'heading':
            contentHtml = `
                <div class="form-row">
                    <select class="heading-level" onchange="updateBlock('${blockId}')">
                        <option value="h1" ${data.level === 'h1' ? 'selected' : ''}>H1 - Titre principal</option>
                        <option value="h2" ${data.level === 'h2' ? 'selected' : ''}>H2 - Section</option>
                        <option value="h3" ${data.level === 'h3' ? 'selected' : ''}>H3 - Sous-section</option>
                    </select>
                </div>
                <input type="text" placeholder="Texte du titre" value="${data.content || ''}" onchange="updateBlock('${blockId}')">
            `;
            break;

        case 'paragraph':
            contentHtml = `
                <textarea placeholder="Écrivez votre texte ici. Supporte le **Markdown**" onchange="updateBlock('${blockId}')">${data.content || ''}</textarea>
            `;
            break;

        case 'code':
            contentHtml = `
                <div class="form-row">
                    <select class="code-language" onchange="updateBlock('${blockId}')">
                        <option value="bash" ${data.language === 'bash' ? 'selected' : ''}>Bash</option>
                        <option value="python" ${data.language === 'python' ? 'selected' : ''}>Python</option>
                        <option value="javascript" ${data.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
                        <option value="sql" ${data.language === 'sql' ? 'selected' : ''}>SQL</option>
                        <option value="php" ${data.language === 'php' ? 'selected' : ''}>PHP</option>
                        <option value="html" ${data.language === 'html' ? 'selected' : ''}>HTML</option>
                        <option value="css" ${data.language === 'css' ? 'selected' : ''}>CSS</option>
                        <option value="text" ${data.language === 'text' ? 'selected' : ''}>Texte brut</option>
                    </select>
                </div>
                <textarea class="code-input" placeholder="Entrez votre code ici..." onchange="updateBlock('${blockId}')">${data.content || ''}</textarea>
            `;
            break;

        case 'image':
            contentHtml = `
                <input type="text" placeholder="URL de l'image ou glissez un fichier" value="${data.url || ''}" onchange="updateBlock('${blockId}')">
                <input type="text" placeholder="Légende (optionnel)" value="${data.caption || ''}" onchange="updateBlock('${blockId}')" style="margin-top: 8px;">
                <div class="image-preview" style="margin-top: 12px; ${data.url ? '' : 'display: none;'}">
                    <img src="${data.url || ''}" style="max-width: 100%; border-radius: 8px;">
                </div>
            `;
            break;

        case 'alert':
            contentHtml = `
                <div class="form-row">
                    <select class="alert-type" onchange="updateBlock('${blockId}')">
                        <option value="info" ${data.alertType === 'info' ? 'selected' : ''}>ℹ️ Information</option>
                        <option value="warning" ${data.alertType === 'warning' ? 'selected' : ''}>⚠️ Attention</option>
                        <option value="danger" ${data.alertType === 'danger' ? 'selected' : ''}>🚨 Danger</option>
                        <option value="success" ${data.alertType === 'success' ? 'selected' : ''}>✅ Succès</option>
                        <option value="tip" ${data.alertType === 'tip' ? 'selected' : ''}>💡 Astuce</option>
                    </select>
                </div>
                <textarea placeholder="Contenu de l'alerte" onchange="updateBlock('${blockId}')">${data.content || ''}</textarea>
            `;
            break;

        case 'list':
            contentHtml = `
                <div class="form-row">
                    <select class="list-type" onchange="updateBlock('${blockId}')">
                        <option value="ul" ${data.listType === 'ul' ? 'selected' : ''}>• Liste à puces</option>
                        <option value="ol" ${data.listType === 'ol' ? 'selected' : ''}>1. Liste numérotée</option>
                    </select>
                </div>
                <textarea placeholder="Un élément par ligne" onchange="updateBlock('${blockId}')">${data.content || ''}</textarea>
            `;
            break;

        case 'terminal':
            contentHtml = `
                <input type="text" placeholder="Titre du terminal (ex: Terminal Linux)" value="${data.title || ''}" onchange="updateBlock('${blockId}')">
                <textarea class="code-input" placeholder="$ commande" onchange="updateBlock('${blockId}')" style="margin-top: 8px;">${data.content || ''}</textarea>
            `;
            break;

        case 'divider':
            contentHtml = `
                <div style="text-align: center; color: var(--text-muted);">--- Ligne de séparation ---</div>
            `;
            break;

        case 'collapsible':
            contentHtml = `
                <input type="text" placeholder="Titre de la section" value="${data.title || ''}" onchange="updateBlock('${blockId}')">
                <textarea placeholder="Contenu (visible après clic)" onchange="updateBlock('${blockId}')" style="margin-top: 8px;">${data.content || ''}</textarea>
            `;
            break;
    }

    return `
        <div class="content-block" id="${blockId}" data-type="${type}">
            <div class="block-header">
                <span class="block-drag-handle">⋮⋮</span>
                <span class="block-type">${blockInfo.icon} ${blockInfo.label}</span>
                <div class="block-actions">
                    <button class="block-action" onclick="duplicateBlock('${blockId}')" title="Dupliquer">📋</button>
                    <button class="block-action delete" onclick="deleteBlock('${blockId}')" title="Supprimer">🗑️</button>
                </div>
            </div>
            <div class="block-content">
                ${contentHtml}
            </div>
        </div>
    `;
}

function updateBlock(blockId) {
    const blockEl = document.getElementById(blockId);
    const type = blockEl.dataset.type;
    const block = contentBlocks.find(b => b.id === blockId);
    if (!block) return;

    // Extract values based on type
    switch (type) {
        case 'heading':
            block.level = blockEl.querySelector('.heading-level')?.value || 'h2';
            block.content = blockEl.querySelector('input')?.value || '';
            break;
        case 'paragraph':
        case 'list':
            block.content = blockEl.querySelector('textarea')?.value || '';
            if (type === 'list') {
                block.listType = blockEl.querySelector('.list-type')?.value || 'ul';
            }
            break;
        case 'code':
            block.language = blockEl.querySelector('.code-language')?.value || 'bash';
            block.content = blockEl.querySelector('textarea')?.value || '';
            break;
        case 'image':
            const inputs = blockEl.querySelectorAll('input');
            block.url = inputs[0]?.value || '';
            block.caption = inputs[1]?.value || '';
            // Update preview
            const preview = blockEl.querySelector('.image-preview');
            const img = preview?.querySelector('img');
            if (preview && img) {
                preview.style.display = block.url ? 'block' : 'none';
                img.src = block.url;
            }
            break;
        case 'alert':
            block.alertType = blockEl.querySelector('.alert-type')?.value || 'info';
            block.content = blockEl.querySelector('textarea')?.value || '';
            break;
        case 'terminal':
            const termInputs = blockEl.querySelectorAll('input, textarea');
            block.title = termInputs[0]?.value || '';
            block.content = termInputs[1]?.value || '';
            break;
        case 'collapsible':
            const collInputs = blockEl.querySelectorAll('input, textarea');
            block.title = collInputs[0]?.value || '';
            block.content = collInputs[1]?.value || '';
            break;
    }
}

function deleteBlock(blockId) {
    const blockEl = document.getElementById(blockId);
    if (blockEl) blockEl.remove();
    contentBlocks = contentBlocks.filter(b => b.id !== blockId);

    // Show empty message if no blocks
    const container = document.getElementById('blocks-container');
    if (!contentBlocks.length) {
        container.innerHTML = `
            <div class="empty-blocks-message">
                <p>Commencez à créer votre exercice en ajoutant des blocs ci-dessus</p>
                <p class="hint">Vous pouvez réorganiser les blocs par glisser-déposer</p>
            </div>
        `;
    }
}

function duplicateBlock(blockId) {
    const block = contentBlocks.find(b => b.id === blockId);
    if (block) {
        updateBlock(blockId); // Save current state first
        addBlock(block.type, { ...block, id: null });
    }
}

// =============================================
// QUESTIONS
// =============================================

function addQuestion(type, existingData = null) {
    const questionId = `question-${++questionIdCounter}`;
    const container = document.getElementById('questions-editor-container');

    // Remove empty message
    const emptyMsg = container.querySelector('.empty-questions-message');
    if (emptyMsg) emptyMsg.remove();

    const questionData = existingData || {
        type,
        text: '',
        points: 10,
        hint: '',
        options: type.includes('qcm') ? ['', '', '', ''] : null,
        correctAnswer: ''
    };
    questionData.id = questionId;
    questions.push(questionData);

    const questionHtml = createQuestionHtml(type, questionId, questionData);
    container.insertAdjacentHTML('beforeend', questionHtml);

    updateQuestionsCount();
    updateTotalPoints();

    // Reinit sortable
    initSortable();

    return questionId;
}

function createQuestionHtml(type, questionId, data = {}) {
    const types = {
        qcm: { icon: '🔘', label: 'QCM (choix unique)' },
        qcm_multiple: { icon: '☑️', label: 'QCM (choix multiples)' },
        text: { icon: '✏️', label: 'Réponse texte' },
        flag: { icon: '🚩', label: 'Flag CTF' },
        code: { icon: '💻', label: 'Réponse code' },
        number: { icon: '🔢', label: 'Réponse numérique' }
    };

    const typeInfo = types[type] || { icon: '❓', label: type };
    const questionNum = questions.length;

    let answerHtml = '';

    switch (type) {
        case 'qcm':
        case 'qcm_multiple':
            const inputType = type === 'qcm' ? 'radio' : 'checkbox';
            const options = data.options || ['', '', '', ''];
            let correctAnswers = [];
            try {
                if (data.correctAnswer) {
                    correctAnswers = Array.isArray(data.correctAnswer)
                        ? data.correctAnswer
                        : [data.correctAnswer];
                }
            } catch (e) {}

            answerHtml = `
                <div class="form-group">
                    <label>Options (cochez la/les bonne(s) réponse(s))</label>
                    <div class="qcm-options" id="${questionId}-options">
                        ${options.map((opt, i) => `
                            <div class="qcm-option">
                                <input type="${inputType}" name="${questionId}-correct" value="${i}"
                                    ${correctAnswers.includes(opt) || correctAnswers.includes(String(i)) ? 'checked' : ''}
                                    onchange="updateQuestion('${questionId}')">
                                <input type="text" value="${opt}" placeholder="Option ${i + 1}"
                                    onchange="updateQuestion('${questionId}')">
                                <button class="btn-remove" onclick="removeOption('${questionId}', ${i})">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn-add-option" onclick="addOption('${questionId}')">+ Ajouter une option</button>
                </div>
            `;
            break;

        case 'text':
        case 'flag':
            answerHtml = `
                <div class="form-group">
                    <label>${type === 'flag' ? 'Flag attendu (ex: FLAG{example})' : 'Réponse attendue'}</label>
                    <input type="text" value="${data.correctAnswer || ''}"
                        placeholder="${type === 'flag' ? 'FLAG{...}' : 'Réponse correcte'}"
                        onchange="updateQuestion('${questionId}')">
                </div>
            `;
            break;

        case 'code':
            answerHtml = `
                <div class="form-group">
                    <label>Code attendu (ou expression régulière)</label>
                    <textarea class="code-input" placeholder="Réponse code attendue"
                        onchange="updateQuestion('${questionId}')">${data.correctAnswer || ''}</textarea>
                </div>
            `;
            break;

        case 'number':
            answerHtml = `
                <div class="form-group">
                    <label>Nombre attendu</label>
                    <input type="number" value="${data.correctAnswer || ''}" placeholder="Ex: 42"
                        onchange="updateQuestion('${questionId}')">
                </div>
            `;
            break;
    }

    return `
        <div class="question-block" id="${questionId}" data-type="${type}">
            <div class="question-header">
                <span class="question-number">${questionNum}</span>
                <span class="question-type-badge">${typeInfo.icon} ${typeInfo.label}</span>
                <span class="question-points">
                    <input type="number" value="${data.points || 10}" min="1" max="100"
                        style="width: 60px; text-align: center;" onchange="updateQuestion('${questionId}')"> pts
                </span>
                <div class="block-actions">
                    <button class="block-action delete" onclick="deleteQuestion('${questionId}')" title="Supprimer">🗑️</button>
                </div>
            </div>
            <div class="question-content">
                <div class="form-group">
                    <label>Question *</label>
                    <textarea placeholder="Écrivez votre question ici..." onchange="updateQuestion('${questionId}')">${data.text || data.question_text || ''}</textarea>
                </div>

                ${answerHtml}

                <div class="form-group">
                    <label>Indice (optionnel)</label>
                    <input type="text" value="${data.hint || ''}" placeholder="Un indice pour aider l'étudiant"
                        onchange="updateQuestion('${questionId}')">
                </div>
            </div>
        </div>
    `;
}

function updateQuestion(questionId) {
    const questionEl = document.getElementById(questionId);
    const type = questionEl.dataset.type;
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    // Get text and points
    question.text = questionEl.querySelector('.question-content > .form-group:first-child textarea')?.value || '';
    question.points = parseInt(questionEl.querySelector('.question-points input')?.value) || 10;
    question.hint = questionEl.querySelector('.question-content > .form-group:last-child input')?.value || '';

    // Get answer based on type
    switch (type) {
        case 'qcm':
        case 'qcm_multiple':
            const optionInputs = questionEl.querySelectorAll('.qcm-option input[type="text"]');
            const checkedInputs = questionEl.querySelectorAll('.qcm-option input:checked');
            question.options = Array.from(optionInputs).map(i => i.value);
            question.correctAnswer = Array.from(checkedInputs).map(i => question.options[i.value]);
            if (type === 'qcm') question.correctAnswer = question.correctAnswer[0] || '';
            break;

        case 'text':
        case 'flag':
        case 'number':
            const answerInput = questionEl.querySelectorAll('.question-content .form-group')[1]?.querySelector('input');
            question.correctAnswer = answerInput?.value || '';
            break;

        case 'code':
            const codeInput = questionEl.querySelector('.question-content textarea.code-input');
            question.correctAnswer = codeInput?.value || '';
            break;
    }

    updateTotalPoints();
}

function deleteQuestion(questionId) {
    const questionEl = document.getElementById(questionId);
    if (questionEl) questionEl.remove();
    questions = questions.filter(q => q.id !== questionId);

    // Show empty message if no questions
    const container = document.getElementById('questions-editor-container');
    if (!questions.length) {
        container.innerHTML = `
            <div class="empty-questions-message">
                <p>Ajoutez des questions pour évaluer les étudiants</p>
                <p class="hint">Les questions apparaîtront dans l'onglet "Questions" de l'exercice</p>
            </div>
        `;
    }

    updateQuestionsCount();
    updateTotalPoints();
    renumberQuestions();
}

function addOption(questionId) {
    const optionsContainer = document.getElementById(`${questionId}-options`);
    const question = questions.find(q => q.id === questionId);
    if (!optionsContainer || !question) return;

    const type = document.getElementById(questionId).dataset.type;
    const inputType = type === 'qcm' ? 'radio' : 'checkbox';
    const optionIndex = optionsContainer.children.length;

    const optionHtml = `
        <div class="qcm-option">
            <input type="${inputType}" name="${questionId}-correct" value="${optionIndex}"
                onchange="updateQuestion('${questionId}')">
            <input type="text" value="" placeholder="Option ${optionIndex + 1}"
                onchange="updateQuestion('${questionId}')">
            <button class="btn-remove" onclick="removeOption('${questionId}', ${optionIndex})">×</button>
        </div>
    `;

    optionsContainer.insertAdjacentHTML('beforeend', optionHtml);
    if (!question.options) question.options = [];
    question.options.push('');
}

function removeOption(questionId, optionIndex) {
    const optionsContainer = document.getElementById(`${questionId}-options`);
    if (!optionsContainer || optionsContainer.children.length <= 2) return;

    optionsContainer.children[optionIndex]?.remove();
    updateQuestion(questionId);
}

function updateQuestionsCount() {
    document.getElementById('questions-count').textContent = questions.length;
}

function updateTotalPoints() {
    const total = questions.reduce((sum, q) => sum + (q.points || 10), 0);
    document.getElementById('total-points').textContent = total;
}

function renumberQuestions() {
    const questionBlocks = document.querySelectorAll('.question-block');
    questionBlocks.forEach((block, index) => {
        const numEl = block.querySelector('.question-number');
        if (numEl) numEl.textContent = index + 1;
    });
}

// =============================================
// PREVIEW
// =============================================

function updatePreview() {
    // Update header
    document.getElementById('preview-title').textContent =
        document.getElementById('exercise-title-input').value || 'Titre de l\'exercice';
    document.getElementById('preview-difficulty').textContent =
        document.getElementById('exercise-difficulty-select').value;
    document.getElementById('preview-duration').textContent =
        document.getElementById('exercise-duration-input').value + ' min';
    document.getElementById('preview-points').textContent =
        questions.reduce((sum, q) => sum + (q.points || 10), 0) + ' points';

    // Generate content
    let html = '';

    contentBlocks.forEach(block => {
        updateBlock(block.id); // Ensure data is current

        switch (block.type) {
            case 'heading':
                const tag = block.level || 'h2';
                html += `<${tag}>${block.content || ''}</${tag}>`;
                break;

            case 'paragraph':
                html += `<p>${marked.parse(block.content || '')}</p>`;
                break;

            case 'code':
                html += `<pre><code class="language-${block.language || 'bash'}">${escapeHtml(block.content || '')}</code></pre>`;
                break;

            case 'image':
                if (block.url) {
                    html += `<figure><img src="${block.url}" alt="${block.caption || ''}"><figcaption>${block.caption || ''}</figcaption></figure>`;
                }
                break;

            case 'alert':
                const alertClass = block.alertType || 'info';
                html += `<div class="alert alert-${alertClass}">${marked.parse(block.content || '')}</div>`;
                break;

            case 'list':
                const listTag = block.listType || 'ul';
                const items = (block.content || '').split('\n').filter(i => i.trim());
                html += `<${listTag}>${items.map(i => `<li>${i}</li>`).join('')}</${listTag}>`;
                break;

            case 'terminal':
                html += `
                    <div class="terminal">
                        <div class="terminal-header">${block.title || 'Terminal'}</div>
                        <pre>${escapeHtml(block.content || '')}</pre>
                    </div>
                `;
                break;

            case 'divider':
                html += '<hr>';
                break;

            case 'collapsible':
                html += `
                    <details>
                        <summary>${block.title || 'Cliquez pour voir'}</summary>
                        <div>${marked.parse(block.content || '')}</div>
                    </details>
                `;
                break;
        }
    });

    document.getElementById('preview-content').innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================
// SORTABLE (Drag & Drop)
// =============================================

function initSortable() {
    const blocksContainer = document.getElementById('blocks-container');
    const questionsContainer = document.getElementById('questions-editor-container');

    if (blocksContainer && typeof Sortable !== 'undefined') {
        new Sortable(blocksContainer, {
            animation: 150,
            handle: '.block-header',
            ghostClass: 'dragging',
            onEnd: () => {
                // Reorder contentBlocks array
                const newOrder = [];
                blocksContainer.querySelectorAll('.content-block').forEach(el => {
                    const block = contentBlocks.find(b => b.id === el.id);
                    if (block) newOrder.push(block);
                });
                contentBlocks = newOrder;
            }
        });
    }

    if (questionsContainer && typeof Sortable !== 'undefined') {
        new Sortable(questionsContainer, {
            animation: 150,
            handle: '.question-header',
            ghostClass: 'dragging',
            onEnd: () => {
                // Reorder questions array
                const newOrder = [];
                questionsContainer.querySelectorAll('.question-block').forEach(el => {
                    const question = questions.find(q => q.id === el.id);
                    if (question) newOrder.push(question);
                });
                questions = newOrder;
                renumberQuestions();
            }
        });
    }
}

// =============================================
// SAVE & PUBLISH
// =============================================

async function saveExerciseDraft() {
    await saveExercise(false);
}

async function publishExercise() {
    await saveExercise(true);
}

async function saveExercise(publish = false) {
    const token = localStorage.getItem('admin_token');

    // Validate
    const title = document.getElementById('exercise-title-input').value.trim();
    const themeId = document.getElementById('exercise-theme-select').value;

    if (!title) {
        alert('Le titre est requis');
        return;
    }
    if (!themeId) {
        alert('La thématique est requise');
        return;
    }

    // Gather all block data
    contentBlocks.forEach(block => updateBlock(block.id));
    questions.forEach(q => updateQuestion(q.id));

    // Build exercise data
    const exerciseData = {
        title,
        description: document.getElementById('exercise-description-input').value,
        theme_id: themeId,
        difficulty: document.getElementById('exercise-difficulty-select').value,
        duration_minutes: parseInt(document.getElementById('exercise-duration-input').value) || 60,
        container_template_id: document.getElementById('exercise-container-select').value || null,
        course_blocks: JSON.stringify(contentBlocks),
        course_content: generateMarkdownContent(),
        is_published: publish ? 1 : 0,
        questions: questions.map((q, i) => ({
            question_text: q.text,
            question_type: q.type === 'qcm_multiple' ? 'qcm' : q.type,
            options: q.options ? JSON.stringify(q.options) : null,
            correct_answer: Array.isArray(q.correctAnswer) ? JSON.stringify(q.correctAnswer) : q.correctAnswer,
            points: q.points || 10,
            hint: q.hint || null,
            order_index: i
        }))
    };

    try {
        const url = currentExercise
            ? `${API_BASE}/api/admin/exercises/${currentExercise.id}`
            : `${API_BASE}/api/admin/exercises`;

        const response = await fetch(url, {
            method: currentExercise ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(exerciseData)
        });

        const data = await response.json();

        if (data.success) {
            alert(publish ? 'Exercice publié avec succès!' : 'Brouillon sauvegardé!');
            closeExerciseEditor();
            loadExercises();
        } else {
            alert(data.error?.message || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Error saving exercise:', error);
        alert('Erreur de connexion au serveur');
    }
}

function generateMarkdownContent() {
    let markdown = '';

    contentBlocks.forEach(block => {
        switch (block.type) {
            case 'heading':
                const hashes = { h1: '#', h2: '##', h3: '###' };
                markdown += `${hashes[block.level] || '##'} ${block.content}\n\n`;
                break;
            case 'paragraph':
                markdown += `${block.content}\n\n`;
                break;
            case 'code':
                markdown += '```' + (block.language || 'bash') + '\n' + block.content + '\n```\n\n';
                break;
            case 'image':
                markdown += `![${block.caption || ''}](${block.url})\n\n`;
                break;
            case 'alert':
                markdown += `> **${block.alertType?.toUpperCase() || 'INFO'}**: ${block.content}\n\n`;
                break;
            case 'list':
                const items = (block.content || '').split('\n').filter(i => i.trim());
                items.forEach((item, i) => {
                    markdown += block.listType === 'ol' ? `${i + 1}. ${item}\n` : `- ${item}\n`;
                });
                markdown += '\n';
                break;
            case 'terminal':
                markdown += '```bash\n' + block.content + '\n```\n\n';
                break;
            case 'divider':
                markdown += '---\n\n';
                break;
            case 'collapsible':
                markdown += `<details>\n<summary>${block.title}</summary>\n\n${block.content}\n\n</details>\n\n`;
                break;
        }
    });

    return markdown;
}

function previewExercise(exerciseId) {
    window.open(`index.html?exercise=${exerciseId}`, '_blank');
}
