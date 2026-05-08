import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox
import urllib.request
import zipfile
import tempfile
import shutil
import subprocess
import winreg
import logging
import ctypes

ZIP_URL = "https://alaricholt677.github.io/extension/files/all.zip"
INSTALL_DIR = r"C:\all"
RUN_BAT = r"C:\all\run.bat"
ICON_PATH = r"C:\all\icon.ico"

EXT = ".ospyohtmlapp"
PROG_ID = "MirrorReality.ospyohtmlapp"


# ---------------------------------------------------------
# Admin Elevation
# ---------------------------------------------------------
def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False


def elevate_if_needed():
    if is_admin():
        return
    script = os.path.abspath(__file__)
    params = f"\"{script}\""
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, params, None, 1
    )
    sys.exit(0)


# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="[Wizard] %(message)s")
log = logging.getLogger("Wizard")


# ---------------------------------------------------------
# UI Installer Window
# ---------------------------------------------------------
class InstallerUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Extension Wizard Installer")
        self.root.geometry("600x400")

        ttk.Label(self.root, text="Mirror Reality Extension Wizard", font=("Segoe UI", 16)).pack(pady=10)

        self.log_box = tk.Text(self.root, height=15, width=70, state="disabled")
        self.log_box.pack(padx=10, pady=10)

        self.install_btn = ttk.Button(self.root, text="Install", command=self.install)
        self.install_btn.pack(pady=10)

    def log(self, msg):
        self.log_box.config(state="normal")
        self.log_box.insert("end", msg + "\n")
        self.log_box.config(state="disabled")
        self.log_box.see("end")
        log.info(msg)

    def install(self):
        self.install_btn.config(state="disabled")
        self.log("Starting installation...")

        try:
            ensure_tkwebview(self)
            download_and_extract_zip(self)
            setup_registry(self)
            self.log("Installation complete!")
            messagebox.showinfo("Done", "Extension Wizard installed successfully.")
        except Exception as e:
            self.log(f"ERROR: {e}")
            messagebox.showerror("Error", str(e))

    def run(self):
        self.root.mainloop()


# ---------------------------------------------------------
# tkwebview Installer
# ---------------------------------------------------------
def ensure_tkwebview(ui):
    ui.log("Checking for tkwebview...")

    try:
        import tkwebview
        ui.log("tkwebview already installed.")
        return
    except ImportError:
        ui.log("tkwebview missing. Installing...")

    subprocess.check_call([sys.executable, "-m", "pip", "install", "tkwebview"])
    ui.log("tkwebview installed.")


# ---------------------------------------------------------
# Download + Extract ZIP
# ---------------------------------------------------------
def download_and_extract_zip(ui):
    ui.log("Downloading package ZIP...")
    tmp_zip = os.path.join(tempfile.gettempdir(), "mr_all.zip")
    urllib.request.urlretrieve(ZIP_URL, tmp_zip)
    ui.log("Download complete.")

    if os.path.exists(INSTALL_DIR):
        shutil.rmtree(INSTALL_DIR)

    os.makedirs(INSTALL_DIR, exist_ok=True)

    ui.log(f"Extracting ZIP to {INSTALL_DIR}...")
    with zipfile.ZipFile(tmp_zip, "r") as zf:
        zf.extractall(INSTALL_DIR)

    ui.log("Extraction complete.")


# ---------------------------------------------------------
# Registry Setup
# ---------------------------------------------------------
def reg_set(ui, root, path, name, value):
    key = winreg.CreateKeyEx(root, path, 0, winreg.KEY_SET_VALUE)
    winreg.SetValueEx(key, name, 0, winreg.REG_SZ, value)
    winreg.CloseKey(key)
    ui.log(f"Registry: {path} -> {name} = {value}")


def setup_registry(ui):
    ui.log("Setting up registry...")

    # Associate extension
    reg_set(ui, winreg.HKEY_CLASSES_ROOT, EXT, "", PROG_ID)

    # ProgID description
    reg_set(ui, winreg.HKEY_CLASSES_ROOT, PROG_ID, "", "Mirror Reality HTML5 App")

    # Icon
    reg_set(ui, winreg.HKEY_CLASSES_ROOT, f"{PROG_ID}\\DefaultIcon", "", ICON_PATH)

    # Open command → run.bat "%1"
    cmd = f"\"{RUN_BAT}\" \"%1\""
    reg_set(ui, winreg.HKEY_CLASSES_ROOT, f"{PROG_ID}\\shell\\open\\command", "", cmd)

    # ShellNew
    reg_set(ui, winreg.HKEY_CLASSES_ROOT, f"{EXT}\\ShellNew", "NullFile", "")

    ui.log("Registry setup complete.")


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------
if __name__ == "__main__":
    elevate_if_needed()
    InstallerUI().run()
