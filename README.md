[![win12-icon](https://alaricholt677.github.io/win12-icon.svg)](https://alaricholt677.github.io)
# Win12 Simulator — The Browser‑Native OS

[![Stars](https://img.shields.io/github/stars/alaricholt677/alaricholt677.github.io?style=for-the-badge)](https://github.com/alaricholt677/alaricholt677.github.io/stargazers)
[![Forks](https://img.shields.io/github/forks/alaricholt677/alaricholt677.github.io?style=for-the-badge)](https://github.com/alaricholt677/alaricholt677.github.io/forks)
[![Issues](https://img.shields.io/github/issues/alaricholt677/alaricholt677.github.io?style=for-the-badge)](https://github.com/alaricholt677/alaricholt677.github.io/issues)
[![License](https://img.shields.io/github/license/alaricholt677/alaricholt677.github.io?style=for-the-badge)](LICENSE)

---

# 🌐 Overview

**Win12 Simulator** is a futuristic, fully browser‑native operating system built using  
**pure HTML, CSS, and JavaScript** — no backend, no frameworks, no external servers.

It simulates a next‑generation Windows‑style OS with:

- A complete **Win12 shell**
- A full **window manager**
- **Start menu**, **taskbar**, **widgets**
- **Theme engine**
- **Browser**
- **Camera recorder**
- **Host.exe subsystem**
- **Base64 `.exe` launcher**
- **Multi‑user system**
- **Session importer/exporter**
- A full suite of **apps**
- A fully emulated **virtual filesystem**

Everything runs **client‑side** and persists using LocalStorage.

---

# ⭐ If You Starred This Project…

### 👉 **Click here to visit the Thank‑You Shrine:**  
### **https://alaricholt677.github.io/thanks/thanks.html**

You get a special page dedicated to supporters.

---

# 🎮 Want to Play Mods or Games?

### 👉 **Visit the MOD Hub:**  
### **https://alaricholt677.github.io/MOD**

---

# ⛏️ Want to Play My Minecraft Recreation?

### 👉 **Download / Redirect Page:**  
### **https://alaricholt677.github.io/downloads/**

---

# 🧭 Developer Strategies (Read Before Contributing)

Win12 Simulator is built on **patterns**.  
Once you understand these patterns, you can add apps, fix bugs, or extend the OS without breaking anything.

---

## 🔹 1. Start Menu Pattern

```html
          <div class="start-app" data-app="(app name)" data-app-name="(app name for data)">
            <div class="start-app-icon" style="background:linear-gradient(135deg,#ffcc66,#ff9966);"></div>
            <div>appName</div>
            <div class="start-app-sub">first sub + second sub (add or remvoe any sub you want)</div>
          </div>
```

### ✔ Strategy  
- Duplicate an existing block  
- Change `data-app`, icon, and name  
- The launcher auto‑detects it  

---

## 🔹 2. Taskbar Pattern

```html
        <div class="taskbar-app" data-app="data-app-here" title="Name Here"></div>
```

### ✔ Strategy  
- Taskbar items appear automatically when a window opens  
- If it doesn’t appear, your `data-app` is mismatched  

---

## 🔹 3. Window Skeleton Pattern

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

### ✔ Strategy  
- Always start with this skeleton  
- Keep UI inside `.window-content`  
- Never modify the titlebar structure  

---

## 🔹 4. Use Issues for App Requests

If you want a new app added:

1. Open the **Issue** tab
2. Click **New Issue**
3. Choose **App Request**
4. Describe the app in the boxes provided
5. The MD Already has a **skeleton** to help the developer get on track you can use for **pull requests**.

---

## 🔹 5. Understand the Default File System (FS)

Win12 uses a **virtual filesystem** stored in LocalStorage.

### ✔ Desktop  
- `Welcome.txt`  
- `Readme.md`  
- `SampleApp.exe`  

### ✔ System32  
- Boot scripts  
- Kernel shim  
- VirtualFS handler  
- AIM runtime  
- Host.exe  
- Registry mock  
- Shortcuts  

### ✔ Documents  
- Boot/session logs  
- Association verification  

### ✔ Recommended Files  
- Preview plans  
- FS ideas  
- Embedded iframe previews  

### ✔ Windows Resources  
- Theme colors  
- Fonts  

### ✔ Logs  
- Boot logs  

### ✔ Strategy  
- Never delete System32  
- Desktop/Documents are safe to modify  
- FS entries must include:  
  `path`, `name`, `type`, `ext`, `content`

---

## 🔹 6. App Lifecycle

1. Start Menu entry clicked  
2. Window skeleton created  
3. Taskbar item appears  
4. JS controller initializes  
5. Window manager handles drag/resize  
6. App saves data to LocalStorage  

### ✔ Strategy  
If something breaks:
- Check `data-app`  
- Check window skeleton  
- Check JS controller  
- Check FS path  

---

## 🔹 7. Use Patterns, Not Guesswork

### ✔ Strategy  
- Find an existing example  
- Duplicate it  
- Modify only what you need  

This prevents 90% of bugs.

---

# 📦 Built‑In Apps

| App | Description |
|------|-------------|
| Notepad | Simple text editor |
| Paint | Drawing app |
| Browser | Loads websites & internal pages |
| Camera Recorder | Webcam recorder |
| File Explorer | File manager |
| MiniWeb | Micro browser widget |
| MiniRun | Quick launcher |
| CPU Widget | Fake CPU monitor |
| Notes Shrine | Persistent notes |
| Weather Widget | Simulated weather |
| News Panel | Scrollable news feed |
| Theme Studio | Customize system theme |
| Host.exe | Base64 `.exe` launcher |
| AIM OS | Built‑in assistant |
| CMD + AIM OS file creation | Music player, file tools |

---

# 🧱 Default File System (FS) — Full Breakdown

The FS is defined as:

```js
fs: [
  { path:"/desktop", name:"Welcome.txt", type:"file", ext:".txt", content:"Hello from the Win12 AIM relic.\n\nThis is your desktop Welcome.txt file."},
  { path:"/desktop", name:"Readme.md", type:"file", ext:".md", content:"# Readme\n\nThis is a markdown file in /desktop."},
  { path:"/desktop", name:"SampleApp.exe", type:"file", ext:".exe", content:"(Unsupported type or Binary)"},

  { path:"/Windows/System32/BootHelper", name:"Boot.bat", type:"file", ext:".bat", content:"@echo off\nstart https://alaricholt677.github.io\nexit" },

  { path:"/documents", name:"Session.log", type:"file", ext:".log", content:"(full boot log…)" },

  { path:"/recommended-files", name:"win12PreviewPlans.txt", type:"file", ext:".txt", content:"Ideas: ..."},
  { path:"/recommended-files", name:"RecommendedFS.txt", type:"file", ext:".txt", content:"Most of us started as a coca cola employ..."},
  { path:"/recommended-files", name:"win12PreviewFinal.html", type:"file", ext:".html", content:"<iframe src=https://tjy-gitnub.github.io/win12/desktop.html></iframe>" },

  { path:"/Windows", name:"Win12Config.ini", type:"file", ext:".ini", content:"[System]\nTheme=Dark\nAIMEnabled=true\nFSMode=Virtual\n" },

  { path:"/Windows/System32", name:"KernelShim.sys", type:"file", ext:".sys", content:"// Win12 Kernel Shim..." },
  { path:"/Windows/System32", name:"AIMCore.dll", type:"file", ext:".dll", content:"// AIM Core Runtime..." },
  { path:"/Windows/System32", name:"VirtualFS.dll", type:"file", ext:".dll", content:"// Virtual FileSystem Handler..." },
  { path:"/Windows/System32", name:"Host.exe", type:"file", ext:".exe", content:"// Host.exe..." },
  { path:"/Windows/System32", name:"Regedit.exe", type:"file", ext:".exe", content:"// Registry Editor mock..." },
  { path:"/Windows/System32", name:"ShellLink.lnk", type:"file", ext:".lnk", content:"Shortcut: /Windows/System32/Host.exe" },

  { path:"/Windows/System32/BootHelper", name:"BootSequence.cfg", type:"file", ext:".cfg", content:"boot=Boot.bat\nfallback=SafeMode.bat\n" },
  { path:"/Windows/System32/BootHelper", name:"SafeMode.bat", type:"file", ext:".bat", content:"@echo off\ncls\necho Starting Win12 in Safe Mode...\n" },

  { path:"/Windows/Fonts", name:"Win12Sans.ttf", type:"file", ext:".ttf", content:"(Binary font placeholder)" },

  { path:"/Windows/Resources", name:"ThemeColors.json", type:"file", ext:".json", content:'{ "accent":"#b400ff", "background":"#0c0c0c", "taskbar":"#1a1a1a" }' },

  { path:"/Windows/Logs", name:"SystemBoot.log", type:"file", ext:".log", content:"BootHelper invoked.\nKernelShim loaded.\nAIMCore initialized.\n" }
]
```

---

# 🚀 Roadmap

## ✔ Completed
- Shell  
- Window manager  
- File Explorer  
- Notepad  
- Paint  
- Browser  
- Camera recorder  
- Theme Studio  
- Widgets  
- News panel  
- Weather  
- Host.exe  
- Base64 `.exe`  
- Multi‑user  
- Session importer/exporter  
- AIM OS  
- System settings  

## 🟦 In Progress
- UI polish  
- More widgets  
- More system apps  
- Better animations  
- Improved FS tools  

## 🟧 Planned
- Local App Store  
- Plugin API  
- Custom themes gallery  
- Win12 notifications  
- Lock screen  
- Boot animation  
- More AIM OS commands  

---

# 🛠️ Technology

- HTML5  
- CSS3  
- JavaScript  
- LocalStorage  
- MediaDevices API  
- FileReader / Blob  
- Base64 execution layer  

No frameworks.  
No libraries.  
No backend.  
Just raw code.

---

# 🧩 Featured Enhancement — Win12 Floating Dock (Windhawk Mod)

A modern, draggable, theme‑aware dock for Windows that replaces the pinned‑apps area with a clean, Win12‑style floating bar.

### ✨ Features
- Draggable floating dock
- Pinned + running app icons
- Underline indicators for active apps
- Start + Quick Settings buttons
- Theme, size, opacity, and spacing controls
- Dynamic expansion based on icon count

### 🔗 Download / Source
**Windhawk Mod:**  
search for in **`dicovery tab:`** ***"win12 floating dock"*** it might or might *not* appear

This mod was created by **Sean** and is fully compatible with the Win12 aesthetic.

# 🏆 Credits

- **Sean** — Creator, developer, designer  
- **Copilot** — Assistant, collaborator  

---

# ⭐ Support the Project

- ⭐ Star the repo  
- 🍴 Fork it  
- 🐛 Report issues  
- 💡 Suggest features  

Your support helps the project grow.

---

# 🙏 Thank You

## 📌 Extra Pages & Quick Links

| Page | Visit | Spanish |
|------|--------|---------|
| ![Win12 Icon](https://alaricholt677.github.io/win12-icon.svg) **Thank‑You Page** | [Click to visit](https://alaricholt677.github.io/thanks/thanks.html) | *Santuario de Agradecimiento* |
| ![Search Icon](https://alaricholt677.github.io/search.svg) **MOD Hub** | [Click to visit](https://alaricholt677.github.io/MOD) | *Centro de Mods y Juegos* |
| ![User Icon](https://alaricholt677.github.io/user.png) **Minecraft Recreation** | [Click to visit](https://alaricholt677.github.io/downloads/) | *Descarga de la Recreación de Minecraft* |
| ![Win12 Icon](https://alaricholt677.github.io/win12-icon.svg) **Win12 Simulator Homepage** | [Click to visit](https://alaricholt677.github.io) | *Página Principal del Simulador Win12* |
| ![Search Icon](https://alaricholt677.github.io/search.svg) **Win12 Preview (External)** | [Click to visit](https://tjy-gitnub.github.io/win12/desktop.html) | *Vista Previa Externa de Win12* |
| ![User Icon](https://alaricholt677.github.io/user.png) **Recommended Files** | [Click to visit](view-source:https://alaricholt677.github.io) | *Archivos Recomendados* |
| ![Cat Icon](https://alaricholt677.github.io/github_mascot_README.svg) **Github-Style REPO Viewer (do not get confused with github)** | [Click to visit](https://alaricholt677.github.io/github-style-previewer) | *Visor de REPO al estilo Github (no te confundas con github)* |
| ![Search](https://alaricholt677.github.io/search.svg) **MoreOS Selection** | [Click to visit](https://alaricholt677.github.io/moreOS) | *Selección de MoreOS* |
| ![UserIcon](https://alaricholt677.github.io/github_mascot_README.svg) **DOWNLOAD THE KINGERSOLUTION** | [Click to visit](https://alaricholt677.github.io/KingerSolution2.0/) | *DESCARGA EL KINGERSOLUTION* |
