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
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("in-view");
        else entry.target.classList.remove("in-view");
    });
});

document.querySelectorAll("section").forEach(sec => observer.observe(sec));
let sweepTimeout;

window.addEventListener("scroll", () => {
    document.body.classList.add("sweep");
    clearTimeout(sweepTimeout);
    sweepTimeout = setTimeout(() => {
        document.body.classList.remove("sweep");
    }, 150);
});
let scrollGlow;

window.addEventListener("scroll", () => {
    document.body.classList.add("scrolling");
    clearTimeout(scrollGlow);
    scrollGlow = setTimeout(() => {
        document.body.classList.remove("scrolling");
    }, 200);
});
