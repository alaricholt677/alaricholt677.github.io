Trusten OS ISO Builder
Overview

Trusten OS ISO Builder is a Windows application that compiles the supplied C++ desktop source, creates a customizable Windows PE working image, stages the compiled programs and supporting files, and produces a bootable ISO.

The builder automates the project-specific work, but it relies on several development and deployment tools that must be installed on the computer first.

The builder does not replace:

Windows Assessment and Deployment Kit
Windows PE add-on for the ADK
A compatible C++ compiler
Python, when the source version of the builder is used
Tkinter, when the source version of the builder is used

The instructions below explain what each dependency does, exactly what needs to be selected during installation, and how to verify that the builder can detect it.

1. Supported host computer

Use a physical or virtual computer running a supported 64-bit edition of Windows.

Recommended environment:

64-bit Windows 10 or Windows 11
An account with administrator access
At least 15 GB of available storage for the ADK, WinPE working files, compiler, runtime components, temporary files, and generated ISO
A normal local NTFS folder for the builder
A stable internet connection for downloading dependencies
Hardware virtualization if the generated ISO will be tested in a virtual machine

The current project is configured for:

Plain Text
Architecture: amd64
Output format: Bootable ISO
Source language: C++17
Builder language: Python 3
User interface: Tkinter

The builder should be run as administrator because mounting and servicing Windows images with DISM can require elevated permissions. Microsoft’s WinPE instructions specifically direct users to start the Deployment and Imaging Tools Environment as an administrator before creating WinPE working files.

2. Required dependencies
Required for every build

The following components are required:

Windows ADK with Deployment Tools
Windows PE add-on for the matching ADK
A compatible C++ compiler
The project’s C++ source
Administrator permissions
Sufficient free disk space
Required when running the Python source version

The following are also required when running the .py builder directly:

Python 3
Tkinter
Python’s standard-library modules

The builder mainly uses standard Python modules such as:

Plain Text
ctypes
json
os
pathlib
re
shutil
stat
subprocess
sys
tarfile
threading
time
tkinter
urllib
zipfile

Because these are standard-library modules, a separate pip install step should normally not be necessary. However, Tkinter needs to be present in the Python installation.

Optional components

Depending on the build configuration, the project may also use:

Chromium Embedded Framework
WebView2 files
FFmpeg
Additional DLLs
Custom fonts
Images and web assets
Extra WinPE optional components
Network, storage, graphics, camera, or audio drivers

Optional components should be treated separately from the minimum toolchain. A missing optional component should not be reported as “ADK missing.”

3. Understanding the Windows ADK and WinPE add-on

This is the most important dependency distinction.

The ADK and WinPE add-on are not the same installer

Modern Windows ADK releases provide the deployment utilities, but Windows PE is distributed as a separate add-on. Microsoft instructs users to:

Install the Windows ADK.
Select at least Deployment Tools.
Install the separate Windows PE add-on afterward.

Installing only the ADK is not sufficient.

Installing only the WinPE add-on is also not the intended complete setup.

For this builder, both installations are required:

Plain Text
Windows ADK
└── Deployment Tools
 
Windows PE add-on
└── Windows Preinstallation Environment files
What the ADK contributes

The Deployment Tools feature provides deployment and imaging utilities used to prepare and service Windows images.

For this project, important ADK-related commands include:

Plain Text
dism.exe
oscdimg.exe
copype.cmd
MakeWinPEMedia.cmd

The exact locations of these files can vary based on the ADK release and installation folder.

What the WinPE add-on contributes

The Windows PE add-on supplies the base Windows PE images and supporting boot files needed to create a working WinPE environment.

The builder needs this content to create:

Plain Text
work\
├── fwfiles\
├── media\
│ ├── Boot\
│ ├── EFI\
│ └── Sources\
│ └── boot.wim
└── mount\

Microsoft documents that copype creates a working directory with media and mount directories, and copies the base WinPE image into Media\Sources as boot.wim.

4. Choosing the correct ADK version
Keep the ADK and WinPE add-on matched

Install the Windows ADK and WinPE add-on from the same Microsoft release set.

Do not intentionally combine:

Plain Text
ADK from one release
+
WinPE add-on from an unrelated release

A mismatched installation can cause confusing behavior, including:

copype.cmd existing but failing to find WinPE source files
Missing architecture folders
Missing boot files
DISM servicing failures
ISO creation failures
The builder detecting the ADK but reporting that WinPE is unavailable

