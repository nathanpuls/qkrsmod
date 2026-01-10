<script>
    import { onMount, tick, onDestroy } from "svelte";
    import { getAllNoteNames, listenToNote, saveNote } from "$lib/firebase";
    import { formatTextForView } from "$lib/regex";
    import { setupVariableLinks } from "$lib/variablelinks";
    import { setupVariables, teardownVariables } from "$lib/variables";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    export let path = "home";

    let content = "";
    let mode = "view"; // 'view' | 'edit'
    let editorEl;
    let viewerEl;
    let unsubscribe;
    let typingTimeout;

    // UI State
    let isSearchOpen = false;
    let searchQuery = "";
    let searchInputEl;
    let isQRModalOpen = false;

    // --- Caret Positioning Helper (Shadow Div) ---
    function getCaretCoordinates(element, position) {
        const div = document.createElement("div");
        const style = window.getComputedStyle(element);
        for (const prop of Array.from(style)) {
            div.style[prop] = style.getPropertyValue(prop);
        }
        div.style.position = "absolute";
        div.style.top = "0";
        div.style.left = "-9999px";
        div.style.visibility = "hidden";
        div.style.height = "auto"; // Re-calc height
        div.style.width = style.width;
        div.textContent = element.value.substring(0, position);

        const span = document.createElement("span");
        span.textContent = element.value.substring(position) || ".";
        div.appendChild(span);

        document.body.appendChild(div);

        const coordinates = {
            top: span.offsetTop + parseInt(style["borderTopWidth"]),
            left: span.offsetLeft + parseInt(style["borderLeftWidth"]),
            height: parseInt(style["lineHeight"]),
        };

        document.body.removeChild(div);
        return coordinates;
    }

    // Autocomplete State
    let isAutocompleteOpen = false;
    let autocompleteQuery = "";
    let allNoteNames = [];
    let selectedIndex = 0;
    let menuTop = 0;
    let menuLeft = 0;
    let autocompleteMenuEl;

    // Fetch names on mount
    onMount(async () => {
        allNoteNames = await getAllNoteNames();
    });

    $: filteredNotes = allNoteNames
            if (n.length > 80) return false; // Filter out accidental long keys
            // Filter out junk chars: %, &, *, +, (, ), =, ?, $, !, <, >, {, }, [, ], ^, ~, |, \, /
            if (/[%&*+()=?$!<>\{\}\[\]^~|\\\/]/.test(n)) return false; 
            return n.toLowerCase().includes(autocompleteQuery.toLowerCase());
        .slice(0, 7);

    // Track slash trigger
    function checkSlashTrigger() {
        if (!editorEl) return;
        const start = editorEl.selectionStart;
        const text = content.slice(0, start);
        const lastSlash = text.lastIndexOf("/");

        if (
            lastSlash !== -1 &&
            (lastSlash === 0 ||
                text[lastSlash - 1] === " " ||
                text[lastSlash - 1] === "\n")
        ) {
            const query = text.slice(lastSlash + 1);
            if (!query.includes(" ")) {
                isAutocompleteOpen = true;
                autocompleteQuery = query;
                selectedIndex = 0;

                // Calculate position
                const coords = getCaretCoordinates(editorEl, lastSlash + 1);
                // Adjust for editor position
                const editorRect = editorEl.getBoundingClientRect();
                menuTop =
                    window.scrollY +
                    editorRect.top +
                    coords.top +
                    coords.height;
                menuLeft = window.scrollX + editorRect.left + coords.left;
                return;
            }
        }
        isAutocompleteOpen = false;
    }

    function selectNote(noteName) {
        if (!editorEl) return;
        const start = editorEl.selectionStart;
        const textBefore = content.slice(0, start);
        const lastSlash = textBefore.lastIndexOf("/");

        const newContent =
            content.slice(0, lastSlash + 1) +
            noteName +
            " " +
            content.slice(start);
        content = newContent;
        isAutocompleteOpen = false;

        tick().then(() => {
            const nextPos = lastSlash + 1 + noteName.length + 1;
            editorEl.setSelectionRange(nextPos, nextPos);
            editorEl.focus();
            handleInput();
        });
    }

    // Load the note on initialization (the #key block handles path changes)
    loadNote(path);

    // Computed view HTML
    $: viewHTML = formatTextForView(content);

    // Watch content for auto-resize
    $: if (content && editorEl) {
        autoResizeEditor();
    }

    // Effect for view mode setup
    $: if (mode === "view" && viewerEl) {
        // dep on viewHTML to re-run when content loads
        viewHTML;
        tick().then(() => {
            setupVariableLinks(viewerEl, () => mode);
            setupVariables(viewerEl, mode);
        });
    } else {
        teardownVariables();
    }

    function loadNote(p) {
        // Re-confirm cleanup inside the function scope
        clearTimeout(typingTimeout);
        mode = "view";

        unsubscribe = listenToNote(p, (val) => {
            // Strict Guard: If the user navigated away while this was fetching, ignore it.
            if (p !== path) return;

            let newContent = "";
            if (typeof val === "string") {
                newContent = val;
            } else if (val && typeof val === "object" && val.content) {
                newContent = val.content;
            }

            // Sync with DB
            if (newContent !== content) {
                // If the user isn't currently typing in the box, we can safely sync.
                if (document.activeElement !== editorEl) {
                    content = newContent;
                }
            }

            if (newContent === "" && !val) {
                mode = "edit"; // Auto-edit if empty
                tick().then(() => {
                    editorEl?.focus();
                });
            }
        });
    }

    function autoResizeEditor() {
        if (!editorEl) return;
        editorEl.style.height = "auto";
        try {
            const newHeight = Math.max(editorEl.scrollHeight, 120);
            editorEl.style.height = newHeight + "px";
        } catch (e) {}
    }

    function handleInput() {
        if (!path) return;
        const currentPath = path; // Capture path at time of input

        autoResizeEditor();
        checkSlashTrigger();
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            // Guard: Only save if we are still on the same path where the typing happened.
            if (path === currentPath) {
                saveNote(path, content);
            }
        }, 250); // Slightly longer debounce to be safe
    }

    function toggleMode() {
        mode = mode === "view" ? "edit" : "view";
        if (mode === "edit") {
            tick().then(() => {
                editorEl?.focus();
                autoResizeEditor();
            });
        }
    }

    function handleViewerClick(e) {
        const target = e.target;
        // Don't switch if clicking a link
        if (target.closest("a")) return;
        // Modifiers
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        toggleMode();
    }

    // Close autocomplete when clicking outside
    function handleClickOutside(e) {
        if (!isAutocompleteOpen) return;
        if (!autocompleteMenuEl) return;

        // Check if click is outside the menu
        if (!autocompleteMenuEl.contains(e.target)) {
            isAutocompleteOpen = false;
        }
    }

    // --- Shortcuts ---
    function handleEditorKeydown(e) {
        if (!isAutocompleteOpen) return;

        const key = e.key;

        if (key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            selectedIndex = (selectedIndex + 1) % filteredNotes.length;
            return;
        }
        if (key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            selectedIndex =
                (selectedIndex - 1 + filteredNotes.length) %
                filteredNotes.length;
            return;
        }
        if (key === "Enter" && filteredNotes.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            selectNote(filteredNotes[selectedIndex]);
            return;
        }
        if (key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            isAutocompleteOpen = false;
            return;
        }
        // Let other keys (like Space) pass through but check for closing
        if (key === " ") {
            isAutocompleteOpen = false;
        }
    }

    function handleKeydown(e) {
        const key = e.key;
        const tag = document.activeElement.tagName;

        if (key.toLowerCase() === "escape") {
            if (mode === "edit" && !isAutocompleteOpen) {
                // Only toggle mode if autocomplete isn't active
                e.preventDefault();
                toggleMode();
            }
            if (isSearchOpen) {
                closeSearch();
            }
            if (isQRModalOpen) {
                isQRModalOpen = false;
            }
            return;
        }

        if (["INPUT", "TEXTAREA"].includes(tag)) return;

        switch (key) {
            case "s":
                e.preventDefault();
                openSearch();
                break;
            case "c":
                e.preventDefault();
                copyContent();
                break;
            case "l":
                e.preventDefault();
                copyLink();
                break;
            case "e":
                e.preventDefault();
                toggleMode();
                break;
            case "h":
                e.preventDefault();
                goto("/");
                break;
            case "q":
                e.preventDefault();
                toggleQR();
                break;
        }
    }

    // --- Search ---
    function openSearch() {
        isSearchOpen = true;
        tick().then(() => searchInputEl?.focus());
    }
    function closeSearch() {
        isSearchOpen = false;
        searchQuery = "";
    }
    function handleSearchKey(e) {
        if (e.key === "Enter") {
            if (searchQuery.trim()) {
                const normalized = searchQuery
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-");
                goto("/" + normalized);
                closeSearch();
            }
        }
    }

    // --- Actions ---
    function copyContent(event) {
        navigator.clipboard
            .writeText(content)
            .then(() => showTooltip("Copied content!", event))
            .catch(() => showTooltip("Copy failed", event));
    }
    function copyLink(event) {
        navigator.clipboard
            .writeText(window.location.href)
            .then(() => showTooltip("Copied link!", event))
            .catch(() => showTooltip("Copy failed", event));
    }
    function toggleQR() {
        isQRModalOpen = !isQRModalOpen;
    }

    // --- Tooltip ---
    let tooltipText = "";
    let tooltipVisible = false;
    let tooltipTimeout;
    let tooltipX = "50%";
    let tooltipBottom = "80px";

    function showTooltip(msg, event) {
        tooltipText = msg;
        tooltipVisible = true;

        // Calculate position based on clicked button
        if (event && event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();

            // Position horizontally centered on the button
            tooltipX = `${rect.left + rect.width / 2}px`;

            // Position above the button (60px is bottom bar height)
            tooltipBottom = "75px"; // Just above bottom bar
        }

        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => {
            tooltipVisible = false;
        }, 2000);
    }

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
        clearTimeout(typingTimeout); // Cancel any pending saves
        teardownVariables();
    });
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleClickOutside} />

