# Mirror Reality Installer Steps

This folder contains the three step images used by the main installer webpage.  
They visually guide the user through the installation process.

Place this folder at:

/steps

inside the same directory as index.html.

---

## Step Images

step1.png  
Shows the first action the user must take, such as clicking the Install button.

step2.png  
Shows the second action, such as selecting the operating system.

step3.png  
Shows the final action, such as downloading the wizard.py installer file.

---

## How the Webpage Uses These Images

The main index.html automatically loads these images from the /steps folder.  
They appear at the bottom of the page in the “Installation Steps” section.

The images must be named exactly:

step1.png  
step2.png  
step3.png

and must be placed directly inside the /steps folder.

---

## Customizing the Steps

You can replace the images with your own versions as long as:

1. The filenames stay the same  
2. The images remain in PNG format  
3. The images stay inside the /steps folder  

This allows you to redesign the visuals without changing the installer code.

---

## Folder Structure Example

index.html  
wizard.py  
/steps  
 step1.png  
 step2.png  
 step3.png

---

This README ensures anyone modifying the installer knows how the step images work and where they belong.
