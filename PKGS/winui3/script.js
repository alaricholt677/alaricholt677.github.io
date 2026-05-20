// Apply to all text elements
const liquidTargets = document.querySelectorAll(`
    h1, h2, h3, h4, h5, h6,
    p, span, a, li, label,
    strong, b, em, i, button,
    .liquid-text
`);

liquidTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
        el.classList.remove('drain');
        el.classList.add('inject');
    });

    el.addEventListener('mouseleave', () => {
        el.classList.remove('inject');
        el.classList.add('drain');
    });
});

window.addEventListener("scroll", () => {
    const y = window.scrollY * 0.03;
    document.body.style.backgroundPosition = `50% ${y}%`;
});
