import { db } from '$lib/firebase';
import { ref as dbRef, onValue, get } from "firebase/database";
import { formatTextForView } from '$lib/regex';

// Map of variableName -> { unsubscribe: fn, elements: Set<HTMLElement> }
const variableRegistry = new Map();

export function setupVariables(staticViewer, mode) {
    if (!staticViewer) return;
    if (mode !== 'view') return;

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
            // Styles for smooth fade-in
            // Styles for instant reveal (hidden initially)
            span.style.opacity = '0';
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
        const unsub = onValue(ref, async snapshot => {
            const val = snapshot.val();
            // Recursively resolve variables in the value
            async function resolveVars(text, visited = [], currentVar = key) {
                if (typeof text !== 'string') return '';
                // Prevent true cycles only
                if (visited.includes(currentVar)) {
                    console.warn('[variables] Infinite loop detected for variable', currentVar, 'visited:', visited);
                    return '';
                }
                const nextVisited = [...visited, currentVar];
                // regex to match $word or %24word where word is alphanumeric, dash or underscore
                const re = /(?:\$|%24)([A-Za-z0-9\-_]+)/g;
                // Use async string replacement to handle all variables, including trailing ones
                const replaced = await replaceAsync(text, re, async (match, varName) => {
                    varName = varName.toLowerCase();
                    let varVal = '';
                    const varEntry = variableRegistry.get(varName);
                    if (varEntry && varEntry.lastVal !== undefined) {
                        // If the note exists but is empty/null, show the variable name
                        let isEmpty = false;
                        if (typeof varEntry.lastVal === 'string') {
                            isEmpty = varEntry.lastVal.trim() === '';
                        } else if (varEntry.lastVal === null || varEntry.lastVal === undefined) {
                            isEmpty = true;
                        }
                        if (isEmpty) {
                            varVal = match;
                        } else {
                            varVal = await resolveVars(varEntry.lastVal, nextVisited, varName);
                        }
                    } else {
                        try {
                            const snap = await get(dbRef(db, 'notes/' + varName));
                            const snapVal = snap && snap.exists() ? snap.val() : '';
                            let isEmpty = false;
                            let contentToResolve = '';

                            if (typeof snapVal === 'string') {
                                // Direct string value
                                contentToResolve = snapVal;
                                isEmpty = snapVal.trim() === '';
                            } else if (snapVal && typeof snapVal === 'object' && typeof snapVal.content === 'string') {
                                // Object with content field
                                contentToResolve = snapVal.content;
                                isEmpty = snapVal.content.trim() === '';
                            } else {
                                // Null, undefined, or empty object
                                isEmpty = true;
                            }

                            if (!isEmpty) {
                                varVal = await resolveVars(contentToResolve, nextVisited, varName);
                            } else {
                                varVal = match; // Show the original variable
                            }
                        } catch (e) {
                            console.error(`[variables] Error fetching $${varName} from Firebase`, e);
                            varVal = match;
                        }
                    }
                    return varVal;
                });
                return replaced;
            }

            // Helper: async string replace
            async function replaceAsync(str, regex, asyncFn) {
                const matches = [];
                str.replace(regex, (...args) => {
                    matches.push(args);
                    return '';
                });
                if (!matches.length) return str;
                const data = await Promise.all(matches.map(args => asyncFn(...args)));
                let i = 0;
                return str.replace(regex, () => data[i++]);
            }
            // Support both string and object note values (object with 'content')
            let noteContent = '';
            if (typeof val === 'string') {
                noteContent = val;
            } else if (val && typeof val === 'object' && typeof val.content === 'string') {
                noteContent = val.content;
            }
            entry.lastVal = noteContent;
            const resolved = await resolveVars(noteContent);
            const html = formatTextForView(resolved);
            // update DOM for all placeholders bound to this variable
            entry.elements.forEach(el => {
                el.classList.add('variable-resolved');
                // If resolved is empty, show the literal variable name as a fallback
                if (!resolved || resolved.trim() === '') {
                    el.innerText = `$${name}`;
                } else {
                    el.innerHTML = html;
                }

                // Slight delay to allow batching/settling, effectively synchronizing "arrival"
                setTimeout(() => {
                    el.style.opacity = '1';
                }, 50);
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
            if (el.parentNode === null || !document.contains(el)) { // Check if detached
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
