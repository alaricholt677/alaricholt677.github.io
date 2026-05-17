// winui3-kit.js
// Simple, stable, Fluent-like WinUI kit (no Shadow DOM, styles always apply)
window.addEventListener("error", e => {
    console.log("WINUI ERROR:", e.error);
    alert("WinUI Error: " + e.error);
});

(() => {
    // ---------------- THEME ENGINE ----------------
const WINDOWS_ICONS = {

    // --- CORE ICONS ---
    settings: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8a4 4 0 110 8 4 4 0 010-8zm9.44 4.94l-1.72-.99c.04-.31.06-.63.06-.95s-.02-.64-.06-.95l1.72-.99a.5.5 0 00.18-.68l-1.7-2.94a.5.5 0 00-.66-.2l-1.72.99a7.07 7.07 0 00-1.64-.95l-.26-1.93A.5.5 0 0014.5 2h-3a.5.5 0 00-.5.42l-.26 1.93c-.6.24-1.15.55-1.64.95l-1.72-.99a.5.5 0 00-.66.2L4.02 7.45a.5.5 0 00.18.68l1.72.99c-.04.31-.06.63-.06.95s.02.64.06.95l-1.72.99a.5.5 0 00-.18.68l1.7 2.94c.14.24.44.32.66.2l1.72-.99c.49.4 1.04.71 1.64.95l.26 1.93c.04.24.25.42.5.42h3c.25 0 .46-.18.5-.42l.26-1.93c.6-.24 1.15-.55 1.64-.95l1.72.99c.22.12.52.04.66-.2l1.7-2.94a.5.5 0 00-.18-.68z"/>
        </svg>
    `,

    home: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"/>
        </svg>
    `,

    folder: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h6z"/>
        </svg>
    `,

    file: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
        </svg>
    `,

    search: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 2a8 8 0 105.29 14.29l4.71 4.7 1.41-1.41-4.7-4.71A8 8 0 0010 2z"/>
        </svg>
    `,

    wifi: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 18a2 2 0 110 4 2 2 0 010-4zm-6.36-3.64a10 10 0 0112.72 0l-1.41 1.41a8 8 0 00-9.9 0l-1.41-1.41zm-3.54-3.54a16 16 0 0120.8 0l-1.41 1.41a14 14 0 00-17.98 0L2.1 10.82z"/>
        </svg>
    `,

    battery: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="7" width="18" height="10" rx="2"/>
            <rect x="20" y="10" width="2" height="4"/>
        </svg>
    `,

    bluetooth: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l6 6-4 4 4 4-6 6V14l-4 4V6l4 4V2z"/>
        </svg>
    `,

    arrow_left: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 6l-6 6 6 6"/>
        </svg>
    `,

    arrow_right: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6l6 6-6 6"/>
        </svg>
    `,

    arrow_up: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 14l6-6 6 6"/>
        </svg>
    `,

    arrow_down: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 10l6 6 6-6"/>
        </svg>
    `,

    check: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6l-11 11-5-5"/>
        </svg>
    `,

    close: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6l12 12M6 18L18 6"/>
        </svg>
    `,

    menu: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h18M3 12h18M3 18h18"/>
        </svg>
    `,

    more: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="19" cy="12" r="2"/>
        </svg>
    `,

    person: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20a8 8 0 0116 0"/>
        </svg>
    `,

    lock: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="10" width="14" height="10" rx="2"/>
            <path d="M8 10V7a4 4 0 118 0v3"/>
        </svg>
    `,

    unlock: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="10" width="14" height="10" rx="2"/>
            <path d="M16 10V7a4 4 0 00-8 0"/>
        </svg>
    `,

    info: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <rect x="11" y="10" width="2" height="7" fill="#fff"/>
            <rect x="11" y="7" width="2" height="2" fill="#fff"/>
        </svg>
    `,

    // --- NEXT 20 ICONS ---
    folder_open: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h7l2 2h9v2H3V6zm0 4h21l-2 10H5L3 10z"/>
        </svg>
    `,

    trash: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9z"/>
        </svg>
    `,

    edit: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
    `,

    save: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zM12 19a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z"/>
        </svg>
    `,

    download: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v12l4-4 1.41 1.41L12 18.83l-5.41-5.42L8 11l4 4V3h2zM5 19h14v2H5v-2z"/>
        </svg>
    `,

    upload: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21V9l-4 4-1.41-1.41L12 5.17l5.41 5.42L16 13l-4-4v12h-2zM5 3h14v2H5V3z"/>
        </svg>
    `,

    refresh: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35A8 8 0 106.35 17.65 8 8 0 0017.65 6.35zM12 4a6 6 0 015.91 5H15l3 3 3-3h-2.91A8 8 0 114 12h2a6 6 0 016-8z"/>
        </svg>
    `,

    share: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <path d="M8.59 13.51l6.83 3.98-.98 1.72-6.83-3.98.98-1.72zm6.83-7.02l-6.83 3.98-.98-1.72 6.83-3.98.98 1.72z"/>
        </svg>
    `,

    camera: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 3l1.5 2H15l1.5-2H21v18H3V3h6zm3 5a5 5 0 100 10 5 5 0 000-10z"/>
        </svg>
    `,

    image: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5v14H3V5h18zm-2 2H5v10h14V7zm-3 8l-3-4-2 3-1-1-3 4h9z"/>
        </svg>
    `,

    video: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 5h14v14H3V5zm16 3l4-2v12l-4-2V8z"/>
        </svg>
    `,

    play: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
        </svg>
    `,

    pause: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/>
        </svg>
    `,

    stop: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12"/>
        </svg>
    `,

    volume: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 9v6h4l5 5V4l-5 5H5z"/>
        </svg>
    `,

    volume_mute: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 9v6h4l5 5V4l-5 5H5zm10.59 3l2.12-2.12 1.41 1.41L17 13.41l2.12 2.12-1.41 1.41L15.59 15l-2.12 2.12-1.41-1.41L14.17 13l-2.12-2.12 1.41-1.41L15.59 11z"/>
        </svg>
    `,

    calendar: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm13 6H4v12h16V8z"/>
        </svg>
    `,

    clock: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11h5v2h-7V7h2v6z"/>
        </svg>
    `,

    pin: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2l6 6-4 4 2 8-2 2-8-2-4 4-2-2 4-4-2-8 4-4 6-6z"/>
        </svg>
    `,

    unpin: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3l18 18-1.41 1.41L14 16l-2 8-2-2 2-8-4-4-8-2 2-2 8 2 4-4L4.41 1.59 3 3z"/>
        </svg>
    `

};

    const ACCENTS = {
        blue:   "#2563eb",
        purple: "#7c3aed",
        red:    "#ef4444",
        orange: "#f97316",
        yellow: "#eab308",
        green:  "#22c55e",
        pink:   "#ec4899"
    };

    function hexToRgb(hex) {
        hex = hex.replace("#", "");
        if (hex.length === 3) hex = hex.split("").map(x => x + x).join("");
        const n = parseInt(hex, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function darken(hex, f = 0.25) {
        const { r, g, b } = hexToRgb(hex);
        return `rgb(${Math.round(r*(1-f))}, ${Math.round(g*(1-f))}, ${Math.round(b*(1-f))})`;
    }

    function alpha(hex, a = 0.18) {
        const { r, g, b } = hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    function applyTheme() {
        const opts = document.querySelector("windows-options");
        const theme = (opts?.getAttribute("theme") || "light").toLowerCase();
        const mica  = (opts?.getAttribute("mica")  || "on").toLowerCase();
        const accentName = (opts?.getAttribute("accent") || "blue").toLowerCase();

        const accent = ACCENTS[accentName] || accentName || ACCENTS.blue;
        const accentDark = darken(accent);
        const accentSoft = alpha(accent, 0.18);
        const accentSoftStrong = alpha(accent, 0.28);

        const root = document.documentElement;

        root.style.setProperty("--win-transition",
            "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease");
        root.style.setProperty("--win-accent", accent);
        root.style.setProperty("--win-accent-dark", accentDark);
        root.style.setProperty("--win-accent-soft", accentSoft);
        root.style.setProperty("--win-accent-soft-strong", accentSoftStrong);

        if (theme === "dark") {
            root.style.setProperty("--win-fg", "#f9fafb");
            root.style.setProperty("--win-fg-subtle", "#e5e7eb");
            root.style.setProperty("--win-fg-muted", "#9ca3af");
            root.style.setProperty("--win-border-subtle", "rgba(255,255,255,0.08)");
            root.style.setProperty("--win-border-strong", "rgba(255,255,255,0.18)");
            root.style.setProperty("--win-surface", "rgba(24,24,27,0.96)");
            root.style.setProperty("--win-surface-alt", "rgba(17,24,39,0.98)");
            root.style.setProperty("--win-shadow-strong", "0 18px 45px rgba(0,0,0,0.7)");
            root.style.setProperty("--win-body-bg", "#020617");

            if (mica === "on") {
                root.style.setProperty("--win-window-bg",
                    "radial-gradient(circle at top left, rgba(24,24,27,0.96), rgba(15,23,42,0.96))");
                root.style.setProperty("--win-window-backdrop", "blur(26px) saturate(180%)");
            } else {
                root.style.setProperty("--win-window-bg", "#111827");
                root.style.setProperty("--win-window-backdrop", "none");
            }
        } else {
            root.style.setProperty("--win-fg", "#111827");
            root.style.setProperty("--win-fg-subtle", "#4b5563");
            root.style.setProperty("--win-fg-muted", "#6b7280");
            root.style.setProperty("--win-border-subtle", "rgba(15,23,42,0.08)");
            root.style.setProperty("--win-border-strong", "rgba(15,23,42,0.16)");
            root.style.setProperty("--win-surface", "rgba(248,250,252,0.96)");
            root.style.setProperty("--win-surface-alt", "rgba(241,245,249,0.98)");
            root.style.setProperty("--win-shadow-strong", "0 18px 45px rgba(15,23,42,0.35)");
            root.style.setProperty("--win-body-bg", "#dfe3e8");

            if (mica === "on") {
                root.style.setProperty("--win-window-bg",
                    "radial-gradient(circle at top left, rgba(255,255,255,0.96), rgba(241,245,249,0.96))");
                root.style.setProperty("--win-window-backdrop", "blur(26px) saturate(180%)");
            } else {
                root.style.setProperty("--win-window-bg", "#f3f4f6");
                root.style.setProperty("--win-window-backdrop", "none");
            }
        }
    }

    const opts = document.querySelector("windows-options");
    if (opts) {
        new MutationObserver(applyTheme).observe(opts, { attributes: true });
    }
    applyTheme();

    // ---------------- GLOBAL FLUENT CSS ----------------

    const style = document.createElement("style");
    style.textContent = `
    :root {
        --win-radius-large: 12px;
        --win-radius-medium: 8px;
        --win-radius-small: 6px;
        --win-focus-ring-color: rgba(37,99,235,0.55);
        --win-font-family: "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, sans-serif;
    }

    * { box-sizing: border-box; }

    body {
        margin: 0;
        background: var(--win-body-bg, #dfe3e8);
        font-family: var(--win-font-family);
        transition: var(--win-transition);
    }

    win-window, win-button, win-textbox, win-checkbox, win-toggle, win-nav, win-nav-item {
        font-family: var(--win-font-family);
    }

    /* WINDOW */
    win-window {
        position: absolute;
        display: block;
        width: 560px;
        height: 380px;
        border-radius: var(--win-radius-large);
        overflow: hidden;
        background: var(--win-window-bg);
        backdrop-filter: var(--win-window-backdrop);
        box-shadow: var(--win-shadow-strong);
        color: var(--win-fg);
        animation: winui-window-open 0.18s ease-out;
        transition: var(--win-transition);
    }

    @keyframes winui-window-open {
        from { transform: translateY(6px) scale(0.98); opacity: 0; }
        to   { transform: translateY(0) scale(1); opacity: 1; }
    }

    win-window .winui-window-root {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    win-window .winui-titlebar {
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
        background: linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.08));
        border-bottom: 1px solid var(--win-border-subtle);
        cursor: grab;
        user-select: none;
        transition: var(--win-transition);
    }

    win-window .winui-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--win-fg-subtle);
    }

    win-window .winui-controls {
        display: flex;
        gap: 2px;
    }

    win-window .winui-caption-btn {
        width: 46px;
        height: 30px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        color: var(--win-fg-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.12s ease, color 0.12s ease;
    }

    win-window .winui-caption-btn:hover {
        background: rgba(255,255,255,0.08);
    }

    win-window .winui-caption-btn.close:hover {
        background: #e81123;
        color: #ffffff;
    }

    win-window .winui-body {
        flex: 1;
        padding: 16px 18px;
        background: var(--win-surface);
        overflow: auto;
        transition: var(--win-transition);
    }

    /* BUTTON */
    win-button .winui-button {
        min-width: 88px;
        height: 32px;
        padding: 0 14px;
        border-radius: var(--win-radius-small);
        border: 1px solid var(--win-border-subtle);
        background: linear-gradient(to bottom, var(--win-surface-alt), var(--win-surface));
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: var(--win-fg);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 1px 0 rgba(255,255,255,0.06);
        transition: background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, transform 0.06s ease, color 0.12s ease;
    }

    win-button .winui-button:hover {
        background: linear-gradient(to bottom, var(--win-surface-alt), var(--win-surface-alt));
        border-color: var(--win-border-strong);
    }

    win-button .winui-button.primary {
        background: linear-gradient(to bottom, var(--win-accent), var(--win-accent-dark));
        border-color: var(--win-accent-dark);
        color: #ffffff;
        box-shadow: 0 1px 0 rgba(255,255,255,0.25);
    }

    /* TEXTBOX */
    win-textbox .winui-textbox {
        width: 100%;
        height: 32px;
        border-radius: var(--win-radius-small);
        border: 1px solid var(--win-border-strong);
        padding: 0 10px;
        font-size: 13px;
        color: var(--win-fg);
        background: var(--win-surface-alt);
        outline: none;
        box-shadow: 0 1px 0 rgba(255,255,255,0.04);
        transition: border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease, color 0.12s ease;
    }

    /* CHECKBOX */
    win-checkbox .winui-checkbox {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--win-fg);
        cursor: pointer;
    }

    win-checkbox .winui-checkbox-box {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        border: 1px solid var(--win-border-strong);
        background: var(--win-surface-alt);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: #ffffff;
        box-shadow: 0 1px 0 rgba(255,255,255,0.04);
        transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease, color 0.12s ease;
    }

    win-checkbox .winui-checkbox-box.checked {
        background: var(--win-accent);
        border-color: var(--win-accent-dark);
        box-shadow: 0 0 0 1px var(--win-accent-soft-strong);
    }

    /* TOGGLE */
    win-toggle .winui-toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--win-fg);
        cursor: pointer;
    }

    win-toggle .winui-toggle-track {
        width: 40px;
        height: 20px;
        border-radius: 999px;
        background: #4b5563;
        position: relative;
        transition: background 0.14s ease;
    }

    win-toggle .winui-toggle-thumb {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: var(--win-surface-alt);
        position: absolute;
        top: 1px;
        left: 1px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        transition: transform 0.14s ease, background 0.14s ease;
    }

    win-toggle .winui-toggle-track.on {
        background: var(--win-accent);
    }

    win-toggle .winui-toggle-track.on .winui-toggle-thumb {
        transform: translateX(20px);
        background: #ffffff;
    }

    /* NAV */
    win-nav {
        display: block;
        width: 220px;
        background: var(--win-surface-alt);
        border-radius: var(--win-radius-medium);
        border: 1px solid var(--win-border-subtle);
        padding: 6px;
        font-size: 13px;
        color: var(--win-fg);
        transition: var(--win-transition);
    }

    win-nav-item .winui-nav-item {
        padding: 7px 10px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--win-fg-muted);
        transition: background 0.12s ease, color 0.12s ease;
    }

    win-nav-item .winui-nav-item:hover {
        background: rgba(255,255,255,0.06);
    }

    win-nav-item .winui-nav-item.active {
        background: var(--win-accent-soft);
        color: var(--win-accent-dark);
        font-weight: 500;
    }
winui-icon, windows-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--win-fg);
}

windows-icon svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
}

    `;
    document.head.appendChild(style);

    // ---------------- COMPONENTS (NO SHADOW DOM) ----------------

    let topZ = 100;

class WinWindow extends HTMLElement {
    connectedCallback() {
        try {
            if (this._initialized) return;
            this._initialized = true;

            // Save original content BEFORE overwriting
            const originalContent = this.innerHTML;

            // Build window shell
            this.innerHTML = `
                <div class="winui-window-root">
                    <div class="winui-titlebar">
                        <div class="winui-title">${this.getAttribute("title") || "Window"}</div>
                        <div class="winui-controls">
                            <button class="winui-caption-btn minimize">—</button>
                            <button class="winui-caption-btn close">×</button>
                        </div>
                    </div>
                    <div class="winui-body">
                        <div class="winui-content"></div>
                    </div>
                </div>
            `;

            // Restore original content
            this.querySelector(".winui-content").innerHTML = originalContent;

            // Ensure body is visible
            this.querySelector(".winui-body").style.display = "block";

            // Positioning
            this.style.position = "absolute";
            this.style.left = this.getAttribute("left") || "100px";
            this.style.top = this.getAttribute("top") || "100px";
            this.style.zIndex = ++topZ;

            // Dragging
            const titlebar = this.querySelector(".winui-titlebar");
            let dragging = false, ox = 0, oy = 0;

            titlebar.addEventListener("mousedown", e => {
                dragging = true;
                ox = e.clientX - this.offsetLeft;
                oy = e.clientY - this.offsetTop;
                this.style.zIndex = ++topZ;
            });

            document.addEventListener("mousemove", e => {
                if (!dragging) return;
                this.style.left = (e.clientX - ox) + "px";
                this.style.top = (e.clientY - oy) + "px";
            });

            document.addEventListener("mouseup", () => dragging = false);

            // Close
            this.querySelector(".close").addEventListener("click", () => this.remove());

            // Minimize
            this.querySelector(".minimize").addEventListener("click", () => {
                const body = this.querySelector(".winui-body");
                body.style.display = body.style.display === "none" ? "block" : "none";
            });

            // Bring to front
            this.addEventListener("mousedown", () => {
                this.style.zIndex = ++topZ;
            });

        } catch (err) {
            console.error("WIN-WINDOW ERROR:", err);
            alert("WinWindow crashed: " + err);
        }
    }
}

    class WinButton extends HTMLElement {
        connectedCallback() {
            if (this._initialized) return;
            this._initialized = true;

            const label = this.innerHTML.trim() || this.getAttribute("label") || "Button";
            const primary = this.hasAttribute("primary") ? "primary" : "";
            this.innerHTML = `<button class="winui-button ${primary}">${label}</button>`;

            this.querySelector("button").addEventListener("click", e => {
                this.dispatchEvent(new CustomEvent("win-click", { bubbles: true, detail: { originalEvent: e } }));
            });
        }
    }

    class WinTextbox extends HTMLElement {
        connectedCallback() {
            if (this._initialized) return;
            this._initialized = true;

            const placeholder = this.getAttribute("placeholder") || "";
            const value = this.getAttribute("value") || "";
            this.innerHTML = `<input class="winui-textbox" type="text" placeholder="${placeholder}">`;
            const input = this.querySelector("input");
            input.value = value;

            input.addEventListener("input", () => {
                this.setAttribute("value", input.value);
                this.dispatchEvent(new CustomEvent("win-input", { bubbles: true, detail: { value: input.value } }));
            });
        }

        get value() { return this.getAttribute("value") || ""; }
        set value(v) {
            this.setAttribute("value", v);
            const input = this.querySelector("input");
            if (input) input.value = v;
        }
    }

    class WinCheckbox extends HTMLElement {
        connectedCallback() {
            if (this._initialized) return;
            this._initialized = true;

            const label = this.getAttribute("label") || "";
            this.innerHTML = `
                <div class="winui-checkbox">
                    <div class="winui-checkbox-box"></div>
                    <span class="winui-checkbox-label">${label}</span>
                </div>
            `;
            const box = this.querySelector(".winui-checkbox-box");

            if (this.hasAttribute("checked")) {
                box.classList.add("checked");
                box.textContent = "✓";
            }

            this.addEventListener("click", () => {
                const checked = !this.checked;
                this.checked = checked;
                this.dispatchEvent(new CustomEvent("win-change", { bubbles: true, detail: { checked } }));
            });
        }

        get checked() { return this.hasAttribute("checked"); }
        set checked(v) {
            const box = this.querySelector(".winui-checkbox-box");
            if (!box) return;
            if (v) {
                this.setAttribute("checked", "");
                box.classList.add("checked");
                box.textContent = "✓";
            } else {
                this.removeAttribute("checked");
                box.classList.remove("checked");
                box.textContent = "";
            }
        }
    }

    class WinToggle extends HTMLElement {
        connectedCallback() {
            if (this._initialized) return;
            this._initialized = true;

            const label = this.getAttribute("label") || "";
            this.innerHTML = `
                <div class="winui-toggle">
                    <div class="winui-toggle-track">
                        <div class="winui-toggle-thumb"></div>
                    </div>
                    <span class="winui-toggle-label">${label}</span>
                </div>
            `;
            const track = this.querySelector(".winui-toggle-track");

            if (this.hasAttribute("on")) {
                track.classList.add("on");
            }

            this.addEventListener("click", () => {
                const on = !this.on;
                this.on = on;
                this.dispatchEvent(new CustomEvent("win-change", { bubbles: true, detail: { on } }));
            });
        }

        get on() { return this.hasAttribute("on"); }
        set on(v) {
            const track = this.querySelector(".winui-toggle-track");
            if (!track) return;
            if (v) {
                this.setAttribute("on", "");
                track.classList.add("on");
            } else {
                this.removeAttribute("on");
                track.classList.remove("on");
            }
        }
    }

    class WinNav extends HTMLElement {
        connectedCallback() {
            if (this._initialized) return;
            this._initialized = true;

            // Just rely on <win-nav-item> styling; no extra markup needed
        }
    }

    class WinNavItem extends HTMLElement {
        connectedCallback() {
            if (this._initialized) return;
            this._initialized = true;

            const label = this.getAttribute("label") || this.textContent.trim() || "Item";
            this.innerHTML = `<div class="winui-nav-item">${label}</div>`;

            this.addEventListener("click", () => {
                const parent = this.closest("win-nav");
                if (!parent) return;
                parent.querySelectorAll("win-nav-item .winui-nav-item").forEach(el => el.classList.remove("active"));
                this.querySelector(".winui-nav-item").classList.add("active");

                const index = Array.from(parent.querySelectorAll("win-nav-item")).indexOf(this);
                parent.dispatchEvent(new CustomEvent("win-change", { bubbles: true, detail: { index } }));
            });
        }
    }
class WindowsIcon extends HTMLElement {
    connectedCallback() {
        if (this._initialized) return;
        this._initialized = true;

        const type = this.getAttribute("type");
        const svg = WINDOWS_ICONS[type];

        if (!svg) {
            this.innerHTML = `<span style="color:red;font-size:12px;">[missing icon: ${type}]</span>`;
            return;
        }

        this.innerHTML = `
            <div class="winui-icon">${svg}</div>
        `;
    }
}

    customElements.define("windows-icon", WindowsIcon);
    customElements.define("win-window", WinWindow);
    customElements.define("win-button", WinButton);
    customElements.define("win-textbox", WinTextbox);
    customElements.define("win-checkbox", WinCheckbox);
    customElements.define("win-toggle", WinToggle);
    customElements.define("win-nav", WinNav);
    customElements.define("win-nav-item", WinNavItem);
})();
