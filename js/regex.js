export function formatTextForView(text) {
    if (!text) return "";

    // Escape HTML first
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Line breaks
    escaped = escaped.replace(/\n/g, "<br>");

    // Protect lines after a template link (containing $ or %24) so they are NOT auto-linkified.
    // We wrap such lines in a span.variable-candidate to prevent the URL regex from matching them.
    let __VAR_TOKEN_MAP = null;
    try {
        const parts = escaped.split("<br>");
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            if (/\$|%24/.test(p)) {
                // mark subsequent non-empty lines until a blank line
                for (let j = i + 1; j < parts.length; j++) {
                    if (!parts[j].trim()) break; // stop on blank line
                    // wrap only if not already wrapped
                    if (!/^\s*<span class="variable-candidate">/.test(parts[j])) {
                        parts[j] = `<span class="variable-candidate">${parts[j].trim()}</span>`;
                    }
                }
            }
        }
        escaped = parts.join("<br>");

        // Replace variable-candidate spans with placeholder tokens so later regexes won't match their content
        const map = [];
        escaped = escaped.replace(/<span class="variable-candidate">([\s\S]*?)<\/span>/gi, function (_, inner) {
            const id = map.length;
            map.push(inner);
            return `__VAR_TOKEN_${id}__`;
        });
        __VAR_TOKEN_MAP = map;
    } catch (e) {
        // if anything goes wrong, fall back to the original escaped string
        console.error('variable-candidate marking failed', e);
        __VAR_TOKEN_MAP = null;
    }

    // Slash-paths (e.g., /xmas or /foo/bar) -> internal links
    // Matches a leading slash and subsequent path segments, stops before whitespace, <br>, end, or punctuation
    escaped = escaped.replace(/(^|[\s>])(\/[A-Za-z0-9][A-Za-z0-9\/\-_]*)(?=\s|<br>|$|[.,!?:;])/g, (m, prefix, path) => {
        return `${prefix}<a href="${path}" >${path}</a>`;
    });

    // Addresses moved below (applied after other linkifications to avoid matching generated hrefs)
    // (See further down where address linkification is inserted just before phone number handling.)

    // Emails
    escaped = escaped.replace(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        '<a href="mailto:$1">$1</a>'
    );

    // URLs with protocol or www
    escaped = escaped.replace(
        /\b((https?:\/\/|www\.)[^\s<]+)/gi,
        match => {
            let url = match;
            if (!/^https?:\/\//i.test(url)) url = "http://" + url;
            return `<a href="${url}" target="_blank" >${match}</a>`;
        }
    );

    // Plain domains without protocol (skip emails)
    escaped = escaped.replace(
        /\b((?!mailto:)([a-z0-9-]+\.)+[a-z]{2,}([\/\w\?\&\#.-]*)?)(?=\s|<br>|$)/gi,
        match => {
            if (/@/.test(match)) return match; // skip emails
            return `<a href="http://${match}" target="_blank" >${match}</a>`;
        }
    );

    // Addresses (improved detection: allows comma or <br> separators so city/state on next line are included)
    // Special-case: highway-style routes (e.g. "25901 US-290, Cypress, TX 77429") — handle these first
    escaped = escaped.replace(
        /\b(\d{1,5}\s+(?:US|I|SR|Rte|Route)[\s-]*\d{1,5}(?:\s*(?:,|<br\s*\/?\>)\s*[A-Za-z0-9][A-Za-z0-9\s\.\-]{0,80}(?:\s*(?:,|<br\s*\/?\>)\s*(?:[A-Za-z]{2}|[A-Za-z][A-Za-z\s\.]{0,40}))?)?)(?=\s|<br>|$)/gi,
        match => {
            let cleaned = match.replace(/<br\s*\/?\>/gi, ' ').replace(/[\s,]+$/, '');
            const q = encodeURIComponent(cleaned);
            return `<a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener noreferrer">${cleaned}</a>`;
        }
    );

    // Converts addresses into a Google Maps search link
    escaped = escaped.replace(
        /\b(\d{1,5}\s+[A-Za-z0-9][A-Za-z0-9\.\-]*(?:\s+(?!Unit\b|Apt\b|Suite\b|Ste\b|#\b|Floor\b|Fl\b)[A-Za-z0-9\.\-]+){0,6}\s+(?:St(?:reet)?|Ave(?:nue)?|Rd(?:oad)?|Blvd|Boulevard|Ln|Lane|Dr|Drive|Ct|Court|Cir|Circle|Hwy|Highway|Pkwy|Way|Terrace|Ter|Pl|Place|(?:US|I|SR|Rte|Route)(?:\s*-?\s*\d{1,5})|[A-Za-z]{2,6}-\d{1,5})(?:\s+(?:Unit, Apt, Suite, Ste, #, Floor, Fl)\b[^<>\n,]{0,40})?(?:\s*(?:,|\s*<br\s*\/?>)\s*[A-Za-z][A-Za-z\s\.\-]{0,60}(?:\s*(?:,\s*<br\s*\/?>)\s*(?:[A-Za-z]{2}|[A-Za-z][A-Za-z\s\.]{0,40}))?(?:\s+\d{5}(?:-\d{4})?)?)?)(?=\s|\n|$)/gi,
        match => {
            // Remove any stray <br> tags (if newlines were converted earlier) and trim trailing commas/spaces
            let cleaned = match.replace(/<br\s*\/?>/gi, ' ').replace(/[\s,]+$/, '');
            // Remove comma directly after unit identifiers (e.g., "Suite 110, Kingwood" -> "Suite 110 Kingwood")
            cleaned = cleaned.replace(/(\b(?:Unit|Apt|Suite|Ste|#|Floor|Fl)\b[^,]*),\s*/gi, '$1 ');
            const q = encodeURIComponent(cleaned);
            return `<a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener noreferrer">${cleaned}</a>`;
        }
    );

    // Post-process: expand anchors that end with a unit keyword to include an immediately following unit number and optional city/state/ZIP
    // Handles cases like "<a ...>Suite</a> 110, Kingwood, TX 77339" and "<a ...>Suite</a> 110,<br>Kingwood, TX 77339"
    escaped = escaped.replace(/<a href="https:\/\/www\.google\.com\/maps\/search\/?api=1&query=[^\"]+"[^>]*>([^<]*\b(?:Unit|Apt|Suite|Ste|#|Floor|Fl)\b)<\/a>[\s,]*([A-Za-z0-9][A-Za-z0-9\-]{0,6})(?:\s*(?:,)?\s*(?:<br\s*\/?\>\s*)?([A-Za-z][^<\n]{0,120}?))?(?=\s|<br>|$)/gi, (m, unitText, num, cityPart) => {
        // Build appended part: number + optional city part
        let appended = num || '';
        if (cityPart) appended += ' ' + cityPart.replace(/<br\s*\/?>/gi, ' ');
        appended = appended.replace(/[\s,]+$/, '').trim();
        const newInner = (unitText + ' ' + appended).replace(/\s+/g, ' ').trim();
        const q = encodeURIComponent(newInner);
        return `<a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener noreferrer">${newInner}</a>`;
    });

    // Post-process: if an anchor is followed by a postcode-like token (alphanumeric, contains a digit)
    // and optionally a trailing country, merge those into the preceding anchor so the full
    // address is linkified (e.g., "126 Victoria St, London SW1E 5EA, United Kingdom").
    escaped = escaped.replace(/(<a\b[^>]*>[^<]*<\/a>)\s*([A-Za-z0-9][A-Za-z0-9\s\.\-]{1,60})(?:\s*(?:,|<br\s*\/?\>)\s*([A-Za-z][A-Za-z\s\.]{2,40}))?/gi,
        (m, anchorHtml, trailing, country) => {
            // only merge when trailing contains a digit (likely a postcode)
            if (!/\d/.test(trailing || '')) return m;
            // extract existing query from anchor href
            const hrefMatch = anchorHtml.match(/href="([^"]+)"/i);
            if (!hrefMatch) return m;
            try {
                const href = hrefMatch[1];
                const qMatch = href.match(/[?&]query=([^&]+)/i);
                if (!qMatch) return m;
                const decoded = decodeURIComponent(qMatch[1]);
                const append = (trailing + (country ? ', ' + country : '')).replace(/<br\s*\/?\>/gi, ' ').replace(/[\s,]+$/, '').trim();
                const newQuery = encodeURIComponent((decoded + ' ' + append).replace(/\s+/g, ' ').trim());
                const newHref = href.replace(/([?&]query=)[^&]+/i, `$1${newQuery}`);
                // replace inner text as well
                const innerMatch = anchorHtml.match(/>([^<]+)<\/a>/i);
                if (!innerMatch) return m;
                const innerText = innerMatch[1];
                const newInner = anchorHtml.replace(/>([^<]+)<\/a>/i, `>${(innerText + ' ' + append).replace(/\s+/g, ' ').trim()}</a>`);
                return newHref ? newInner.replace(/href="[^"]+"/, `href="${newHref}"`) : m;
            } catch (e) { return m; }
        }
    );

    // Post-process: if an anchor is followed by a comma or <br> and then a city/state/ZIP part,
    // merge that into the anchor as well (handles unit-number-on-previous-line cases).
    escaped = escaped.replace(/(<a\b[^>]*>[^<]+<\/a>)\s*(?:,|<br\s*\/?\>)+\s*([A-Za-z][A-Za-z0-9\s\.\-]{1,80}(?:\s*(?:,|<br\s*\/?\>)+\s*[A-Za-z0-9][A-Za-z0-9\s\.\-]{1,80})?)/gi,
        (m, anchorHtml, rest) => {
            // only merge when anchor already looks like an address (street/unit present)
            const innerMatch = anchorHtml.match(/>([^<]+)<\/a>/i);
            if (!innerMatch) return m;
            const innerText = innerMatch[1];
            if (!/\b(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Pl|Place|Suite|Unit|Apt|#|Floor|Fl)\b/i.test(innerText)) return m;
            // merge rest into anchor
            const append = rest.replace(/<br\s*\/?\>/gi, ' ').replace(/[\s,]+$/, '').trim();
            const hrefMatch = anchorHtml.match(/href="([^"]+)"/i);
            if (!hrefMatch) return m;
            try {
                const href = hrefMatch[1];
                const qMatch = href.match(/[?&]query=([^&]+)/i);
                if (!qMatch) return m;
                const decoded = decodeURIComponent(qMatch[1]);
                const newQuery = encodeURIComponent((decoded + ' ' + append).replace(/\s+/g, ' ').trim());
                const newHref = href.replace(/([?&]query=)[^&]+/i, `$1${newQuery}`);
                const newInner = anchorHtml.replace(/>([^<]+)<\/a>/i, `>${(innerText + ' ' + append).replace(/\s+/g, ' ').trim()}</a>`);
                return newInner.replace(/href="[^"]+"/, `href="${newHref}"`);
            } catch (e) { return m; }
        }
    );

    // Final pass: if an anchor is followed by a zip/postcode token (numeric or alphanumeric)
    // possibly on its own line (e.g., a trailing ZIP on the next line or "USA" after a <br>),
    // merge that token (and optional trailing country) into the anchor.
    escaped = escaped.replace(/(<a\b[^>]*>[^<]+<\/a>)(\s*(?:,|<br\s*\/?\>)+\s*)([A-Za-z0-9\-]{3,10})(?:\s*(?:,|<br\s*\/?\>)*\s*([A-Za-z][A-Za-z\s\.]{2,40}))?/gi,
        (m, anchorHtml, sep, zip, country) => {
            if (!zip) return m;
            const hrefMatch = anchorHtml.match(/href="([^"]+)"/i);
            if (!hrefMatch) return m;
            try {
                const href = hrefMatch[1];
                const qMatch = href.match(/[?&]query=([^&]+)/i);
                if (!qMatch) return m;
                const decoded = decodeURIComponent(qMatch[1]);
                const appendForHref = (zip + (country ? ', ' + country : '')).replace(/<br\s*\/?\>/gi, ' ').replace(/[\s,]+$/, '').trim();
                const newQuery = encodeURIComponent((decoded + ' ' + appendForHref).replace(/\s+/g, ' ').trim());
                const newHref = href.replace(/([?&]query=)[^&]+/i, `$1${newQuery}`);
                // inner HTML: preserve <br> separator when present
                const innerMatch = anchorHtml.match(/>([^<]+)<\/a>/i);
                if (!innerMatch) return m;
                const innerText = innerMatch[1];
                const sepHtml = /<br\s*\/?\>/i.test(sep) ? '<br>' : ' ';
                const newInner = anchorHtml.replace(/>([^<]+)<\/a>/i, `>${(innerText + sepHtml + (zip + (country ? ', ' + country : '')).replace(/<br\s*\/?\>/gi, ' ').replace(/[\s,]+$/, '').trim())}</a>`);
                return newInner.replace(/href="[^"]+"/, `href="${newHref}"`);
            } catch (e) { return m; }
        }
    );

    // Phone numbers (basic)
    escaped = escaped.replace(
        /(\+?\d[\d\s\-\(\)]{7,}\d)/g,
        '<a href="tel:$1" >$1</a>'
    );

    return escaped;
}