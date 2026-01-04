<script>
    import { goto } from "$app/navigation";

    let pageInput = "";
    let inputEl;

    function handleSubmit() {
        if (!pageInput.trim()) return;
        const normalized = pageInput.trim().toLowerCase().replace(/\s+/g, "-");
        goto("/" + normalized);
    }

    function goRandom() {
        const randomDigit = Math.floor(1000 + Math.random() * 9000);
        goto("/" + randomDigit);
    }

    function handleWindowClick(e) {
        if (
            e.target.closest("a") ||
            e.target.closest("button") ||
            e.target.closest("input")
        )
            return;
        inputEl?.focus();
    }

    const buildTime = __BUILD_TIME__;
</script>

<svelte:window on:click={handleWindowClick} />

<div class="container">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
        class="title-container"
        on:click={() => goto("/")}
        role="button"
        tabindex="0"
    >
        <img src="/x/logo.png" alt="duck" class="logo" />
        <h1>qk.rs</h1>
    </div>
    <!-- <p class="description">Share text in real time with a simple link.</p> -->

    <form on:submit|preventDefault={handleSubmit}>
        <input
            bind:this={inputEl}
            type="text"
            bind:value={pageInput}
            placeholder="Type page name + Enter ⏎"
            autofocus
            autocomplete="off"
        />
        <p class="hint">
            <a href="/x/about">About</a>
            <a href="/x/shortcuts">Shortcuts</a>
            <button
                type="button"
                on:click|preventDefault={goRandom}
                style="background:none; border:none; padding:0; font:inherit; color:inherit; text-decoration:underline; cursor:pointer;"
                class="hint-link">Random Page</button
            >
            <a href="mailto:x@qk.rs">Email Us</a>
        </p>
    </form>
    <p class="deploy-time">Last deploy: {buildTime}</p>
</div>

<style>
    /* Global body style to center content only for this page */
    :global(body) {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background: #fff; /* fallback */
    }

    .container {
        max-width: 1000px;
        width: 90%;
    }

    .title-container {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
        gap: 5px;
    }

    .logo {
        width: 50px;
        height: 50px;
        cursor: pointer;
    }

    h1 {
        font-weight: 500;
        font-size: 2rem;
        color: #111;
        margin: 0;
    }

    form {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }

    input[type="text"] {
        width: 100%;
        max-width: 400px;
        padding: 14px 18px;
        font-size: 1.2rem;
        border-radius: 12px;
        border: 1px solid #111;
        outline: none;
        transition: border-color 0.2s;
        font-family: inherit;
        box-sizing: border-box;
    }

    .hint {
        font-size: 0.9rem;
        color: #111;
        margin-top: 30px;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 7px;
    }

    .hint a {
        color: inherit;
        text-decoration: underline;
        cursor: pointer;
        padding: 10px 15px;
        border-radius: 8px;
    }
    .hint a:hover {
        text-decoration: underline;
    }

    .deploy-time {
        margin-top: 50px;
        font-size: 0.7rem;
        color: #ccc;
    }
</style>
