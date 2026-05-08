import os, sys, shutil, zipfile, tempfile, subprocess

PATH_FILE = r"C:\all\path.txt"

def read_pkg_path():
    with open(PATH_FILE, "r", encoding="utf-8") as f:
        raw = f.read().strip()

    # Remove wrapping quotes if present
    if raw.startswith('"') and raw.endswith('"'):
        raw = raw[1:-1]

    # Remove any stray quotes
    raw = raw.replace('"', '').replace("'", "")

    # Normalize slashes
    raw = raw.replace("\\\\", "\\").replace("/", "\\")

    return raw

def parse_opts(path):
    opts = {}
    if not os.path.exists(path):
        return opts
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line:
                k, v = line.strip().split("=", 1)
                opts[k.lower()] = v.strip()
    return opts

def inject_fullscreen(script):
    with open(script, "r", encoding="utf-8") as f:
        code = f.read()
    if "_MR_FULLSCREEN_PATCH" in code:
        return
    patch = """
# --- _MR_FULLSCREEN_PATCH BEGIN ---
try:
    import tkinter as tk
    _orig = tk.Tk
    class _MR_FullscreenTk(tk.Tk):
        def __init__(self, *a, **k):
            super().__init__(*a, **k)
            try:
                self.attributes("-fullscreen", True)
                self.attributes("-topmost", True)
            except:
                pass
    tk.Tk = _MR_FullscreenTk
except:
    pass
# --- _MR_FULLSCREEN_PATCH END ---
"""
    with open(script, "w", encoding="utf-8") as f:
        f.write(patch + "\n" + code)

def main():
    pkg = read_pkg_path()
    base = os.path.splitext(os.path.basename(pkg))[0]
    extract_dir = os.path.join(os.path.dirname(pkg), base + "_result")

    if os.path.exists(extract_dir):
        shutil.rmtree(extract_dir)
    os.makedirs(extract_dir, exist_ok=True)

    tmp_zip = os.path.join(tempfile.gettempdir(), "ospyo_temp.zip")
    shutil.copyfile(pkg, tmp_zip)

    with zipfile.ZipFile(tmp_zip, "r") as z:
        z.extractall(extract_dir)

    opts = parse_opts(os.path.join(extract_dir, "opts.txt"))
    fullscreen = opts.get("fullscreen", "no") == "yes"
    rundir = opts.get("rundir", ".")
    script = opts.get("script", "main.py")

    work_dir = os.path.join(extract_dir, rundir)
    script_path = os.path.join(work_dir, script)

    if fullscreen:
        inject_fullscreen(script_path)

    subprocess.Popen([sys.executable, script_path], cwd=work_dir)

if __name__ == "__main__":
    main()