The Microsoft ADK download page supplies the ADK and the corresponding WinPE add-on as separate downloads. It states that WinPE is a separate download that should be installed after the ADK.

Architecture

This builder is configured for:

Plain Text
amd64

Microsoft describes the amd64 WinPE architecture as supporting 64-bit BIOS-based and 64-bit UEFI-based computers.

Do not choose x86 for this project unless the builder and application source have been specifically modified and tested for 32-bit output.

Microsoft notes that 32-bit WinPE is no longer included starting with the Windows 11 version 22H2 WinPE add-ons.

5. Downloading the ADK correctly

Use Microsoft’s official ADK download page.

The required downloads are:

Windows ADK installer
Windows PE add-on installer for that ADK

Do not mistake “Windows PE add-on” for an optional checkbox inside a current ADK installer. For modern ADK releases, it is a separate installer.

When publishing the builder, direct users to:

Download and install the Windows ADK
Download Windows PE

The README should avoid permanently embedding a guessed version-specific installer URL. Microsoft can replace or service ADK releases, so users should select the matching ADK and WinPE add-on from the official download page.

6. Installing the Windows ADK
Step 1: Start the installer

Run the Windows ADK installer.

If Windows asks whether the installer may make changes to the computer, approve the elevation prompt.

Step 2: Choose an installation location

The default installation location is recommended.

A typical installation will place Windows Kit files under a directory similar to:

Plain Text
C:\Program Files (x86)\Windows Kits\10\

The builder searches the common Windows Kits locations, including:

Plain Text
C:\Program Files (x86)\Windows Kits\10
C:\Program Files (x86)\Windows Kits\11

Using a custom location may still work if the tools are in PATH or the builder supports manual path selection, but the default installation location gives the best chance of automatic detection.

Step 3: Select features

On the feature-selection screen, select:

Plain Text
Deployment Tools

For the builder’s basic operation, this is the important ADK selection.

You do not need to install every assessment, compatibility, and performance feature merely to create the WinPE ISO. Microsoft’s WinPE instructions say to choose, at minimum, the Deployment Tools feature.

The feature list may contain additional entries. Those entries can be installed if the user needs them for other work, but they should not be presented as mandatory for this builder unless the code directly uses them.

Step 4: Finish the installation

Wait for the Windows ADK installation to complete.

Do not start the builder yet. The WinPE add-on must still be installed.

7. Installing the Windows PE add-on
Step 1: Confirm that the ADK installation finished

The ADK should be installed before adding WinPE.

The intended installation order is:

Plain Text
1. Windows ADK with Deployment Tools
2. Windows PE add-on for that ADK
3. C++ compiler
4. Python and Tkinter, if running the source builder
5. Builder prerequisite verification
Step 2: Start the matching WinPE add-on installer

Run the Windows PE add-on installer that belongs to the same Microsoft ADK release.

Approve the administrator elevation prompt if it appears.

Step 3: Use the normal Windows Kits destination

Unless there is a specific reason to change it, install the add-on into the same Windows Kits environment used by the ADK.

The add-on must end up in a location where the ADK tools can locate the Windows Preinstallation Environment files.

Step 4: Complete the installation

Allow the installer to finish completely.

If the WinPE add-on installation fails, do not assume the builder is broken. The builder cannot reconstruct missing Microsoft WinPE base files.

Resolve the add-on installation first, then rerun the builder’s prerequisite check.

8. Verifying the ADK installation manually

Before reporting a builder issue, verify the Microsoft tools independently.

Verification method A: Start-menu shortcut

Open the Start menu and search for:

Plain Text
Deployment and Imaging Tools Environment

Run it as administrator.

This shortcut is part of the deployment-tool workflow described in Microsoft’s WinPE instructions.

If the shortcut is missing, likely explanations include:

Deployment Tools was not selected.
The ADK installation was incomplete.
The installation used an unexpected location.
The wrong installer was used.
The Start-menu shortcut was not registered.
Verification method B: Locate copype.cmd

In the elevated Deployment and Imaging Tools Environment, run:

BAT
where copype

Expected result:

Plain Text
A path ending in copype.cmd

If Windows reports that the command cannot be found, the environment is not initialized correctly or the ADK/WinPE installation is incomplete.

Verification method C: Locate MakeWinPEMedia.cmd

Run:

BAT
where MakeWinPEMedia

Microsoft states that MakeWinPEMedia and copype are available with the Windows ADK and WinPE add-on.

Verification method D: Locate oscdimg.exe

