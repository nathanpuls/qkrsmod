<script>
    import { onMount } from "svelte";
    import { db } from "$lib/firebase";
    import { ref, onValue } from "firebase/database";

    export let tag;

    let results = [];
    let allResults = [];
    let loading = true;
    let searchQuery = "";

    // Watch for tag changes
    $: if (tag) {
        loadResults(tag);
    }

    function loadResults(t) {
        loading = true;
        const notesRef = ref(db, "notes");
        onValue(
            notesRef,
            (snapshot) => {
                const tempResults = [];
                const re = new RegExp(
                    `(^|\\s)#(${escapeRegExp(t)})(?=\\s|$|[.,!?:;])`,
                    "i",
                );

                snapshot.forEach((child) => {
                    const key = child.key;
                    const val = child.val();
                    let txt = "";
                    if (typeof val === "string") txt = val;
                    else if (val && val.content) txt = val.content;

                    if (txt && re.test(txt)) {
                        tempResults.push({ key, val: txt });
                    }
                });

                allResults = tempResults;
                filterResults();
                loading = false;
            },
            { onlyOnce: true },
        );
    }

    function escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function filterResults() {
        if (!searchQuery) {
            results = allResults;
            return;
        }
        const lowerFilter = searchQuery.toLowerCase().trim();
        results = allResults.filter((r) => {
            const title = (r.key || "").toLowerCase();
            const text = (r.val || "").toLowerCase();
            return (
                title.includes(lowerFilter) ||
                text.includes(lowerFilter) ||
                `#${r.key}`.includes(lowerFilter)
            );
        });
    }

    $: if (searchQuery !== undefined) filterResults();
</script>

<div id="page" class="container">
    <div class="title-container">
        <img src="/x/logo.png" alt="logo" class="logo" />
    </div>

    {#if !tag}
        <div id="tagResults">
            <p>No tag provided. Try <a href="/x/hashtag/apple">#apple</a>.</p>
        </div>
    {:else}
        <div id="hashtagSearchContainer">
            <input bind:value={searchQuery} placeholder="Filter results..." />
        </div>

        <div id="tagResults">
            {#if loading}
                Loading...
            {:else if results.length === 0}
                <p>No pages contain the hashtag <strong>#{tag}</strong>.</p>
            {:else}
                <h2>#{tag} ({results.length})</h2>
                <ul class="tag-results">
                    {#each results as res}
                        <li class="tag-result">
                            <a href="/{res.key}">{res.key}</a>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
    <p style="margin-top: 20px;"><a href="/">Back to home</a></p>
</div>

<style>
    /* Import Poppins font handled in app.html */

    :global(body) {
        margin: 0;
        padding: 0;
        /* Removing padding on body to not conflict with layout */
    }

    .container {
        font-family: "Poppins", sans-serif;
        max-width: 540px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 20px auto;
        padding: 20px;
    }

    .title-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
    }

    .title-container .logo {
        width: 80px;
        height: auto;
        margin-bottom: 10px;
    }

    h2 {
        margin: 0;
        font-size: 1.5rem;
        text-align: center;
    }

    #hashtagSearchContainer {
        display: flex;
        width: 100%;
        gap: 8px;
        margin-bottom: 20px;
        background: #f9f9f9;
        padding: 10px 12px;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        box-sizing: border-box;
    }

    #hashtagSearchContainer input {
        flex-grow: 1;
        padding: 8px;
        font-family: inherit;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: none;
    }

    #tagResults {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: center;
    }

    .tag-results {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .tag-result a {
        display: block;
        padding: 10px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        text-decoration: underline;
        color: #111;
        word-break: break-word;
        font-weight: 600;
        color: #111; /* from legacy style */
    }

    p a {
        display: inline-block;
        color: #111;
        text-decoration: underline;
    }
</style>
