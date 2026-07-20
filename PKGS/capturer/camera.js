async function screenshotTargets(targets, options = {}) {
  const {
    imageType = "image/png",
    quality = 1,
    scale = window.devicePixelRatio || 1,
    backgroundColor = null,
    timeout = 30000
  } = options;

  const selectors = Array.isArray(targets) ? targets : [targets];

  if (!selectors.length) {
    throw new Error("No target selector was provided.");
  }

  await ensureHtml2Canvas();

  const originalHTML = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;

  const iframe = document.createElement("iframe");

  iframe.setAttribute("sandbox", "allow-same-origin");

  iframe.style.position = "fixed";
  iframe.style.left = "-100000px";
  iframe.style.top = "0";
  iframe.style.width = Math.max(
    document.documentElement.scrollWidth,
    window.innerWidth
  ) + "px";
  iframe.style.height = Math.max(
    document.documentElement.scrollHeight,
    window.innerHeight
  ) + "px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-999999";

  document.body.appendChild(iframe);

  try {
    const iframeLoaded = waitForIframeLoad(iframe, timeout);

    iframe.srcdoc = injectBaseTag(originalHTML);

    await iframeLoaded;

    const iframeWindow = iframe.contentWindow;
    const iframeDoc = iframe.contentDocument;

    if (!iframeWindow || !iframeDoc) {
      throw new Error("Could not access iframe document.");
    }

    iframeWindow.scrollTo(0, 0);

    await waitForFonts(iframeDoc);
    await waitForImages(iframeDoc, timeout);

    const foundElements = [];

    for (const selector of selectors) {
      const matches = Array.from(iframeDoc.querySelectorAll(selector));
      foundElements.push(...matches);
    }

    const targetElements = [...new Set(foundElements)];

    if (!targetElements.length) {
      throw new Error(
        "No elements found for selector(s): " + selectors.join(", ")
      );
    }

    hideEverythingExceptTargets(iframeDoc, targetElements);

    await nextFrame(iframeWindow);
    await nextFrame(iframeWindow);

    const bounds = getUnionBounds(targetElements, iframeWindow);

    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
      throw new Error("Target element has no visible screenshot size.");
    }

    const canvas = await html2canvas(iframeDoc.documentElement, {
      x: bounds.left,
      y: bounds.top,
      width: bounds.width,
      height: bounds.height,
      windowWidth: iframeDoc.documentElement.scrollWidth,
      windowHeight: iframeDoc.documentElement.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: false,
      logging: false
    });

    const image = canvas.toDataURL(imageType, quality);

    return image;
  } finally {
    iframe.remove();
  }
}

async function ensureHtml2Canvas() {
  if (window.html2canvas) {
    return;
  }

  await new Promise((resolve, reject) => {
    const oldScript = document.querySelector("script[data-html2canvas-loader]");

    if (oldScript) {
      oldScript.addEventListener("load", resolve, { once: true });
      oldScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    script.async = true;
    script.dataset.html2canvasLoader = "true";

    script.onload = resolve;

    script.onerror = function () {
      reject(new Error("Failed to load html2canvas."));
    };

    document.head.appendChild(script);
  });
}

function waitForIframeLoad(iframe, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Iframe load timed out."));
    }, timeout);

    iframe.onload = function () {
      clearTimeout(timer);
      resolve();
    };
  });
}

async function waitForFonts(doc) {
  if (doc.fonts && doc.fonts.ready) {
    try {
      await doc.fonts.ready;
    } catch (err) {
      // Ignore font loading errors.
    }
  }
}

async function waitForImages(doc, timeout) {
  const images = Array.from(doc.images || []);

  if (!images.length) {
    return;
  }

  const imagePromises = images.map(img => {
    if (img.complete) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  await Promise.race([
    Promise.all(imagePromises),
    new Promise(resolve => setTimeout(resolve, timeout))
  ]);
}

function hideEverythingExceptTargets(doc, targets) {
  const keep = new Set();

  for (const target of targets) {
    keep.add(target);

    let parent = target.parentElement;

    while (parent) {
      keep.add(parent);
      parent = parent.parentElement;
    }

    const children = target.querySelectorAll("*");

    children.forEach(child => {
      keep.add(child);
    });
  }

  keep.forEach(element => {
    element.setAttribute("data-screenshot-keep", "true");
  });

  const style = doc.createElement("style");

  /*
    Using visibility:hidden instead of display:none.

    display:none destroys layout, so the browser cannot correctly calculate
    the target element's position and size. visibility:hidden keeps the layout
    but visually hides everything except the target.
  */

  style.textContent = `
    * {
      visibility: hidden !important;
    }

    [data-screenshot-keep="true"],
    [data-screenshot-keep="true"] * {
      visibility: visible !important;
    }

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
    }
  `;

  doc.head.appendChild(style);
}

function getUnionBounds(elements, win) {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const element of elements) {
    const rect = element.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }

    left = Math.min(left, rect.left + win.scrollX);
    top = Math.min(top, rect.top + win.scrollY);
    right = Math.max(right, rect.right + win.scrollX);
    bottom = Math.max(bottom, rect.bottom + win.scrollY);
  }

  if (!Number.isFinite(left)) {
    return null;
  }

  return {
    left: Math.floor(left),
    top: Math.floor(top),
    width: Math.ceil(right - left),
    height: Math.ceil(bottom - top)
  };
}

function nextFrame(win) {
  return new Promise(resolve => {
    win.requestAnimationFrame(resolve);
  });
}

function injectBaseTag(html) {
  const baseTag = `${escapeAttribute(document.baseURI)}`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }

  return html.replace(/<html[^>]*>/i, match => `${match}<head>${baseTag}</head>`);
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

window.screenshotTargets = screenshotTargets;