Run:

BAT
where oscdimg

oscdimg.exe is the Microsoft image-generation utility that creates ISO files from a prepared source tree. Microsoft documents its syntax as:

Plain Text
Oscdimg [options] <sourceLocation> <destinationFile>

Verification method E: Check DISM

Run:

BAT
where dism
dism /?

The second command should display DISM command help.

Verification method F: Check the WinPE architecture files

The exact versioned directory can vary, but the installation should contain Windows Preinstallation Environment files for amd64.

Look beneath the Windows Kits installation for a structure containing terms similar to:

Plain Text
Assessment and Deployment Kit
Windows Preinstallation Environment
amd64

The builder should not rely solely on one hardcoded version number. It should search expected Windows Kits roots and validate the actual files it needs.

9. Testing copype before using the builder

This is the clearest independent test of the ADK and WinPE add-on.

Open Deployment and Imaging Tools Environment as administrator.

Choose an empty test location, for example:

BAT
copype amd64 C:\WinPE_Test

Microsoft documents the syntax as:

Plain Text
Copype.cmd <Architecture> <WorkingDirectory>

If successful, check for:

Plain Text
C:\WinPE_Test\media
C:\WinPE_Test\mount
C:\WinPE_Test\media\sources\boot.wim

Microsoft states that copype creates media and mount, and places the copied WinPE image at Media\Sources\boot.wim.

If copype fails immediately

Check:

The console was run as administrator.
The ADK was installed with Deployment Tools.
The matching WinPE add-on was installed.
C:\WinPE_Test does not contain an old mounted or partially generated image.
Security software did not block the Windows Kits commands.
The ADK and WinPE add-on are from the same release set.
If the destination already exists

Remove the old test directory before retrying:

BAT
rmdir /s /q C:\WinPE_Test
copype amd64 C:\WinPE_Test

Only use this command with a disposable test directory because /s /q removes the directory and its contents without additional confirmation.

10. Testing Microsoft’s normal ISO process

After copype succeeds, test the normal Microsoft ISO-generation path:

BAT
MakeWinPEMedia /ISO C:\WinPE_Test C:\WinPE_Test\WinPE_Test.iso

Microsoft documents /ISO as the option for creating an ISO from a WinPE working directory.

If the destination ISO already exists, use Microsoft’s force option:

BAT
MakeWinPEMedia /ISO /F C:\WinPE_Test C:\WinPE_Test\WinPE_Test.iso

Microsoft documents /F as suppressing the confirmation when overwriting an existing ISO or formatting a USB destination.

If this basic test fails before Trusten’s files are introduced, the issue is with the ADK, WinPE setup, permissions, paths, or host environment rather than the C++ shell.

11. Why this builder can use oscdimg.exe directly

The corrected builder uses oscdimg.exe directly for final ISO generation instead of relying exclusively on the MakeWinPEMedia.cmd batch wrapper.

This is intentional.

The builder still uses the WinPE working layout, but it controls the final command itself and verifies:

The staged media directory exists.
The BIOS boot image exists.
The UEFI boot image exists.
The output ISO exists after the command.
The output ISO is not empty.
The process returned a successful exit code.

The staged paths expected by this builder include:

Plain Text
<WorkingDirectory>\media
<WorkingDirectory>\fwfiles\etfsboot.com
<WorkingDirectory>\fwfiles\efisys.bin

A representative direct command generated by the builder follows this structure:

BAT
oscdimg.exe ^
-m ^
-o ^
-u2 ^
-udfver102 ^
-bootdata:2#p0,e,b"<WorkingDirectory>\fwfiles\etfsboot.com"#pEF,e,b"<WorkingDirectory>\fwfiles\efisys.bin" ^
"<WorkingDirectory>\media" ^
"<OutputDirectory>\CustomCppWinPE.tmp.iso"

Microsoft documents oscdimg as a tool for creating customized 32-bit or 64-bit WinPE ISO images, and documents support for ISO 9660, Joliet, and UDF file systems.

The exact command above is project-specific builder behavior, not a verbatim Microsoft command.

12. Installing Python

Python is required only when running the source .py version of the builder.

If using a future packaged .exe, Python may be bundled into the application package. The ADK, WinPE add-on, and C++ compiler would still remain separate requirements unless explicitly bundled under valid redistribution terms.

Recommended Python installation choices

During installation:

