// ==UserScript==
// @name         YouTube Music Manager
// @namespace    https://github.com/donnyddarko/YoutubeMusicManagerv1.3.5/
// @version      1.3.5
// @description  Progressive selection and controlled elimination of uploads.
// @match        https://music.youtube.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (window.__ytMusicProgressiveSelectInstalled) return;
    window.__ytMusicProgressiveSelectInstalled = true;

    const ROW = 'ytmusic-responsive-list-item-renderer';
    const OVERLAY = '.multi-select-overlay';
    const DELAY_MS = 5;
    const LOAD_WAIT_MS = 900;
    const MAX_STALLS = 7;

    let running = false;
    let runId = 0;
    let clicked = 0;
    let status = 'Ready';

    let deletionPlan = null;
    let deleting = false;
    let abortDeletion = false;

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    const isVisible = el =>
        el.getClientRects().length > 0 &&
        getComputedStyle(el).visibility !== 'hidden';

    const selected = row =>
        row.hasAttribute('is-checked');

    const titleOf = row =>
        row.querySelector('.title')?.textContent?.trim() || '';

    const rows = () =>
        Array.from(document.querySelectorAll(ROW))
        .filter(row => {
            if (!isVisible(row)) return false;
            if (!row.querySelector(OVERLAY)) return false;

            const title = titleOf(row);

            if (
                /^(riproduzione casuale di tutti i brani|shuffle all songs|shuffle all)$/i
                .test(title)
            ) {
                return false;
            }

            return Boolean(title);
        });
    // =====================================================
    // MANUAL STARTING POINT DETECTION
    // =====================================================

    let manualStartRow = null;

    document.addEventListener('pointerdown', event => {
        if (running || deleting) return;

        const row = event.target.closest(ROW);
        if (!row) return;

        const wasSelected = selected(row);

        setTimeout(() => {
            if (!row.isConnected) return;

            if (!wasSelected && selected(row)) {
                manualStartRow = row;
                console.log('[YTM Manager] Starting point:', titleOf(row));
            }

            if (wasSelected && !selected(row) &&
                manualStartRow === row) {
                manualStartRow = null;
            }
        }, 150);

    }, true);

    // =====================================================
    // INTERFACCIA
    // =====================================================

    const panel = document.createElement('div');
    panel.id = 'ytm-progressive-select-panel';
    panel.classList.add('ytmps-minimized');

    function addElement(parent, tag, id, value, className) {
        const element = document.createElement(tag);

        if (id) element.id = id;
        if (value) element.textContent = value;
        if (className) element.className = className;

        parent.appendChild(element);
        return element;
    }

    // Barra superiore

    const topBar = addElement(
        panel, 'div', null, '', 'ytmps-topbar'
    );

    addElement(
        topBar, 'div', null,
        'YouTube Music Manager', 'ytmps-heading'
    );

    const minimizeButton = addElement(
        topBar, 'button', 'ytmps-minimize', '-'
    );

    minimizeButton.type = 'button';
    minimizeButton.textContent = '+';
    minimizeButton.title = 'Espandi pannello';
    // =====================================================
    // SELETTORE MODALITA'
    // =====================================================

    let currentMode = 'selector';

    const modeContainer = addElement(
        panel, 'div', 'ytmps-mode-container'
    );

    const selectorModeButton = addElement(
        modeContainer,
        'button',
        'ytmps-mode-selector',
        'Selector'
    );

    const deleterModeButton = addElement(
        modeContainer,
        'button',
        'ytmps-mode-deleter',
        'Deleter'
    );

    selectorModeButton.type = 'button';
    deleterModeButton.type = 'button';
    // =====================================================
    // GRAPHIC MANAGEMENT MODE
    // =====================================================

    function updateModeButtons() {
        const isSelector = currentMode === 'selector';

        // Evidenzia la modalità attiva
        selectorModeButton.classList.toggle('active', isSelector);
        deleterModeButton.classList.toggle('active', !isSelector);


        // Aspetto delle sezioni inattive
        selectorSection.classList.toggle('ytmps-inactive', !isSelector);
        deleterSection.classList.toggle('ytmps-inactive', isSelector);

        // Abilitazione dei comandi
        startButton.disabled = !isSelector || running || deleting;
        stopButton.disabled = !isSelector || !running;

        previewButton.disabled = isSelector || deleting;
        deleteButton.disabled = isSelector || deleting;
        abortButton.disabled = isSelector || !deleting;

        selectorResetButton.disabled = !isSelector || deleting;
        deleterResetButton.disabled = isSelector || deleting;

        deletionCount.disabled = isSelector || deleting;
    }


    function changeMode(newMode) {
        if (currentMode === newMode) return;

        if (deleting) {
            setDeleteStatus(
                'Wait for the deletion process to finish.'
            );
            return;
        }

        if (running) {
            stop('Selection interrupted by mode change.');
        }

        currentMode = newMode;

        clicked = 0;
        manualStartRow = null;
        deletionPlan = null;
        abortDeletion = false;
        deletionPreview.scrollTop = 0;
        deletionCount.value = '1';
        deletionPreview.textContent =
            'Select at least one track to begin.';

        setDeleteStatus('No deletion in progress.');

        update('Ready');
        updateModeButtons();
    }

    selectorModeButton.addEventListener('click', () => {
        changeMode('selector');
    });

    deleterModeButton.addEventListener('click', () => {
        changeMode('deleter');
    });


    // =====================================================
    // CONTENITORE SELEZIONATORE
    // =====================================================

    const selectorSection = addElement(
        panel, 'div', 'ytmps-selector-section'
    );
    addElement(
        panel, 'div', 'ytmps-status', 'Ready'
    );

    const counter = addElement(
        panel, 'div', null,
        'Selected from the tool: ', 'ytmps-count'
    );

    addElement(counter, 'b', 'ytmps-count-value', '0');

    const buttons = addElement(
        panel, 'div', null, '', 'ytmps-buttons'
    );

    const startButton = addElement(
        buttons, 'button', 'ytmps-start', 'Start'
    );

    const stopButton = addElement(
        buttons, 'button', 'ytmps-stop', 'Stop'
    );

    startButton.type = 'button';
    stopButton.type = 'button';
    stopButton.disabled = true;

    addElement(
        panel, 'div', null,
        '"F8" Start - "ENTER" Stop', 'ytmps-hint'
    );
    // =====================================================
    // CONTENITORE ELIMINATORE
    // =====================================================

    const deleterSection = addElement(
        panel, 'div', 'ytmps-deleter-section'
    );
    // =====================================================
    // SEZIONE ELIMINAZIONE
    // =====================================================

    const deletionTitle = addElement(
        panel, 'div', null,
        'Uploads removal', 'ytmps-heading'
    );

    deletionTitle.style.marginTop = '14px';

    addElement(
        panel, 'div', null,
        'Select the first track to start with.',
        'ytmps-hint'
    );

    const deletionLabel = addElement(
        panel, 'label', null,
        'Number of tracks to delete'
    );

    const deletionCount = addElement(
        deletionLabel, 'input', 'ytmps-delete-count'
    );

    deletionCount.type = 'number';
    deletionCount.min = '1';
    deletionCount.max = '5000';
    deletionCount.value = '1';

    deletionCount.style.cssText =
        'box-sizing:border-box;width:100%;padding:7px;' +
        'margin:5px 0 7px;border-radius:6px;' +
        'border:1px solid #777;background:#111;color:white';

    deleterSection.appendChild(deletionLabel);

    const deletionPreview = addElement(
        panel, 'div', 'ytmps-delete-preview',
        'Select at least one track to begin.'
    );

    deletionPreview.style.cssText =
        'max-height:120px;overflow:auto;' +
        'white-space:pre-line;color:#ccc;font-size:11px';

    const deletionButtons = addElement(
        panel, 'div', null, '', 'ytmps-buttons'
    );

    const previewButton = addElement(
        deletionButtons, 'button',
        'ytmps-preview', 'Preview'
    );

    const deleteButton = addElement(
        deletionButtons, 'button',
        'ytmps-delete', 'Delete'
    );

    deleteButton.style.background = '#ff6666';

    const abortButton = addElement(
        panel, 'button', 'ytmps-abort-delete',
        'Interrupt deletion'
    );

    abortButton.style.cssText =
        'width:100%;margin-top:6px;background:#c77';

    abortButton.disabled = true;

    const deletionStatus = addElement(
        panel, 'div', 'ytmps-delete-status',
        'No deletion in progress.'
    );

    deletionStatus.style.cssText =
        'margin-top:7px;color:#ddd;font-size:11px';

    // =====================================================
    // STILE GRAFICO
    // =====================================================

    const style = document.createElement('style');

    style.textContent = [
        '#ytm-progressive-select-panel {',
        'position:fixed;',
        'z-index:2147483646;',
        'right:18px;',
        'bottom:108px;',
        'width:300px;',
        'box-sizing:border-box;',
        'padding:13px 14px;',
        'background:rgba(34,34,34,0.85);',
        'color:#fff;',
        'border:1px solid #666;',
        'border-radius:12px;',
        'box-shadow:0 4px 20px #0009;',
        'font:13px/1.5 Arial,sans-serif;',
        '}',

        '#ytm-progressive-select-panel .ytmps-heading {',
        'font-size:14px;',
        'font-weight:700;',
        'margin-bottom:5px;',
        '}',

        '#ytm-progressive-select-panel .ytmps-count {',
        'margin-top:4px;',
        '}',

        '#ytm-progressive-select-panel .ytmps-buttons {',
        'display:flex;',
        'gap:8px;',
        'margin-top:10px;',
        '}',

        '#ytm-progressive-select-panel button {',
        'flex:1;',
        'min-height:32px;',
        'border:0;',
        'border-radius:7px;',
        'background:#eee;',
        'color:#111;',
        'cursor:pointer;',
        'font-weight:700;',
        '}',

        '#ytm-progressive-select-panel #ytmps-stop {',
        'background:#ff6666;',
        '}',

        '#ytm-progressive-select-panel button:disabled {',
        'opacity:.4;',
        'cursor:default;',
        '}',

        '#ytm-progressive-select-panel .ytmps-hint {',
        'color:#bbb;',
        'font-size:11px;',
        'margin-top:9px;',
        '}',

        '#ytm-progressive-select-panel .ytmps-topbar {',
        'display:flex;',
        'align-items:center;',
        'justify-content:space-between;',
        'gap:10px;',
        '}',

        '#ytm-progressive-select-panel .ytmps-topbar .ytmps-heading {',
        'margin-bottom:0;',
        '}',

        '#ytm-progressive-select-panel #ytmps-minimize {',
        'flex:0 0 28px;',
        'width:28px;',
        'min-height:28px;',
        'padding:0;',
        'background:#444;',
        'color:white;',
        'font-size:18px;',
        'border-radius:6px;',
        '}',

        '#ytm-progressive-select-panel.ytmps-minimized {',
        'width:auto;',
        'min-width:190px;',
        'padding:8px 10px;',
        '}',

        '#ytm-progressive-select-panel.ytmps-minimized > :not(.ytmps-topbar) {',
        'display:none;',
        '}',

        '#ytm-progressive-select-panel.ytmps-minimized .ytmps-topbar .ytmps-heading {',
        'font-size:12px;',
        '}',
        '#ytm-progressive-select-panel .ytmps-topbar {',
        'cursor:move;',
        'user-select:none;',
        'touch-action:none;',
        '}',

        '#ytm-progressive-select-panel .ytmps-topbar button {',
        'cursor:pointer;',
        '}',
        // =====================================================
        // MODE SELECTOR
        // =====================================================

        '#ytmps-mode-container {',
        'display:flex;',
        'gap:4px;',
        'margin:12px 0;',
        'padding:4px;',
        'background:#111;',
        'border-radius:8px;',
        '}',

        '#ytm-progressive-select-panel #ytmps-mode-container button {',
        'flex:1;',
        'padding:8px 5px;',
        'border-radius:6px;',
        'background:transparent;',
        'color:#aaa;',
        'font-size:12px;',
        'font-weight:700;',
        'transition:background 0.2s,color 0.2s;',
        '}',

        '#ytm-progressive-select-panel #ytmps-mode-container button.active {',
        'background:#fff;',
        'color:#111;',
        'box-shadow:0 0 7px #ffffff55;',
        '}',
        '#ytm-progressive-select-panel .ytmps-inactive {',
        'opacity:0.35;',
        'filter:grayscale(1);',
        '}',

        '#ytm-progressive-select-panel .ytmps-inactive button,',
        '#ytm-progressive-select-panel .ytmps-inactive input {',
        'pointer-events:none;',
        '}',
        '#ytm-progressive-select-panel .ytmps-reset {',
        'display:block;',
        'width:100%;',
        'margin-top:12px;',
        'background:#444;',
        'color:#fff;',
        'border:1px solid #666;',
        '}'
    ].join('\n');


    // =====================================================
    // RESET BUTTONS
    // =====================================================

    const selectorResetButton = addElement(
        selectorSection,
        'button',
        'ytmps-reset-selector',
        'Reset'
    );

    const deleterResetButton = addElement(
        deleterSection,
        'button',
        'ytmps-reset-deleter',
        'Reset'
    );

    selectorResetButton.type = 'button';
    deleterResetButton.type = 'button';

    selectorResetButton.classList.add('ytmps-reset');
    deleterResetButton.classList.add('ytmps-reset');
    // =====================================================
    // PANEL DRAGGING
    // =====================================================

    const dragHandle = topBar;
    const POSITION_KEY = 'ytm-manager-panel-position';

    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let panelStartX = 0;
    let panelStartY = 0;

    function setPanelPosition(x, y) {
        const maxX = Math.max(0, window.innerWidth - panel.offsetWidth);
        const maxY = Math.max(0, window.innerHeight - panel.offsetHeight);

        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    }

    function savePanelPosition() {
        const rect = panel.getBoundingClientRect();

        localStorage.setItem(
            POSITION_KEY,
            JSON.stringify({
                x: rect.left,
                y: rect.top
            })
        );
    }

    function restorePanelPosition() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(POSITION_KEY)
            );

            if (saved &&
                Number.isFinite(saved.x) &&
                Number.isFinite(saved.y)) {
                setPanelPosition(saved.x, saved.y);
            }
        } catch (error) {
            console.warn('Posizione pannello non ripristinabile:', error);
        }
    }

    dragHandle.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        if (event.target.closest('button')) return;

        const rect = panel.getBoundingClientRect();

        dragging = true;

        dragStartX = event.clientX;
        dragStartY = event.clientY;

        panelStartX = rect.left;
        panelStartY = rect.top;

        dragHandle.setPointerCapture(event.pointerId);

        event.preventDefault();
    });

    dragHandle.addEventListener('pointermove', event => {
        if (!dragging) return;

        const deltaX = event.clientX - dragStartX;
        const deltaY = event.clientY - dragStartY;

        setPanelPosition(
            panelStartX + deltaX,
            panelStartY + deltaY
        );
    });

    function stopDragging(event) {
        if (!dragging) return;

        dragging = false;

        if (dragHandle.hasPointerCapture(event.pointerId)) {
            dragHandle.releasePointerCapture(event.pointerId);
        }

        savePanelPosition();
    }

    dragHandle.addEventListener('pointerup', stopDragging);
    dragHandle.addEventListener('pointercancel', stopDragging);

    window.addEventListener('resize', () => {
        const rect = panel.getBoundingClientRect();
        setPanelPosition(rect.left, rect.top);
        savePanelPosition();
    });
    // =====================================================
    // MINIMIZZAZIONE
    // =====================================================

    minimizeButton.addEventListener('click', () => {
        const minimized = panel.classList.toggle(
            'ytmps-minimized'
        );

        minimizeButton.textContent = minimized ? '+' : '-';

        minimizeButton.title = minimized ?
            'Expand Panel' :
            'Minimize Panel';
    });

    function mount() {
        if (!document.head.contains(style)) {
            document.head.appendChild(style);
        }

        if (!document.body.contains(panel)) {
            document.body.appendChild(panel);
        }
    }

    function update(message = status) {
        status = message;

        panel.querySelector('#ytmps-status').textContent =
            status;

        panel.querySelector('#ytmps-count-value').textContent =
            String(clicked);

        startButton.disabled =
            currentMode !== 'selector' || running || deleting;

        stopButton.disabled =
            currentMode !== 'selector' || !running;
    }

    function stop(
        message = 'Interrupted. Selection maintained.'
    ) {
        if (!running) return;

        running = false;
        runId++;

        manualStartRow = null;

        update(message);
    }

    // =====================================================
    // AUTOMATIC SCROLLING
    // =====================================================

    function scrollContainer(element) {
        for (
            let node = element.parentElement; node && node !== document.body; node = node.parentElement
        ) {
            const css = getComputedStyle(node);

            if (
                /(auto|scroll)/.test(css.overflowY) &&
                node.scrollHeight > node.clientHeight + 10
            ) {
                return node;
            }
        }

        return document.scrollingElement ||
            document.documentElement;
    }

    function advanceScroll(lastRow) {
        const scroller = scrollContainer(lastRow);
        const before = scroller.scrollTop;

        lastRow.scrollIntoView({
            block: 'end',
            behavior: 'instant'
        });

        scroller.scrollTop += Math.max(
            250,
            Math.round(scroller.clientHeight * 0.7)
        );

        return scroller.scrollTop !== before;
    }

    // =====================================================
    // PROGRESSIVE SELECTION
    // =====================================================

    async function start() {
        if (currentMode !== 'selector') return;
        if (running || deleting) return;

        mount();

        const available = rows();

        if (!available.length) {
            update('No box found.');
            return;
        }

        let startIndex = manualStartRow ?
            available.indexOf(manualStartRow) :
            -1;

        // Fallback: first track selected in the list
        if (startIndex === -1) {
            startIndex = available.findIndex(row => selected(row));
        }

        if (startIndex === -1) {
            update('Select at least one track to start with.');
            return;
        }

        manualStartRow = available[startIndex];

        running = true;
        const currentRun = ++runId;

        clicked = 0;

        let stalls = 0;
        let previousSignature = '';

        let selectionStarted = false;
        let lastSelectedRow = manualStartRow;
        manualStartRow = null;
        // Gestione dello scorrimento dinamico
        let awaitingScroll = false;
        let lastScrollPosition = 0;

        update('Selecting...');

        while (running && currentRun === runId) {
            const list = rows();

            let lastIndex = list.indexOf(lastSelectedRow);

            if (lastIndex === -1) {
                if (!awaitingScroll) {
                    stop('Starting point no longer available.');
                    break;
                }

                // The previous row might have been
                // removed from the DOM during scrolling.
                // We do not select unknown rows.

                update('I am checking the newly uploaded rows...');
                await sleep(LOAD_WAIT_MS);

                if (currentRun !== runId || !running) break;

                stop('Reference lost during scrolling.');
                break;
            }

            awaitingScroll = false;

            const next = list
                .slice(lastIndex + 1)
                .find(row => !selected(row));

            if (next) {
                const overlay = next.querySelector(OVERLAY);

                if (!overlay) {
                    stop('Box not found.');
                    break;
                }

                next.scrollIntoView({
                    block: 'nearest',
                    behavior: 'instant'
                });

                await sleep(70);

                if (!running || currentRun !== runId) break;

                if (!selected(next)) overlay.click();

                await sleep(DELAY_MS);

                if (!running || currentRun !== runId) break;

                if (selected(next)) {
                    clicked++;
                    stalls = 0;

                    lastSelectedRow = next;
                    selectionStarted = true;

                    update('Selecting...');
                } else {
                    stop('Selection not confirmed.');
                }

                continue;
            }

            if (!list.length) {
                stop('List not available.');
                break;
            }

            const last = list[list.length - 1];

            const signature =
                list.length + ':' + titleOf(last);

            // Store the position before scrolling
            const scroller = scrollContainer(last);
            lastScrollPosition = scroller.scrollTop;

            // Requires scrolling
            awaitingScroll = true;

            const moved = advanceScroll(last);

            // Check if the position has changed
            const newScrollPosition = scroller.scrollTop;

            if (!moved && newScrollPosition === lastScrollPosition) {
                awaitingScroll = false;
            }

            update('I’m looking for other tracks as I scroll...');

            await sleep(LOAD_WAIT_MS);

            if (!running || currentRun !== runId) break;

            const newList = rows();
            const newLast = newList[newList.length - 1];

            const newSignature =
                newList.length + ':' +
                (newLast ? titleOf(newLast) : '');

            stalls = (
                moved ||
                signature !== previousSignature ||
                newSignature !== signature
            ) ? 0 : stalls + 1;

            previousSignature = signature;

            if (stalls >= MAX_STALLS) {
                awaitingScroll = false;

                stop(
                    'End of list reached. ' +
                    'Selected in this session:' +
                    clicked + ' tracks.'
                );

                break;
            }
        }
    }

    startButton.addEventListener('click', start);
    stopButton.addEventListener('click', () => stop());

    // =====================================================
    // PREPARAZIONE ELIMINAZIONE
    // =====================================================

    function setDeleteStatus(message) {
        deletionStatus.textContent = message;
    }

    function invalidateDeletionPlan() {
        deletionPlan = null;
    }

    function prepareDeletion() {
        if (currentMode !== 'deleter') return false;
        if (deleting) return false;

        invalidateDeletionPlan();

        if (running) {
            setDeleteStatus(
                'Stop the progressive selection first.'
            );
            return false;
        }

        if (
            !location.pathname.includes('/library/uploaded_songs') &&
            !location.pathname.includes('/playlist')
        ) {
            setDeleteStatus(
                'Open Library > Uploads > Songs.'
            );
            return false;
        }

        const count = Number(deletionCount.value);

        if (
            !Number.isInteger(count) ||
            count < 1 ||
            count > 5000
        ) {
            setDeleteStatus(
                'Enter an integer from 1 to 5000.'
            );
            return false;
        }

        const available = rows();

        // First track selected in the list

        const startIndex = available.findIndex(
            row => selected(row)
        );

        // Block if no initial selection exists

        if (startIndex === -1) {
            deletionPreview.textContent =
                'No track selected.';

            setDeleteStatus(
                'ERROR: You must select at least one track ' +
                'before starting the deletion.'
            );

            return false;
        }

        // Retrieve N elements starting from the first selected one

        const candidates = available.slice(
            startIndex,
            startIndex + count
        );

        if (candidates.length < count) {
            setDeleteStatus(
                'Only ' + candidates.length + ' rows are available ' +
                'from the first selected item. ' +
                'Load more rows or reduce N.'
            );

            return false;
        }

        const titles = candidates.map(titleOf);

        deletionPlan = {
            startIndex: startIndex,
            count: count,
            titles: titles,
            anchor: available[startIndex],
            candidateRows: candidates.slice()
        };

        const sample = titles
            .slice(0, 10)
            .map((title, index) =>
                (index + 1) + '. ' + title
            );

        if (count > 10) {
            sample.push('... and other ' + (count - 10) + ' tracks');
        }

        deletionPreview.textContent = sample.join('\n');

        setDeleteStatus(
            count + 'Tracks ready. Start: "' +
            titles[0] + '".'
        );

        return true;
    }

    // =====================================================
    // AWAITING ELEMENTS
    // =====================================================

    async function until(find, timeoutMs = 4500) {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            if (abortDeletion) return null;

            const result = find();

            if (result) return result;

            await sleep(100);
        }

        return null;
    }

    function visibleDialog() {
        return Array.from(
            document.querySelectorAll('yt-confirm-dialog-renderer')
        ).find(dialog =>
            (
                dialog.textContent.includes('Eliminare il brano?') ||
                dialog.textContent.includes('Delete song?')
            ) &&
            Array.from(dialog.querySelectorAll('button'))
            .some(button =>
                isVisible(button) && ['Elimina', 'Delete'].includes(button.textContent.trim())
            )
        );
    }

    // =====================================================
    // DELETING A SINGLE TRACK
    // =====================================================

    async function deleteOne(expectedTitle, targetIndex) {
        const list = rows();
        const row = list[targetIndex];

        if (!row || titleOf(row) !== expectedTitle) {
            throw new Error(
                'The list has changed. Expected:"' +
                expectedTitle + '".'
            );
        }

        row.scrollIntoView({
            block: 'center',
            behavior: 'instant'
        });

        const menuButton = row.querySelector(
            'ytmusic-menu-renderer button[aria-label="Menu Azione"], ' +
            'ytmusic-menu-renderer button[aria-label="Action menu"]'
        );

        if (!menuButton) {
            throw new Error(
                'Action menu button not found.'
            );
        }

        menuButton.click();

        const menuItem = await until(() =>
            Array.from(document.querySelectorAll(
                'ytmusic-menu-popup-renderer #items > ' +
                'ytmusic-menu-navigation-item-renderer'
            )).find(el =>
                isVisible(el) && ['Elimina brano', 'Delete song'].includes(el.textContent.trim())
            )
        );

        if (!menuItem || abortDeletion) {
            throw new Error(
                'Deletion interrupted or menu unavailable.'
            );
        }

        (
            menuItem.querySelector('#navigation-endpoint') ||
            menuItem
        ).click();

        const dialog = await until(visibleDialog);

        if (!dialog || abortDeletion) {
            throw new Error(
                'Confirmation window not available.'
            );
        }

        const normalize = value =>
            value.replace(/\s+/g, ' ')
            .trim()
            .toLocaleLowerCase();

        if (
            !normalize(dialog.textContent)
            .includes(normalize(expectedTitle))
        ) {
            throw new Error(
                'The title in the confirmation does not match.'
            );
        }

        const confirmButton = Array.from(
            dialog.querySelectorAll('button')
        ).find(button =>
            isVisible(button) && ['Elimina', 'Delete'].includes(button.textContent.trim())
        );

        if (!confirmButton || abortDeletion) {
            throw new Error(
                'Confirmation not available.'
            );
        }

        // Automatic confirmation for the YouTube Music window

        confirmButton.click();

        setDeleteStatus(
            'Confirmation sent: ' + expectedTitle
        );

        // Verify that the row has been removed

        const isPlaylist = location.pathname.includes('/playlist');

        const removed = await until(() =>
            !visibleDialog() &&
            (isPlaylist || !row.isConnected),
            12000
        );

        if (!removed) {
            throw new Error(
                'Removal not confirmed within 12 seconds.'
            );
        }
    }

    // =====================================================
    // ELIMINATION CYCLE
    // =====================================================

    async function runDeletion() {
        if (currentMode !== 'deleter') return;
        if (deleting) return;

        // Always check the current selection

        if (!prepareDeletion()) return;

        const plan = deletionPlan;

        // Mandatory confirmation before deletions

        const confirmed = window.confirm(
            'Are you sure you want to delete?\n\n' +
            'This operation will permanently remove ' + plan.count + ' tracks from the library!'
        );

        if (!confirmed) {
            setDeleteStatus(
                'Deletion cancelled by the user.'
            );

            invalidateDeletionPlan();
            return;
        }

        // Re-check the list after confirmation

        const freshList = rows();

        if (
            freshList[plan.startIndex] !== plan.anchor ||
            !selected(plan.anchor) ||
            plan.candidateRows.some((row, index) =>
                freshList[plan.startIndex + index] !== row
            )
        ) {
            setDeleteStatus(
                'The selection or list has changed. ' +
                'Please repeat the operation.'
            );

            invalidateDeletionPlan();
            return;
        }

        deleting = true;
        selectorResetButton.disabled = true;
        deleterResetButton.disabled = true;
        abortDeletion = false;
        selectorModeButton.disabled = true;
        deleterModeButton.disabled = true;
        previewButton.disabled = true;
        deleteButton.disabled = true;
        abortButton.disabled = false;
        startButton.disabled = true;

        let completed = 0;

        try {
            const isPlaylist = location.pathname.includes('/playlist');

            for (const expectedTitle of plan.titles) {
                if (abortDeletion) break;

                setDeleteStatus(
                    'Deletion ' +
                    (completed + 1) + '/' +
                    plan.count + ': ' +
                    expectedTitle
                );

                const targetIndex = isPlaylist ?
                    plan.startIndex + completed :
                    plan.startIndex;

                await deleteOne(
                    expectedTitle,
                    targetIndex
                );

                completed++;

                await sleep(450);
            }

            setDeleteStatus(
                (abortDeletion ? 'Interrupted' : 'Terminated') +
                ': ' + completed + '/' +
                plan.count + ' deletions confirmed.'
            );

            // Refresh playlist after successful completion
            if (
                location.pathname.includes('/playlist') &&
                !abortDeletion &&
                completed === plan.count
            ) {
                await sleep(1000);
                location.reload();
            }

        } catch (error) {
            setDeleteStatus(
                'STOP after ' + completed +
                ' deletions: ' + error.message
            );

        } finally {
            deleting = false;
            abortButton.disabled = true;
            previewButton.disabled = false;
            deleteButton.disabled = false;
            startButton.disabled =
                currentMode !== 'selector' || running || deleting;
            selectorResetButton.disabled = false;
            deleterResetButton.disabled = false;
            selectorModeButton.disabled = false;
            deleterModeButton.disabled = false;
            invalidateDeletionPlan();
        }
    }

    // =====================================================
    // INTERFACE EVENTS
    // =====================================================
    // =====================================================
    // PAGE RESET
    // =====================================================

    function resetPage() {
        if (deleting) {
            setDeleteStatus(
                'Cannot reset during a deletion.'
            );
            return;
        }

        if (running) {
            const confirmed = window.confirm(
                'The selection is still in progress.\n\n' +
                'Do you want to stop it and reload the page?'
            );

            if (!confirmed) return;

            stop('Selection interrupted by Reset.');
        }

        window.location.reload();
    }

    selectorResetButton.addEventListener('click', resetPage);
    deleterResetButton.addEventListener('click', resetPage);
    previewButton.addEventListener(
        'click', prepareDeletion
    );

    deleteButton.addEventListener(
        'click', runDeletion
    );

    abortButton.addEventListener('click', () => {
        abortDeletion = true;

        setDeleteStatus(
            'Interruzione richiesta.'
        );
    });

    deletionCount.addEventListener(
        'input', invalidateDeletionPlan
    );

    // =====================================================
    // KEYBOARD SHORTCUTS
    // =====================================================

    document.addEventListener('keydown', event => {
        if (
            event.key === 'Enter' &&
            running &&
            !event.repeat
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            stop();
        } else if (
            event.key === 'F8' &&
            currentMode === 'selector' &&
            !event.repeat &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey
        ) {
            if (
                event.target?.matches?.(
                    'input,textarea,[contenteditable="true"]'
                )
            ) {
                return;
            }

            event.preventDefault();

            if (!running && !deleting) start();
        }
    }, true);

    // =====================================================
    // NAVIGATION MONITORING
    // =====================================================

    let lastUrl = location.href;

    setInterval(() => {
        mount();

        if (location.href !== lastUrl) {
            lastUrl = location.href;

            stop(
                'Navigation detected: selection interrupted.'
            );

            if (deleting) {
                abortDeletion = true;
            }

            invalidateDeletionPlan();
            manualStartRow = null;

            deletionPreview.textContent =
                'Select at least one track to begin.';

            if (!deleting) {
                setDeleteStatus('No deletion in progress.');
            }
        }
    }, 1500);

    mount();
    update();
    restorePanelPosition();
    updateModeButtons();
})();