<!-- Search -->
{#if isSearchOpen}
    <div id="topSearchContainer" style="display: flex;">
        <input
            bind:this={searchInputEl}
            bind:value={searchQuery}
            on:keydown={handleSearchKey}
            on:blur={closeSearch}
            type="text"
            id="topSearchInput"
            placeholder="Type page name + Enter ⏎"
            autocomplete="off"
        />
        <button id="clearSearchBtn" on:click={closeSearch}>
            <i class="ph-bold ph-x"></i>
        </button>
    </div>
{/if}

<!-- Editor / Viewer -->
<div id="editorWrapper">
    {#if mode === "view"}
        <div
            id="staticContentViewer"
            bind:this={viewerEl}
            on:click={handleViewerClick}
            role="button"
            tabindex="0"
            style="display: block"
            on:keypress={(e) => {
                if (e.key === "Enter") toggleMode();
            }}
        >
            {@html viewHTML}
        </div>
    {:else}
        <textarea
            id="editor"
            bind:this={editorEl}
            bind:value={content}
            on:input={handleInput}
            on:keydown={handleEditorKeydown}
            on:blur={() => {
                // Switch to view mode on blur (e.g. mobile keyboard dismiss)
                mode = "view";
            }}
            placeholder=""
        ></textarea>

        {#if isAutocompleteOpen && filteredNotes.length > 0}
            <div
                bind:this={autocompleteMenuEl}
                class="autocomplete-menu"
                style="top: {menuTop}px; left: {menuLeft}px;"
            >
                <div class="autocomplete-items-container">
                    {#each filteredNotes as note, i}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div
                            class="autocomplete-item"
                            class:selected={i === selectedIndex}
                            on:mousedown|preventDefault={() => selectNote(note)}
                            role="button"
                            tabindex="0"
                        >
                            <i class="ph ph-file-text"></i>
                            <span>{note}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/if}
</div>

<!-- Bottom Bar -->
<div id="bottomBar">
    <button on:click={openSearch} title="Search (S)"
        ><i class="ph-bold ph-magnifying-glass"></i></button
    >
    <button
        on:click={(e) => copyContent(e)}
        on:touchend={(e) => {
            e.preventDefault();
            copyContent(e);
        }}
        title="Copy Content (C)"><i class="ph-bold ph-copy-simple"></i></button
    >
    <button
        on:click={(e) => copyLink(e)}
        on:touchend={(e) => {
            e.preventDefault();
            copyLink(e);
        }}
        title="Copy Link (L)"
        ><i class="ph-bold ph-link-simple-horizontal"></i></button
    >
    <button on:click={() => goto("/")} title="Home (H)"
        ><i class="ph-bold ph-house-simple"></i></button
    >
    <button on:click={toggleQR} title="QR Code (Q)"
        ><i class="ph-bold ph-qr-code"></i></button
    >
    <button
        on:click={toggleMode}
        title={mode === "edit" ? "View (Esc)" : "Edit (E)"}
    >
        <i
            class={mode === "edit"
                ? "ph-bold ph-check-fat"
                : "ph-bold ph-pencil-simple"}
        ></i>
    </button>
</div>

<div class="editor-overlay"></div>

<!-- Helper Components (Tooltips, QR) -->
<div
    class="tooltip"
    class:show={tooltipVisible}
    style="bottom: {tooltipBottom}; left: {tooltipX}; transform: translateX(-50%);"
>
    {tooltipText}
</div>

{#if isQRModalOpen}
    <div
        id="qrModal"
        style="display:flex; position:fixed; inset:0; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); z-index:9999;"
        on:click|self={toggleQR}
    >
        <button
            id="qrModalClose"
            on:click={toggleQR}
            style="position:absolute; top:12px; right:12px; background:transparent; border:none; font-size:28px; color:#fff;"
            >×</button
        >
        <div
            style="position:relative; background:#fff; padding:28px 16px 16px; border-radius:8px; max-width:90%; text-align:center;"
        >
            <img
                src={"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
                    encodeURIComponent($page.url.href)}
                alt="QR Code"
                width="300"
                height="300"
                style="display:block; margin:0 auto;"
            />
        </div>
    </div>
{/if}

<style>
    .editor-overlay {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        height: 60px;
        pointer-events: none;
        backdrop-filter: blur(4px) saturate(110%);
        -webkit-backdrop-filter: blur(4px) saturate(110%);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.03);
        z-index: 900;
    }

    @media (min-width: 700px) {
        .editor-overlay {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: 90%;
            max-width: 900px;
        }
    }

    /* Autocomplete Menu Styles */
    .autocomplete-menu {
        position: absolute; /* Changed from fixed */
        /* top/left set inline */
        width: 300px; /* narrowed width */
        max-width: 90vw;
        background: white;
        border-radius: 6px;
        box-shadow:
            0 10px 25px rgba(0, 0, 0, 0.1),
            0 2px 5px rgba(0, 0, 0, 0.05);
        border: 1px solid #eee;
        z-index: 1000;
        overflow: hidden;
        padding: 6px;
    }

    .autocomplete-items-container {
        max-height: 200px;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .autocomplete-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.15s;
        font-size: 0.95rem;
        color: #37352f; /* Notion text color */
    }

    .autocomplete-item i {
        font-size: 1.1rem;
        color: #999;
    }

    .autocomplete-item span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .autocomplete-item.selected,
    .autocomplete-item:hover {
        background: #f1f1ef; /* Notion item hover color */
    }

    .autocomplete-item:active {
        background: #ebebe9;
    }
</style>