Install a current 64-bit Python 3 release.
Enable the option to add Python to PATH.
Include Tcl/Tk and IDLE support if the installer offers it.
Complete the installation for the intended Windows account or all users.
Restart the terminal after installation so the changed PATH is visible.
Verify Python

Open Command Prompt:

BAT
python --version

If python is redirected to the Microsoft Store or is not found, try:

BAT
py --version

The builder can be launched using:

BAT
python phonelink_release_native_cef_iso255_fixed.py

or:

BAT
py phonelink_release_native_cef_iso255_fixed.py
13. Verifying Tkinter

Run:

BAT
python -m tkinter

A small Tkinter demonstration window should open.

Alternatively:

BAT
py -m tkinter

If the command reports that tkinter cannot be imported, modify or reinstall Python and include Tcl/Tk support.

A missing Tkinter installation prevents the builder interface from opening, even if the ADK and compiler are installed correctly.

14. Installing a C++ compiler

The project compiles C++17 Windows source.

The builder searches for compilers in this order:

Plain Text
1. cl.exe
2. g++.exe

This means it can recognize:

Microsoft Visual C++ compiler, when appropriately configured
MinGW-w64 g++

For the public guide, MinGW-w64 is the simpler fully described compiler path because the project already contains MinGW library configuration.

Required MinGW capabilities

The selected installation should provide:

Plain Text
g++.exe
gcc.exe
ld.exe
ar.exe
windres.exe
libstdc++ runtime
Windows API headers
Windows import libraries

The compiler must target 64-bit Windows for the current amd64 WinPE image.

Verify g++

Open a new Command Prompt:

BAT
g++ --version
where g++

The output should identify the compiler and show the path to g++.exe.

If g++ works in one terminal but not in the builder, close and reopen the builder so it inherits the updated environment.

Confirm 64-bit target

Run:

BAT
g++ -dumpmachine

The target should indicate a 64-bit Windows toolchain. A common 64-bit target name contains:

Plain Text
x86_64

Avoid using a compiler target that begins with only:

Plain Text
i686

for the current amd64 project.

15. Required MinGW libraries

The builder’s default MinGW library list includes:

Plain Text
-ld2d1
-ldwrite
-ldwmapi
-lpdh
-lpsapi
-lshell32
-lole32
-luuid
-lurlmon
-lgdi32
-luser32

The current main.cpp also uses Windows functionality associated with additional libraries, including WinHTTP, cryptography, common dialogs, multimedia, and shell functionality. The actual link list used by the release should therefore remain synchronized with the source.

A complete project-specific link configuration may include:

Plain Text
-luser32
-lgdi32
-ladvapi32
-lkernel32
-lole32
-luuid
-lwinhttp
-lcrypt32
-lcomdlg32
-lshlwapi
-lshell32
-lurlmon
-lvfw32
-lwinmm

If CEF is enabled, the CEF headers, import library arrangement, runtime DLLs, resources, and locales must also match the selected CEF build.

Do not assume that successfully finding g++.exe means every required Windows library is present. The builder should run a small compiler test or compile the actual project before declaring the compiler fully operational.

16. Suggested project directory layout

Extract the builder into a normal writable directory.

Example:

Plain Text
D:\Downloads\Trusten-OS-Builder\
├── builder.py
├── WinPE_CPP_Builder\
│ ├── src\
│ │ └── main.cpp
│ ├── iso_fs_overlay\
│ ├── startnet.cmd
│ ├── compiler_libraries.txt
│ ├── cef\
│ ├── webview2\
│ ├── web\
│ ├── work\
│ ├── out\
│ ├── logs\
│ ├── build_temp\
│ ├── adk_temp\
│ └── dism_scratch\
└── README.md

Avoid starting with folders that are:

Read-only
Inside a ZIP archive
On an unreliable network share
Controlled by another application
Synchronized while large build files are changing
Protected by restrictive permissions

The builder should create the generated working directories automatically.

17. Builder prerequisite-check screen

Before enabling Build ISO, the application should perform a complete readiness check.

Recommended display:

Plain Text
TRUSTEN OS BUILD ENVIRONMENT
 
Host operating system
[PASS] Windows detected
[PASS] 64-bit environment detected
[PASS] Administrator access detected
 
Python interface
[PASS] Python 3 detected
[PASS] Tkinter detected
 
Windows deployment tools
[PASS] Windows ADK detected
[PASS] Deployment Tools detected
[PASS] DISM detected
[PASS] Oscdimg detected
[PASS] CopyPE detected
[PASS] MakeWinPEMedia detected
 
