
# Security Policy

## Overview
The security of your personal data and the integrity of the project files hosted on alaricholt677.github.io are top. This policy outlines how the project is managed to ensure a secure experience for all users of the Voxel IRL Simulator.

## Supported Versions
Only the latest release is actively supported for security patches and feature updates. Older versions are considered end-of-life and may contain unresolved vulnerabilities.

| Version | Supported |
| :--- | :--- |
| **Latest (vCurrent)** | :white_check_mark: |
| **All Older Versions** | :x: |

## Reporting a Vulnerability
I am the sole developer of this project. If you believe you have found a security vulnerability in the game engine or the distribution files, please report it directly so I can investigate and address it.

### How to Report
To report a vulnerability, please reach out via:
- **Email:** [contact](alaricholt0@gmail.com)
- **GitHub Issues:** Open an issue in the main repository with the prefix [SECURITY] in the title.

### What to include in your report:
1. A clear description of the vulnerability.
2. Steps to reproduce the issue.
3. The impact of the vulnerability.

### What to expect
- **Acknowledgement:** I will review your report as soon as I am able.
- **Investigation:** I will investigate the vulnerability to determine its validity.
- **Resolution:** If confirmed, I will work to release a secured fixed version. You will be notified when a patch is available.

---

## Integrity and Safety of irl.zip

### Official Distribution
The official and only authorized download for the Voxel IRL Simulator is hosted at:
**https://alaricholt677.github.io/downloads/irl.zip**

### Verification
To ensure the file you downloaded has not been tampered with by third parties, you **must** verify the SHA-256 hash.

**Official SHA-256 Hash:**
48C7EC0BAAF8E43CBC45F48DCCF37718FE69CD271C609717F064ACC4FA5122E0

**How to verify on Windows (PowerShell):**
Get-FileHash path\to\your\irl.zip -Algorithm SHA256

If the hash output does not match the official hash above, **do not execute the file** and delete it immediately.

---

## Security Philosophy
- **Data Privacy:** This project does not collect, share, or sell user data. The game requires only a local player name for the internal logic. No public accounts or telemetry are used.
- **Transparency:** The project is a private hobbyist engine. By providing checksums for official releases, I am committed to maintaining the integrity of the files I can gareentee safety for so far.
