import { db } from './firebase.js';
import { ref as dbRef, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { staticViewer, currentMode } from './editor.js';
import { formatTextForView } from './regex.js';

// Map of variableName -> { unsubscribe: fn, elements: Set<HTMLElement> }
const variableRegistry = new Map();

export function setupVariables() {
    if (!staticViewer) return;
    if (currentMode !== 'view') return;

    // Clear any previous placeholders and listeners for elements that no longer exist
    cleanupStalePlaceholders();

    // Walk the DOM and replace $tokens in text nodes with placeholder spans
    const walker = document.createTreeWalker(staticViewer, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            // Skip empty text nodes
            if (!node.nodeValue || !/\$|%24/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;

            // Don't process text nodes that are inside anchors or inside variable placeholders or templates
            let el = node.parentElement;
            while (el) {
                if (el.tagName === 'A') return NodeFilter.FILTER_REJECT;
                if (el.classList && (el.classList.contains('variable-placeholder') || el.classList.contains('variable-template') || el.classList.contains('variable-link') || el.classList.contains('variable-candidate'))) return NodeFilter.FILTER_REJECT;
                el = el.parentElement;
            }

            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(node => {
        const parts = [];
        const text = node.nodeValue;
        // regex to match $word or %24word where word is alphanumeric, dash or underscore
        const re = /(?:\$|%24)([A-Za-z0-9\-_]+)/g;
        let lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
            const idx = m.index;
            const name = m[1];
            if (idx > lastIndex) parts.push(document.createTextNode(text.slice(lastIndex, idx)));

            // create placeholder span
            const span = document.createElement('span');
            span.className = 'variable-placeholder';
            span.setAttribute('data-var', name);
            span.textContent = '…'; // loading indicator
            parts.push(span);

            // ensure we have a listener for this variable
            attachVariableListener(name, span);

            lastIndex = re.lastIndex;
        }

        if (parts.length) {
            if (lastIndex < text.length) parts.push(document.createTextNode(text.slice(lastIndex)));
            const frag = document.createDocumentFragment();
            parts.forEach(p => frag.appendChild(p));
            node.parentNode.replaceChild(frag, node);
        }
    });
}

function attachVariableListener(name, element) {
    const key = name.toLowerCase();
    let entry = variableRegistry.get(key);
    if (!entry) {
        entry = { unsubscribe: null, elements: new Set() };
        variableRegistry.set(key, entry);

        const ref = dbRef(db, 'notes/' + key);
        // subscribe and update all associated elements when value changes
        const unsub = onValue(ref, snapshot => {
            const val = snapshot.val();
            const html = formatTextForView(typeof val === 'string' ? val : '');
            // update DOM for all placeholders bound to this variable
            entry.elements.forEach(el => {
                // Replace inner content; keep placeholder span but set innerHTML
                el.classList.add('variable-resolved');
                // if result is empty, show nothing (remove contents)
                el.innerHTML = html || '';
            });
        }, err => {
            console.error('[variables] error fetching', name, err);
        });

        entry.unsubscribe = unsub;
    }

    // add element to set
    entry.elements.add(element);

    // if this element is removed from the DOM later, cleanup will remove it
}

function cleanupStalePlaceholders() {
    // Remove elements that are no longer in the document from registry sets
    for (const [name, entry] of variableRegistry.entries()) {
        for (const el of Array.from(entry.elements)) {
            if (!document.body.contains(el)) {
                entry.elements.delete(el);
            }
        }
        // if no elements remain, unsubscribe and delete entry
        if (!entry.elements.size) {
            try { if (typeof entry.unsubscribe === 'function') entry.unsubscribe(); } catch (e) { }
            variableRegistry.delete(name);
        }
    }
}

// Expose a teardown function for tests or when switching to edit mode
export function teardownVariables() {
    for (const [name, entry] of variableRegistry.entries()) {
        try { if (typeof entry.unsubscribe === 'function') entry.unsubscribe(); } catch (e) { }
    }
    variableRegistry.clear();
}
