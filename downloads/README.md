# Voxel IRL Simulator — Official README

## Overview
This is a custom-built voxel engine featuring:
- Full day/night cycle
- Dynamic sky colors (Overworld + Hell)
- Hell dimension with ash hills and red fog
- Crafting system with a 3×3 crafting table
- Beds you can craft, place, and sleep in
- Water + pee survival system
- Humans with simple AI wandering behavior
- Chat system with commands
- Custom 3D renderer with sky color support

This README explains every block, recipe, control, mechanic, and system.

------------------------------------------------------------

# CONTROLS

Movement:
W A S D — Move
Space — Jump
Shift — Sneak / slow movement
Mouse — Look around
Scroll Wheel — Change hotbar slot

Interaction:
Left Click — Break block / attack
Right Click — Place block / interact
E — Open crafting table (when looking at one)
T — Open chat
ESC — Pause menu

------------------------------------------------------------

# CHAT SYSTEM

Press T to open chat.

Commands:
 /tp x y z — Teleport to coordinates
 /time set day — Set time to sunrise
 /time set night — Set time to midnight
 /save — Manually save the world
 /spawn — Teleport to spawn point
 /hell — Teleport to Hell dimension
 /overworld — Return to Overworld

------------------------------------------------------------

# BLOCK LIST

ID 0 — Air  
ID 1 — Grass  
ID 2 — Dirt  
ID 3 — Stone  
ID 4 — Torch  
ID 7 — Ash (found in Hell, used to craft beds)  
ID 20 — Crafting Table  
ID 30 — Bed  

------------------------------------------------------------

# CRAFTING SYSTEM

How crafting works:
1. Right-click a crafting table.
2. A 3×3 grid appears.
3. Drag items from your hotbar into the grid.
4. If the recipe is valid, a result appears.
5. Drag the result into your inventory.

------------------------------------------------------------

# BED RECIPE

Ingredients:
3 or more Ash blocks (ID 7)

Recipe Logic:
If the crafting grid contains 3+ Ash blocks, the output is:
Bed (Block ID 30)

Bed Appearance:
Color: Warm beige (RGB 200,180,140)
Shape: Cube block
Placed like any other block.

------------------------------------------------------------

# SLEEPING SYSTEM

How to sleep:
1. Place a bed.
2. Right-click the bed.

What happens when you sleep:
- Camera tilts downward (lying down animation)
- Screen darkens slightly
- All water is converted into pee
- Water meter resets to 0
- Pee meter increases
- Time jumps to sunrise
- Chat message: "<System> You wake up feeling... relieved."

Why sleep matters:
- Skips night
- Resets hydration cycle
- Sets spawn point (optional)

------------------------------------------------------------

# DAY / NIGHT CYCLE

Cycle Length:
24000 ticks total
60 ticks per second
6 minutes 40 seconds per full day

Phases:
0 — Sunrise
6000 — Noon
12000 — Sunset
18000 — Midnight
24000 → 0 — Sunrise again

Sky Colors:
Sunrise — Orange
Day — Blue
Sunset — Red/orange
Night — Dark blue
Hell — Permanent red fog

------------------------------------------------------------

# HELL DIMENSION

Features:
- Red sky and fog
- Ash hills
- Ash block (ID 7)
- No day/night cycle
- Procedural terrain

Travel:
Use /hell and /overworld commands.

------------------------------------------------------------

# HUMANS (NPCs)

Behavior:
- Wander around
- Avoid Hell unless forced
- Saved/loaded with the world
- Rendered as dynamic entities

------------------------------------------------------------

# WATER + PEE SYSTEM

Water Meter:
- Increases when drinking
- Decreases over time
- If full, pee increases faster

Pee Meter:
- Increases naturally
- Increases a lot when sleeping
- Can be drained later (bathroom block planned)

------------------------------------------------------------

# SAVING SYSTEM

Autosave:
Runs every few minutes.

Manual Save:
Use /save

Saved Data:
- Player position
- Hotbar
- Water + pee
- Time of day
- Humans
- Overworld terrain

Hell is procedural and not saved.

------------------------------------------------------------

# CRAFTING TABLE APPEARANCE

Block ID: 20  
Color: Brown wood  
Function: Opens crafting UI when right-clicked  
Used for all recipes.

------------------------------------------------------------

# BED APPEARANCE

Block ID: 30  
Color: Beige  
Shape: Cube  
Function: Right-click to sleep  
Only works in Overworld.

------------------------------------------------------------

# CONCLUSION

Your voxel engine includes:
- Survival mechanics
- Life simulation
- Crafting
- Sleeping
- Day/night cycle
- Hell dimension
- Chat commands
- NPCs
- Rendering pipeline
- Sky system

This README documents everything currently implemented.
