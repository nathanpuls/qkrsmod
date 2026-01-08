<script>
    import { onMount, tick, onDestroy } from "svelte";
    import { listenToNote, saveNote } from "$lib/firebase";
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

    // Reactive statements
    $: if (path) {
        content = ""; // Clear content immediately when path changes
        loadNote(path);
    }

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
        if (unsubscribe) unsubscribe();
        clearTimeout(typingTimeout); // Cancel pending saves
        // Reset state
        mode = "view";
        content = "";

        unsubscribe = listenToNote(p, (val) => {
            let newContent = "";
            if (typeof val === "string") {
                newContent = val;
            } else if (val && typeof val === "object" && val.content) {
                newContent = val.content;
            }
            // Update content if changed (avoid loop if typing)
            if (newContent !== content) {
                // If we are editing and typing, we might conflict.
                // But for simplicity, we overwrite from DB unless we have valid local changes?
                // Legacy code overwrites unless it's the same.
                // Using debounced save prevents quick overwrites.
                if (document.activeElement !== editorEl) {
                    content = newContent;
                } else {
                    // If editing, maybe don't overwrite?
                    // Legacy code overwrites: `if (content !== editor.value) { editor.value = content; ... }`
                    // But if user is typing...
                    // We'll trust legacy logic: overwrite.
                    if (content !== newContent) {
                        // warning: could lose cursor position
                        // svelte binds value, cursor jump might happen.
                        // improved logic:
                        content = newContent;
                    }
                }
            }
            if (newContent === "" && !val) {
                mode = "edit"; // Auto-edit if empty
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
        autoResizeEditor();
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            saveNote(path, content);
        }, 200);
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

    // --- Shortcuts ---
    function handleKeydown(e) {
        const key = e.key.toLowerCase();
        const tag = document.activeElement.tagName;

        if (key === "escape") {
            if (mode === "edit") {
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
        teardownVariables();
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Search -->
{#if isSearchOpen}
    <div id="topSearchContainer" style="display: flex;">
        <input
            bind:this={searchInputEl}
            bind:value={searchQuery}
            on:keydown={handleSearchKey}
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
            on:blur={() => {
                // Switch to view mode on blur (e.g. mobile keyboard dismiss)
                mode = "view";
            }}
            placeholder=""
        ></textarea>
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
</style>
