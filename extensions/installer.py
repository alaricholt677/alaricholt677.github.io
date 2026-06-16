import os
import sys
import threading
import zipfile
import shutil
import tempfile
import urllib.request
from pathlib import Path
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import winreg

EMULATOR_ZIP_URL = "https://alaricholt677.github.io/extensions/custom/emulator.zip"
ICON_URL = "https://img.icons8.com/?size=100&id=qxQNCYAbz0tt&format=png&color=000000"  # should be .ico
EMULATOR_ROOT = Path(r"C:\emulator")
CMDS_DIR = EMULATOR_ROOT / "cmds"
EXECUTOR_BAT = EMULATOR_ROOT / "executor.bat"
ICON_PATH = EMULATOR_ROOT / "emulator.png"
SAMPLE_DIR = EMULATOR_ROOT / "xsample"
SAMPLE_FILE = SAMPLE_DIR / "new.emulator"

PROG_ID = "EmulatorFile"
EXT = ".emulator"


def append_log(text_widget, msg):
    text_widget.configure(state="normal")
    text_widget.insert("end", msg + "\n")
    text_widget.see("end")
    text_widget.configure(state="disabled")
    text_widget.update_idletasks()


def download_file(url, dest, log):
    append_log(log, f"[INSTALLER] Downloading: {url}")
    try:
        with urllib.request.urlopen(url) as r, open(dest, "wb") as f:
            shutil.copyfileobj(r, f)
        append_log(log, "[INSTALLER] Download complete.")
    except Exception as e:
        append_log(log, f"[INSTALLER] ERROR downloading {url}: {e}")
        raise


def extract_zip(zip_path, dest_dir, log):
    append_log(log, f"[INSTALLER] Extracting {zip_path} to {dest_dir}")
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(dest_dir)
    append_log(log, "[INSTALLER] Extraction complete.")


def ensure_path_contains(target, log):
    append_log(log, "[INSTALLER] Updating PATH...")
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment", 0, winreg.KEY_READ | winreg.KEY_WRITE) as key:
        try:
            current, _ = winreg.QueryValueEx(key, "Path")
        except FileNotFoundError:
            current = ""
        paths = current.split(";") if current else []
        if str(target) in paths:
            append_log(log, f"[INSTALLER] PATH already contains {target}")
            return
        new_path = current + (";" if current and not current.endswith(";") else "") + str(target)
        winreg.SetValueEx(key, "Path", 0, winreg.REG_EXPAND_SZ, new_path)
        append_log(log, f"[INSTALLER] Added to PATH: {target}")
        append_log(log, "[INSTALLER] You may need to log out/in or restart shell for PATH changes to apply.")


def write_executor_bat(log):
    append_log(log, "[INSTALLER] Creating executor.bat...")
    content = r"""@echo off
title Emulator Executor
echo [EXECUTOR] Writing path.txt...
if "%~1"=="" (
    echo No .emulator file provided.
    pause
    exit /b 1
)
echo %~1> "%~dp0path.txt"

echo [EXECUTOR] Running converter.py...
"%LOCALAPPDATA%\Programs\Python\Python313\python.exe" "%~dp0converter.py"
if %errorlevel% neq 0 (
    echo Converter failed. Check errors.log
    pause
    exit /b 1
)

echo [EXECUTOR] Running app.py...
"%LOCALAPPDATA%\Programs\Python\Python313\python.exe" "%~dp0app.py"
pause
"""
    EXECUTOR_BAT.write_text(content, encoding="utf-8")
    append_log(log, f"[INSTALLER] executor.bat written to {EXECUTOR_BAT}")


def setup_file_association(log):
    append_log(log, "[INSTALLER] Setting up .emulator file association...")

    # .emulator -> ProgID
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, rf"Software\Classes\{EXT}") as ext_key:
        winreg.SetValueEx(ext_key, "", 0, winreg.REG_SZ, PROG_ID)
        # ShellNew template
        shellnew = winreg.CreateKey(ext_key, "ShellNew")
        winreg.SetValueEx(shellnew, "FileName", 0, winreg.REG_SZ, str(SAMPLE_FILE))

    # ProgID definition
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, rf"Software\Classes\{PROG_ID}") as prog_key:
        winreg.SetValueEx(prog_key, "", 0, winreg.REG_SZ, "OS Emulator File")

        # Default icon
        with winreg.CreateKey(prog_key, "DefaultIcon") as icon_key:
            winreg.SetValueEx(icon_key, "", 0, winreg.REG_SZ, f"{ICON_PATH},0")

        # Open command
        with winreg.CreateKey(prog_key, r"shell\open\command") as cmd_key:
            cmd = f'"{EXECUTOR_BAT}" "%1"'
            winreg.SetValueEx(cmd_key, "", 0, winreg.REG_SZ, cmd)

    append_log(log, "[INSTALLER] File association for .emulator configured.")