Windows PE
[PASS] WinPE add-on detected
[PASS] amd64 WinPE source detected
[PASS] Base WinPE WIM detected
[PASS] BIOS boot files detected
[PASS] UEFI boot files detected
 
C++ toolchain
[PASS] MinGW-w64 detected
[PASS] g++.exe detected
[PASS] 64-bit compiler target detected
[PASS] Required import libraries detected
 
Project
[PASS] main.cpp detected
[PASS] startnet.cmd detected
[PASS] startnet.cmd contains wpeinit
[PASS] startnet.cmd contains the executable placeholder
[PASS] ISO overlay directory detected
 
Optional features
[WARN] CEF not installed
[WARN] FFmpeg not installed
[WARN] WebView2 runtime not staged
 
Status: Ready to build

A failed check should identify:

What is missing
Whether it is required
Every location searched
The expected filename
How to repair the installation
A Recheck option

Example:

Plain Text
[FAIL] Windows PE add-on not detected
 
The Windows ADK deployment utilities were found, but the amd64
Windows PE source files were not found.
 
Install the Windows PE add-on that matches your installed ADK.
Installing Deployment Tools alone does not install the WinPE image.
 
Locations searched:
C:\Program Files (x86)\Windows Kits\10\
C:\Program Files (x86)\Windows Kits\11\
18. First build procedure
Step 1: Restart Windows if required

If the ADK, Python, or compiler installer asked for a restart, restart before the first build.

Step 2: Open the builder as administrator

Right-select the builder and choose:

Plain Text
Run as administrator

If running the source version, open an elevated terminal and run:

BAT
cd /d D:\Downloads\Trusten-OS-Builder
py phonelink_release_native_cef_iso255_fixed.py
Step 3: Run the prerequisite check

Do not start a full build until every required component passes.

Warnings for optional functionality may remain if those features are intentionally disabled.

Step 4: Select the project source

Verify that the builder points to:

Plain Text
WinPE_CPP_Builder\src\main.cpp
Step 5: Verify the architecture

Use:

Plain Text
amd64
Step 6: Build

The builder should:

Validate its dependencies.
Compile the C++ source.
Create or refresh the WinPE working files.
Mount boot.wim.
Copy the compiled executable and required runtime files.
Apply the boot script.
Add the ISO overlay.
Commit and unmount the image.
Stage any files that belong outside boot.wim.
Generate the ISO.
Verify that the ISO exists and is non-empty.
Rename the temporary ISO to the final filename.

Expected output:

Plain Text
WinPE_CPP_Builder\out\CustomCppWinPE.iso
19. Testing the generated ISO

Test the ISO in a virtual machine before using physical hardware.

Test both applicable firmware modes:

Plain Text
Legacy BIOS
UEFI

Verify:

The virtual machine reaches the WinPE boot environment.
The application starts.
The application remains open.
Keyboard and mouse input work.
Storage is visible.
The shell locates its runtime files.
Restart and shutdown work.
Networking initializes if required.
Optional CEF, media, and AI features behave according to the files included.
Logs are created in the expected locations.

The fact that ISO generation completed does not by itself prove that every staged application or runtime component will work inside WinPE.

20. ADK-specific troubleshooting
Error: ADK not found

Possible causes:

Windows ADK was not installed.
Deployment Tools was not selected.
The ADK was installed in a custom directory.
The application was opened before the installer updated the environment.
Only the WinPE add-on was installed.
Tool-discovery logic is searching an outdated path.

Check:

BAT
where dism
where oscdimg
where copype
where MakeWinPEMedia

Then run the builder’s Recheck operation.

Error: WinPE add-on not found

This usually means the ADK is present, but the Windows PE files are absent.

Install the matching Windows PE add-on. Microsoft explicitly requires both the ADK with Deployment Tools and the Windows PE add-on for WinPE media creation.

Error: copype is not recognized

Open the Deployment and Imaging Tools Environment as administrator.

If copype still cannot be located:

Repair the ADK installation.
Confirm Deployment Tools is installed.
Repair or reinstall the matching WinPE add-on.
Check the Windows Kits installation folder.
Error: copype cannot find WinPE files

Likely causes:

WinPE add-on was not installed.
ADK and add-on versions do not match.
The installation is incomplete.
The amd64 source directory is missing.
Custom environment variables point to an old installation.

Test independently:

BAT
copype amd64 C:\WinPE_Test
Error: MakeWinPEMedia returns 255

In this builder, the final ISO stage has been changed to invoke oscdimg.exe directly.

