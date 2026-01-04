export function setupVariableLinks(staticViewer, getMode) {
    if (!staticViewer) return;

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
            if (getMode() !== 'view') { ev.preventDefault(); return; }

            ev.preventDefault();
            const sanitized = href.replace(/\$|%24/g, '');
            if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || a.getAttribute('target') === '_blank') {
                window.open(sanitized, '_blank');
            } else {
                window.location.href = sanitized;
            }
        });
        staticViewer.dataset.variableDelegateAttached = '1';
    }

    // Find template anchors whose href contains a $ placeholder (handle raw $ or encoded %24)
    const templates = Array.from(staticViewer.querySelectorAll('a')).filter(a => {
        const raw = a.getAttribute('href') || '';
        return /\$|%24/.test(raw);
    });

    if (!templates.length) {
        hideTemplateSearch();
        return;
    }

    // Ensure the inline template search UI is visible and focused
    ensureTemplateSearch(templates);

    // Process each template anchor and convert subsequent lines into variable links
    templates.forEach(templateAnchor => {
        // make templates visually obvious while debugging
        templateAnchor.classList.add('variable-template');
        templateAnchor.setAttribute('data-variable-template', '1');

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
                    break;
                }
                prevWasBR = true;
            } else if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                prevWasBR = false;
                currentNodes.push(node);
            }

            node = node.nextSibling;
        }

        // handle trailing line without following <br>
        if (currentNodes.length) {
            const text = currentNodes.map(n => n.textContent).join('').trim();
            if (text) lines.push({ nodes: currentNodes.slice(), text });
        }

        // Replace each line's nodes with a clickable anchor that opens the template with $ replaced
        lines.forEach(({ nodes, text }) => {
            if (!text) return;

            const a = document.createElement('a');
            a.className = 'variable-link';
            a.textContent = text;
            const rawTemplate = templateAnchor.getAttribute('href') || '';
            const href = rawTemplate.replace(/\$|%24/g, text);
            a.setAttribute('href', href);
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');

            a.addEventListener('click', (ev) => {
                if (getMode() !== 'view') ev.preventDefault();
            });

            const first = nodes[0];
            if (first) {
                const prev = first.previousSibling;
                if (prev && prev.nodeType === Node.TEXT_NODE) {
                    prev.textContent = prev.textContent.replace(/\s+$/, '');
                }
            }

            if (first && first.parentNode) {
                first.parentNode.insertBefore(a, first);
                nodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
            }
        });
    });

    function ensureTemplateSearch(templates) {
        if (!templates || !templates.length) return hideTemplateSearch();
        const templateAnchor = templates[0];
        let container = document.getElementById('templateSearchContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'templateSearchContainer';
            container.innerHTML = `
                <input id="templateSearchInput" placeholder="$ Variable name + Enter ⏎" autocomplete="off" aria-label="Template search input">
            `;
            document.body.appendChild(container);

            const input = container.querySelector('#templateSearchInput');

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    doTemplateSearch(templateAnchor, input.value);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    input.blur();
                }
            });
        }

        container.style.display = 'flex';
        const input = container.querySelector('#templateSearchInput');
        input.value = '';
        setTimeout(() => input.focus(), 50);
        container.dataset.boundTemplate = templateAnchor.getAttribute('href') || '';
    }

    function hideTemplateSearch() {
        const container = document.getElementById('templateSearchContainer');
        if (container) container.style.display = 'none';
    }

    function doTemplateSearch(templateAnchor, value) {
        if (!templateAnchor) return;
        const raw = templateAnchor.getAttribute('href') || '';
        const href = raw.replace(/\$|%24/g, value);
        window.location.href = href;
    }
}
