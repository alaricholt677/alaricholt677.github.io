---
name: app request
about: request for an app
title: ''
labels: ''
assignees: ''

---

# Win12 App Request

## Category
- [x] New app request

---

## Idea
Describe the app you want added to the Win12 simulator.

---

## Plan
Explain how you want the app to work inside the OS.  
Include behavior, features, and what the app should do.

---
##DONT EDIT!!!
```html
  <!-- app name -->
  <div class="window" id="window-settings" data-app="apptype for stuff to recognize" data-app-desc="[app name] description">
    <div class="window-header" data-drag-handle>
      <div class="window-title">
        <div class="window-title-icon" style="css if needed for orb icon">(if using style= then nothing here else <svg> icon</div>
        <div class="window-title-text">
          <div class="window-title-main">[app name]</div>
          <div class="window-title-sub">what the app is for.</div>
        </div>
        <div class="window-fullscreen-toggle" title="Toggle fullscreen">[ ]</div>
        <div class="window-info-icon">(i)</div>
        <div class="window-info-tooltip">(leave empty for description to fill up)</div>
      </div>
      <div class="window-controls">
        <div class="window-btn minimize"><div class="window-btn-icon"></div></div>
        <div class="window-btn close"><div class="window-btn-icon"></div></div>
      </div>
    </div>
    <div class="window-body">
        (put html code as window content here)
    </div>
  </div>
```
```js
  (put app js here without script tags)
```
