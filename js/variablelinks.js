import { staticViewer, currentMode } from './editor.js';



export function setupVariableLinks() {
    if (!staticViewer) return;

    console.log('[variableLinks] setupVariableLinks start', { staticViewerExists: !!staticViewer });

    // Attach a single delegated click handler to the static viewer (runs once)
    if (!staticViewer.dataset.variableDelegateAttached) {
        staticViewer.addEventListener('click', (ev) => {
            const a = ev.target.closest && ev.target.closest('a');
            if (!a || !staticViewer.contains(a)) return;
            const href = a.getAttribute('href') || '';

            // Only handle template anchors (raw $ or encoded %24), or anchors explicitly marked as templates
            if (!/\$|%24/.test(href) && !a.dataset.variableTemplate) return;

            // Don't intercept anchors we created for variables (they should behave normally)
            if (a.classList.contains('variable-link')) return;

            // Only handle in view mode
            if (currentMode !== 'view') { ev.preventDefault(); return; }

            ev.preventDefault();
            const sanitized = href.replace(/\$|%24/g, '');
            console.log('[variableLinks] intercepted template anchor click', { href, sanitized, clicked: ev.target });
            if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || a.getAttribute('target') === '_blank') {
                window.open(sanitized, '_blank');
            } else {
                window.location.href = sanitized;
            }
        });
        staticViewer.dataset.variableDelegateAttached = '1';
        console.log('[variableLinks] attached delegated click handler');
    }

    // Find template anchors whose href contains a $ placeholder (handle raw $ or encoded %24)
    const templates = Array.from(staticViewer.querySelectorAll('a')).filter(a => {
        const raw = a.getAttribute('href') || '';
        return /\$|%24/.test(raw);
    });
    console.log('[variableLinks] templates found', templates.length, templates.map(a => a.getAttribute('href')));
    if (!templates.length) {
        console.log('[variableLinks] no templates found');
        // ensure any existing template search is hidden
        hideTemplateSearch();
        return;
    }

    // Ensure the inline template search UI is visible and focused
    ensureTemplateSearch(templates);

    // Process each template anchor and convert subsequent lines into variable links
    templates.forEach(templateAnchor => {
        console.log('[variableLinks] template anchor', templateAnchor.getAttribute('href'));
        // make templates visually obvious while debugging
        templateAnchor.classList.add('variable-template');
        templateAnchor.setAttribute('data-variable-template', '1');
        console.log('[variableLinks] added debug class to template anchor');

        // Remove any previously-inserted variable-link spans to avoid duplicates
        Array.from(staticViewer.querySelectorAll('.variable-link')).forEach(el => el.remove());

        // Walk siblings after the anchor and collect lines until a blank paragraph or next anchor
        const lines = []; // each item: {nodes: [Node,...], text: '...' }
        let currentNodes = [];
        let node = templateAnchor.nextSibling;
        let prevWasBR = false;
        let started = false; // whether we've started collecting non-empty lines

        // Skip leading blank nodes (BRs or whitespace-only text nodes)
        while (node && ((node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') || (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()))) {
            node = node.nextSibling;
        }

        while (node) {
            // If we hit another anchor that looks like a template (contains $ or %24), stop and defer to that template
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
                const href = node.getAttribute && (node.getAttribute('href') || '');
                if (/\$|%24/.test(href) || node.dataset && node.dataset.variableTemplate) {
                    break;
                }
                // otherwise it's an inline anchor (likely linkified variable) — include it
            }

            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
                // end of a line
                if (currentNodes.length) {
                    const text = currentNodes.map(n => n.textContent).join('').trim();
                    if (text) {
                        lines.push({ nodes: currentNodes.slice(), text });
                        started = true;
                    }
                }
                currentNodes = [];

                if (prevWasBR && started) {
                    // two consecutive <br> after we've collected lines => blank paragraph => stop processing
                    break;
                }
                prevWasBR = true;
            } else if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                prevWasBR = false;
                // include text nodes and inline elements (span, strong, a, etc.)
                currentNodes.push(node);
            }

            node = node.nextSibling;
        }

        // handle trailing line without following <br>
        if (currentNodes.length) {
            const text = currentNodes.map(n => n.textContent).join('').trim();
            if (text) lines.push({ nodes: currentNodes.slice(), text });
        }

        console.log('[variableLinks] collected lines for template', templateAnchor.getAttribute('href'), lines.map(l => l.text));

        // Replace each line's nodes with a clickable anchor that opens the template with $ replaced
        lines.forEach(({ nodes, text }) => {
            // Skip if nothing meaningful
            if (!text) return;

            // Create anchor element so it uses default link styling
            const a = document.createElement('a');
            a.className = 'variable-link';
            a.textContent = text;
            // Insert literal characters of the variable (no URI-encoding) per request
            // Also replace encoded %24 if present in the attribute value
            const rawTemplate = templateAnchor.getAttribute('href') || '';
            const href = rawTemplate.replace(/\$|%24/g, text);
            a.setAttribute('href', href);
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');

            // Prevent activation while in edit mode
            a.addEventListener('click', (ev) => {
                if (currentMode !== 'view') ev.preventDefault();
            });
            console.debug('[variableLinks] created variable anchor', { text, href });

            // Trim any trailing whitespace on the node immediately before insertion to avoid leading gap
            const first = nodes[0];
            if (first) {
                const prev = first.previousSibling;
                if (prev && prev.nodeType === Node.TEXT_NODE) {
                    prev.textContent = prev.textContent.replace(/\s+$/, '');
                }
            }

            // Insert anchor and remove the original nodes that made up the line
            if (first && first.parentNode) {
                first.parentNode.insertBefore(a, first);
                nodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
            }
        });
    });

    // --- Template search UI helpers ---
    function ensureTemplateSearch(templates) {
        if (!templates || !templates.length) return hideTemplateSearch();
        const templateAnchor = templates[0]; // use first template by default
        let container = document.getElementById('templateSearchContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'templateSearchContainer';
            container.innerHTML = `
                <input id="templateSearchInput" placeholder="Search or type value and press Enter" autocomplete="off" aria-label="Template search input">
                <button id="templateSearchBtn" aria-label="Go">Go</button>
            `;
            document.body.appendChild(container);

            const input = container.querySelector('#templateSearchInput');
            const btn = container.querySelector('#templateSearchBtn');

            btn.addEventListener('click', () => doTemplateSearch(templateAnchor, input.value));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    doTemplateSearch(templateAnchor, input.value);
                }
            });
        }

        // Show and autofocus
        container.style.display = 'flex';
        const input = container.querySelector('#templateSearchInput');
        input.value = '';
        setTimeout(() => input.focus(), 50);
        // annotate the container with which template it's bound to
        container.dataset.boundTemplate = templateAnchor.getAttribute('href') || '';
    }

    function hideTemplateSearch() {
        const container = document.getElementById('templateSearchContainer');
        if (container) container.style.display = 'none';
    }

    function doTemplateSearch(templateAnchor, value) {
        if (!templateAnchor) return;
        const raw = templateAnchor.getAttribute('href') || '';
        // Replace all occurrences of $ or encoded %24 with the literal value
        const href = raw.replace(/\$|%24/g, value);
        // Navigate in same tab
        window.location.href = href;
    }
}

