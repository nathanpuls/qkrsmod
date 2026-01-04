<div class="container">
    <h1>
        <i
            class="ph-bold ph-command"
            style="font-size: 28px; color: #111111; margin-right: 10px;"
        ></i>
        Keyboard Shortcuts
    </h1>

    <ul class="shortcut-list">
        <li class="shortcut-item">
            <div class="icon-container">
                <i class="ph-bold ph-pencil-simple"></i>
            </div>
            <div class="shortcut-content">
                <h3>Edit Page <span class="shortcut">E</span></h3>
                <p>
                    Jumps cursor to the editor. Your text saves automatically
                    and updates in realtime. You can also just tap the page to
                    edit.
                </p>
            </div>
        </li>

        <li class="shortcut-item">
            <div class="icon-container">
                <i class="ph-bold ph-magnifying-glass"></i>
            </div>
            <div class="shortcut-content">
                <h3>Search Pages <span class="shortcut">S</span></h3>
                <p>
                    Opens the search bar at the top for quick page navigation.
                </p>
            </div>
        </li>

        <li class="shortcut-item">
            <div class="icon-container">
                <i class="ph-bold ph-copy-simple"></i>
            </div>
            <div class="shortcut-content">
                <h3>Copy Content <span class="shortcut">C</span></h3>
                <p>
                    Copies all visible text content on the current page to your
                    clipboard.
                </p>
            </div>
        </li>

        <li class="shortcut-item">
            <div class="icon-container">
                <i class="ph-bold ph-link-simple-horizontal"></i>
            </div>
            <div class="shortcut-content">
                <h3>Copy Link <span class="shortcut">L</span></h3>
                <p>
                    Copies the current page's URL to your clipboard for instant
                    sharing.
                </p>
            </div>
        </li>

        <li class="shortcut-item">
            <div class="icon-container">
                <i class="ph-bold ph-house-simple"></i>
            </div>
            <div class="shortcut-content">
                <h3>Go Home <span class="shortcut">H</span></h3>
                <p>
                    Navigates directly back to the home page. It may also be a
                    duck.
                </p>
            </div>
        </li>

        <li class="shortcut-item">
            <div class="icon-container"><i class="ph-bold ph-qr-code"></i></div>
            <div class="shortcut-content">
                <h3>QR Code <span class="shortcut">Q</span></h3>
                <p>Shows or hides the QR code for the page.</p>
            </div>
        </li>

        <li class="shortcut-item">
            <div class="icon-container">
                <i class="ph-bold ph-x-circle"></i>
            </div>
            <div class="shortcut-content">
                <h3>Escape <span class="shortcut">Esc</span></h3>
                <p>Leaves the editor, search bar, or QR code modal.</p>
            </div>
        </li>
    </ul>
</div>

<div id="pageFooter">
    <a href="/"><img src="/x/logo.png" alt="qk.rs home" id="duckLogo" /></a>
    <p style="margin: 0; font-size: 15px;"></p>
</div>

<style>
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
        border-bottom: 2px solid #ccc;
        padding-bottom: 10px;
        margin-bottom: 30px;
        font-weight: 500;
        text-align: left;
    }

    .shortcut-list {
        list-style-type: none;
        padding: 0;
    }
    .shortcut-item {
        margin-bottom: 25px;
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .icon-container {
        background: #ffffff;
        border-radius: 8px;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .icon-container i {
        font-size: 24px;
        color: #4e4e4e;
    }

    .shortcut-content {
        flex: 1;
        font-size: 16px;
    }

    .shortcut-content h3 {
        margin: 0 0 5px;
        font-size: 18px;
        font-weight: 500;
        color: #111111;
    }

    .shortcut-content p {
        margin: 0;
        color: #555;
        line-height: 1.5;
    }

    .shortcut {
        background: #eee;
        color: #111;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-weight: 600;
        font-size: 0.9em;
        padding: 2px 7px;
        border-radius: 4px;
        margin: 0 5px;
        display: inline-flex;
        align-items: center;
        line-height: 1.2;
        position: relative;
        top: -1px;
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
