<div class="container">
    <h1>About qk.rs</h1>

    <p>
        <span class="emphasis">qk.rs</span> is a
        <span class="emphasis"
            >minimalist, URL-based notebook and rapid communication tool.</span
        > It turns any path you type into a public, instantly editable, and shareable
        page. Think of it as a personal, infinitely flexible whiteboard accessible
        via any device.
    </p>

    <hr />

    <h2>
        <i
            class="ph-bold ph-pencil-line"
            style="font-size: 24px; color: #111111; margin-right: 10px;"
        ></i> How It Works
    </h2>
    <ul class="feature-list">
        <li>
            <i class="ph-bold ph-link-simple-horizontal"></i>
            <div>
                <span class="emphasis">Instant Pages:</span> Just type a path
                like <span class="code-block">secretpage</span> after the main URL
                (or use the search feature). If the page doesn't exist, it's created
                instantly. If it does, you begin editing the live content.
            </div>
        </li>
        <li>
            <i class="ph-bold ph-users"></i>
            <div>
                <span class="emphasis">Live Collaboration:</span> All changes are
                saved in real time (via Firebase) and update instantly for anyone
                else viewing the same URL. Use it for quick collaboration, temporary
                shared notes, or delivering code snippets.
            </div>
        </li>
        <li>
            <i class="ph-bold ph-keyboard"></i>
            <div>
                <span class="emphasis">Efficiency Focus:</span> The interface is
                built for speed. Use the bottom bar buttons or, even faster,
                dedicated
                <a href="/x/shortcuts" style="color: #4e4e4e;"
                    >keyboard shortcuts</a
                > to search, copy, and navigate.
            </div>
        </li>
        <li>
            <i class="ph-bold ph-scroll"></i>
            <div>
                <span class="emphasis">Long-Form Editor:</span> The editor is a simple,
                distraction-free field optimized for focused writing and input.
            </div>
        </li>
    </ul>
</div>

<div id="pageFooter">
    <a href="/"><img src="/x/logo.png" alt="qk.rs home" id="duckLogo" /></a>
    <p style="margin: 0; font-size: 15px;"></p>
</div>

<style>
    /* Scope styles to this component or use module css. Since it's a page, we can put it in <style> */
    :global(body) {
        font-family: "Poppins", sans-serif;
        background: #ffffff;
        color: #111111;
        margin: 0;
        padding: 0;
        line-height: 1.6;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }
    .container {
        max-width: 700px;
        margin: 40px auto 0 auto;
        padding: 0 20px;
        flex-grow: 1;
    }
    h1 {
        font-size: 28px;
        color: #111111;
        padding-bottom: 10px;
        margin-bottom: 30px;
        font-weight: 500;
        text-align: left;
    }
    h2 {
        font-size: 22px;
        color: #111111;
        margin-top: 35px;
        margin-bottom: 15px;
        font-weight: 500;
        text-align: left;
    }
    p,
    li {
        font-size: 16px;
        color: #4e4e4e;
    }
    .emphasis {
        font-weight: 600;
        color: #111111;
    }
    .feature-list {
        list-style-type: none;
        padding: 0;
    }
    .feature-list li {
        margin-bottom: 15px;
        display: flex;
        align-items: flex-start;
    }
    .feature-list i {
        color: #4e4e4e;
        margin-right: 12px;
        font-size: 18px;
        margin-top: 3px;
    }
    hr {
        border: 0;
        border-top: 1px solid #eee;
        margin: 30px 0;
    }
    .code-block {
        background: #f8f8f8;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 15px;
        color: #111111;
        display: inline-block;
    }
    #pageFooter {
        text-align: center;
        padding: 20px 0 40px 0;
        margin-top: 40px;
    }
    #pageFooter a {
        text-decoration: none;
        color: #4e4e4e;
        font-weight: 500;
    }
    #duckLogo {
        height: 32px;
        margin-bottom: 15px;
        display: block;
        margin: 0 auto 15px auto;
    }
</style>