The builder should report:

The complete command invoked
The exit code
Captured standard output
The source media directory
The BIOS boot-file path
The UEFI boot-file path
The destination ISO path

If exit code 255 came from MakeWinPEMedia.cmd, verify whether the working directory is valid and then use the fixed builder that bypasses that wrapper for final ISO generation.

Error: etfsboot.com missing

The builder cannot create the expected BIOS-bootable image without the BIOS boot image.

Recommended response:

Plain Text
The WinPE working directory is incomplete.
Recreate the directory with copype amd64.
Error: efisys.bin missing

The builder cannot create the expected UEFI boot entry.

Recommended response:

Plain Text
The WinPE working directory does not contain the expected UEFI boot image.
Repair the WinPE add-on and recreate the work directory.
Error: boot.wim missing

Expected path:

Plain Text
<WorkingDirectory>\media\sources\boot.wim

Because Microsoft documents that copype creates this working image, absence of boot.wim indicates that copype did not finish correctly or the working directory was altered afterward.

Error: DISM reports that the image is already mounted

Do not repeatedly start new builds.

First inspect mounted images:

BAT
dism /Get-MountedWimInfo

If a previous failed build left a mount behind, use a carefully selected recovery action. Do not discard a mount unless you understand that any uncommitted image changes will be lost.

The builder should attempt cleanup and write details to:

Plain Text
WinPE_CPP_Builder\logs\
Error: Access denied

Confirm:

The builder is elevated.
The project directory is writable.
The ISO is not open in another application.
The mount directory is not being scanned or locked.
The output ISO is not mounted.
Security software has not quarantined the generated executable.
The build is not running from a read-only archive.
Error: ISO exists but does not boot

Check:

BIOS and UEFI boot files were both supplied to oscdimg.
media\sources\boot.wim exists.
The ISO is attached as bootable media in the VM.
The VM firmware mode matches a boot entry included in the ISO.
Secure Boot requirements are understood for the selected ADK boot files.
The source files were not copied over the WinPE boot structure incorrectly.

Microsoft documents an optional /bootex switch for MakeWinPEMedia in ADK releases that support boot files signed with the Windows UEFI CA 2023 certificate. The current direct-oscdimg builder should document separately which boot files it stages and should not claim /bootex behavior unless it explicitly implements the equivalent selection.

21. Information users should include in bug reports

Ask users to include:

Plain Text
Windows version:
Windows architecture:
ADK version:
WinPE add-on version:
Python version:
Tkinter test result:
Compiler name:
Compiler version:
Compiler target:
Builder version:
Project location:
Administrator mode used:
Build stage that failed:
Exact exit code:
Full error message:
Relevant log files:
BIOS or UEFI test mode:
Virtual-machine software:

Useful commands:

BAT
winver
python --version
py --version
g++ --version
g++ -dumpmachine
where python
where g++
where dism
where oscdimg
where copype
where MakeWinPEMedia
dism /Get-MountedWimInfo

Users should remove API keys, passwords, tokens, PINs, personal filenames, and other sensitive information before posting logs publicly.

22. Short release-page prerequisite notice

Use this near the download button:

Important: Trusten OS ISO Builder is a developer tool, not a zero-dependency installer. Before building an ISO, install the Windows ADK with Deployment Tools, then install the matching Windows PE add-on. If running the source version, also install 64-bit Python 3 with Tkinter. A supported 64-bit C++ compiler, such as MinGW-w64 g++, is required to compile the included C++ shell. Run the builder as administrator and test generated images in a virtual machine before using physical hardware.

23. Recommended installer behavior

A packaged builder should not silently report “ADK missing” for every Microsoft-tool failure.

Use separate statuses:

Plain Text
ADK_NOT_INSTALLED
DEPLOYMENT_TOOLS_MISSING
WINPE_ADDON_MISSING
WINPE_AMD64_MISSING
DISM_MISSING
OSCDIMG_MISSING
COPYPE_MISSING
BOOT_WIM_MISSING
BIOS_BOOT_FILE_MISSING
UEFI_BOOT_FILE_MISSING
COMPILER_MISSING
COMPILER_WRONG_ARCHITECTURE
TKINTER_MISSING
ADMIN_REQUIRED

This distinction is important because “ADK installed” does not necessarily mean:

Deployment Tools was selected.
The WinPE add-on was installed.
The add-on matches the ADK.
The amd64 files exist.
The installation is healthy.
The builder has permission to invoke the tools.
