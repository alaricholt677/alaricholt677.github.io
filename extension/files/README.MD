# How to Create Your Own .ospyohtmlapp Extension

This guide explains how to build a working .ospyohtmlapp package for the Mirror Reality Extension Platform. A .ospyohtmlapp file is simply a ZIP file renamed with a custom extension. Inside it, you include your Python script, an opts.txt file, and any assets your app needs.

---

## 1. Create a project folder

Make a new folder anywhere on your computer. Example name: MyApp

Inside this folder you will place:
- Your main Python script
- A file named opts.txt
- Any assets your app needs (images, sounds, data, etc.)

---

## 2. Create the opts.txt file

This file tells the runtime how to launch your app. It must contain three lines:

fullscreen=yes or fullscreen=no  
rundir=the folder your script runs from (usually a dot)  
script=the name of the Python file to run

Example opts.txt:

fullscreen=yes  
rundir=.  
script=main.py

Explanation of each line:
- fullscreen: yes enables fullscreen Tkinter injection
- rundir: the folder inside your package where your script lives
- script: the Python file that should be executed

---

## 3. Create your main Python script

Inside your project folder, create a Python file. The name must match the script= value in opts.txt. This script will run when the user opens your .ospyohtmlapp file. You can use Tkinter, tkwebview, or any Python modules included in the runtime.

---

## 4. Add optional assets

You can include any folders or files your app needs. Examples:

images  
sounds  
data  
config files  
HTML files  
CSS or JS files  

Your Python script can load these using normal relative paths.

---

## 5. Zip the folder

Right‑click your project folder and choose: Send to → Compressed (zipped) folder

This creates a ZIP file containing your app.

Important:  
The ZIP must contain your files at the root level.  
Do not put your project inside another folder inside the ZIP.

Correct structure inside the ZIP:
main.py  
opts.txt  
images/  
data/

Incorrect structure:
MyApp/main.py  
MyApp/opts.txt

---

## 6. Rename the ZIP file

Change the file extension from .zip to .ospyohtmlapp

Example:
MyApp.zip becomes MyApp.ospyohtmlapp

Windows will warn you about changing the extension. Choose Yes.

---

## 7. Run your extension

Double‑click your new .ospyohtmlapp file. The runtime will:

- Read the file path
- Extract your package
- Read opts.txt
- Apply fullscreen if enabled
- Run your script

If everything is set up correctly, your app will launch immediately.

---

## Summary

To create a working .ospyohtmlapp:

1. Make a folder  
2. Add main.py  
3. Add opts.txt  
4. Add assets  
5. Zip the folder  
6. Rename the ZIP to .ospyohtmlapp  
7. Double‑click to run

You now know how to create your own .ospyohtmlapp extension packages.