def create_sample_file(log):
    append_log(log, "[INSTALLER] Creating sample .emulator file...")
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    text = """New OS Emulator File

// This is a sample .emulator program.
// It shows you how to use the Emulator language and tools.

// converter.py will read this file, pass it through plugins,
// and generate app.py which is then executed by executor.bat.

window Desktop {
    print "Hello from your new OS Emulator file!"
}
"""
    SAMPLE_FILE.write_text(text, encoding="utf-8")
    append_log(log, f"[INSTALLER] Sample file created at {SAMPLE_FILE}")


def install_emulator(log):
    try:
        append_log(log, "[INSTALLER] Starting installation...")

        # Prepare root
        if EMULATOR_ROOT.exists():
            append_log(log, f"[INSTALLER] Existing C:\\emulator found at {EMULATOR_ROOT}, reusing.")
        else:
            EMULATOR_ROOT.mkdir(parents=True, exist_ok=True)
            append_log(log, f"[INSTALLER] Created {EMULATOR_ROOT}")

        # Download emulator.zip
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            zip_path = tmpdir / "emulator.zip"
            download_file(EMULATOR_ZIP_URL, zip_path, log)

            # Extract into temp, then move/merge into C:\emulator
            extract_dir = tmpdir / "emulator_extracted"
            extract_dir.mkdir()
            extract_zip(zip_path, extract_dir, log)

            # If the zip contains a top-level "emulator" folder, use that
            inner_emulator = extract_dir / "emulator"
            if inner_emulator.exists():
                src = inner_emulator
            else:
                src = extract_dir

            # Copy contents into C:\emulator
            for item in src.iterdir():
                dest = EMULATOR_ROOT / item.name
                if dest.exists():
                    if dest.is_dir():
                        shutil.rmtree(dest)
                    else:
                        dest.unlink()
                if item.is_dir():
                    shutil.copytree(item, dest)
                else:
                    shutil.copy2(item, dest)
            append_log(log, "[INSTALLER] Emulator files installed to C:\\emulator")

        # Ensure cmds dir
        CMDS_DIR.mkdir(parents=True, exist_ok=True)
        append_log(log, f"[INSTALLER] Ensured commands directory: {CMDS_DIR}")

        # PATH update
        ensure_path_contains(CMDS_DIR, log)

        # Download icon
        append_log(log, "[INSTALLER] Downloading icon...")
        try:
            download_file(ICON_URL, ICON_PATH, log)
        except Exception:
            append_log(log, "[INSTALLER] WARNING: Could not download icon; file type icon may not be set.")

        # executor.bat
        write_executor_bat(log)

        # Sample file
        create_sample_file(log)

        # Registry association
        setup_file_association(log)

        append_log(log, "[INSTALLER] Installation complete.")
        messagebox.showinfo("Emulator Installer", "Installation completed successfully.\nYou may need to restart your shell for PATH changes.")
    except Exception as e:
        append_log(log, f"[INSTALLER] FATAL ERROR: {e}")
        messagebox.showerror("Emulator Installer", f"Installation failed:\n{e}")


def start_install(log):
    t = threading.Thread(target=install_emulator, args=(log,), daemon=True)
    t.start()


def main():
    root = tk.Tk()
    root.title("Emulator Installer")
    root.geometry("700x400")

    frm = ttk.Frame(root, padding=10)
    frm.pack(fill="both", expand=True)

    title = ttk.Label(frm, text="Emulator Setup Wizard", font=("Segoe UI", 16, "bold"))
    title.pack(anchor="w", pady=(0, 10))

    btn = ttk.Button(frm, text="Install Emulator", command=lambda: start_install(console))
    btn.pack(anchor="w", pady=(0, 10))

    console = scrolledtext.ScrolledText(frm, wrap="word", height=18, state="disabled", font=("Consolas", 9))
    console.pack(fill="both", expand=True)

    append_log(console, "[INSTALLER] Ready. Click 'Install Emulator' to begin.")

    root.mainloop()


if __name__ == "__main__":
    if sys.platform != "win32":
        print("This installer is intended for Windows only.")
        sys.exit(1)
    main()
