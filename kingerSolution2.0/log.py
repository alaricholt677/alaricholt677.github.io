import os
import time
import sys
import random

def clear_screen():
    """Wipes the terminal for the no-background look."""
    os.system('cls' if os.name == 'nt' else 'clear')

def typewriter(text, delay=0.01):
    """Fast typewriter for terminal logs."""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def create_simulated_file(name, content):
    """Simulates the creation of assets/files in the terminal."""
    typewriter(f"CREATING ASSET: {name}...", delay=0.005)
    time.sleep(0.1)
    print(f"[OK] {name} rendered to cache.")

def render_chaos():
    """
    The 'No Background' Renderer.
    Floods the screen with Caine and Bubbles on top of everything.
    """
    width = 80
    height = 25
    assets = ["(👁️_👁️)", "( o )", "!!!WACKY!!!", "REDACTED", "0", "°", "O"]
    
    for _ in range(60):
        clear_screen()
        for r in range(height):
            line = ""
            for c in range(width // 10):
                if random.random() > 0.85:
                    line += random.choice(assets).ljust(10)
                else:
                    line += " " * 10
            print(line)
        time.sleep(0.06)

def main():
    clear_screen()
    typewriter("[SYSTEM BOOT]")
    typewriter("Initializing KingSolution 2.0...")
    typewriter("Kernel: 1.0.8-DigitalCircus")
    typewriter("Connection: SECURE / ENCRYPTED\n")
    
    typewriter("Login: kinger")
    typewriter("Password: " + "*" * 13 + " (queenie123)")
    typewriter("Access Level: ADMINISTRATOR [AUTH GRANTED]\n")

    current_dir = "~"
    
    # Strict Procedure Sequence
    procedure_steps = [
        {"cmd": "whoami", "tip": "Identify yourself: 'whoami'"},
        {"cmd": "ls /usr/ai/agent/", "tip": "Check the agents: 'ls /usr/ai/agent/'"},
        {"cmd": 'grep -r "CONSCIOUSNESS" /usr/ai/module/', "tip": "Search brainscans: 'grep -r \"CONSCIOUSNESS\" /usr/ai/module/'"},
        {"cmd": "cd /usr/ai/agent/caine", "tip": "Target the overseer: 'cd /usr/ai/agent/caine'"},
        {"cmd": "stop core", "tip": "Try to terminate: 'stop core'"},
        {"cmd": "chmod 000 /usr/ai/agent/caine/core", "tip": "Attempt lockout: 'chmod 000 /usr/ai/agent/caine/core'"},
        {"cmd": "sudo systemctl stop WACKYTIME_LOCKOUT", "tip": "Stop the lockout: 'sudo systemctl stop WACKYTIME_LOCKOUT'"},
        {"cmd": "./GreenGROUNDS --daemon --target=torment_injection", "tip": "Inject torment: './GreenGROUNDS --daemon --target=torment_injection'"},
        {"cmd": "PARAPHERNALIA --override", "tip": "Execute final override: 'PARAPHERNALIA --override'"}
    ]
    
    step_index = 0

    while step_index < len(procedure_steps):
        current_step = procedure_steps[step_index]
        
        # Display the required tip for the current step
        print(f"\n[PROCEDURE TIP] Next Step: {current_step['tip']}")
        prompt = f"kinger@circus:{current_dir}$ "
        cmd = input(prompt).strip()

        if not cmd:
            continue

        # Check if the entered command is the EXACT one required for this step
        if cmd == current_step["cmd"]:
            # Execute the logic for the specific command
            if cmd == "whoami":
                print("> kinger (UID: 001)")
            elif cmd == "ls /usr/ai/agent/":
                print("> caine/  experimental/  test_subjects/  bubble/")
            elif cmd == 'grep -r "CONSCIOUSNESS" /usr/ai/module/':
                print("> [MATCH] /usr/ai/module/brainscans/subjects.log")
                print("> [MATCH] /usr/ai/module/research/upload_protocol.exe")
            elif cmd == "cd /usr/ai/agent/caine":
                current_dir = "/usr/ai/agent/caine"
            elif cmd == "stop core":
                typewriter("> WARNING: ATTEMPTED TERMINATION OF SYSTEM OVERSEER.")
                typewriter("> SYSTEM RESPONSE: \"WHOOPS! WRONG APPROACH THERE!\"")
            elif cmd == "chmod 000 /usr/ai/agent/caine/core":
                print("> Access Denied: 57x Immersive AI Defense System active.")
            elif cmd == "sudo systemctl stop WACKYTIME_LOCKOUT":
                typewriter("> $: \"On what GROUNDS are your Authority?\"")
            elif cmd == "./GreenGROUNDS --daemon --target=torment_injection":
                create_simulated_file("torment_payload.bin", "0xDEADBEEF")
                print("INJECTING... [OK]")
                print("BYPASSING LOCKOUT... [OK]")
            elif cmd == "PARAPHERNALIA --override":
                typewriter("INITIALIZING DESTRUCTIVE WACKYTIME SEQUENCE...")
                typewriter("TARGET: CAINE_AI")
                create_simulated_file("bubble_mask.png", "...")
                create_simulated_file("caine_eye_render.obj", "...")
                
                for i in [15, 44, 89]:
                    print(f"STATUS: DELETING... {i}%...")
                    time.sleep(0.5)
                
                render_chaos()
                
                clear_screen()
                print("\n[CRITICAL ERROR]")
                print("STABILITY FAILURE. SYSTEM RETURNING TO VOID STATE.")
                print("kinger@circus:~$ logout")
                print("Connection closed by foreign host.")
                print("[SLEEP MODE ACTIVATED]")
                time.sleep(2)
                break
            
            # Move to the next step
            step_index += 1
        else:
            # If the user tries any other command, it's blocked/denied
            print(f"sh: permission denied: '{cmd}' is locked until previous procedure is cleared.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSession Terminated.")
