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

-------------------------------------------------------------

# NEW BOSS SPAWNER RECIPE

Ingredients:
  3 Ash Blocks (ID 7)
  and a torch (ID 4) (they spawn as the new tree leaves)

OutPut:
  Boss Spawner (ID 15)

functionality:
  place the block look at it and right click on it to spawn the boss click f9 till its dead for the end credits
  
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

# WEATHER

Features:
  - if the sky is clear after 60 seconds rtheres a random chance for:
     - thunder
     - snow
     - or rain
     - sometimes still a clear sky
  to happen
  - rain makes the sky go a bit darker
  - thudnerstorm has the same sky dampening but with a random flash that will happen at a random time
  - snow turns the sky a pinkish color
  - sky modifiers apply to the hell dimensions sky like dampening or pinkish transiformatio nwill happen in either dimension, not day or night cycle tough

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

# SPAWNER APPERANCE

Block ID: 30
Color: Magenta
Shape: Cube
Function: Right-click to spawn boss
Works in any Dimension

------------------------------------------------------------

## Menus/UIs

   - Main Menu
      - Appears When The Game Window Opens
      - Has: play button, Multiplayer Button, multiplayer VIA Win12Pages, Marketplace
   - Multiplayer Menu
      - Appears when you click Multiplayer in Main Menu
      - Has: Url to World Zip field, a look for an IP Adress, join button, and back button
   - Multiplayer Win12Pages
      - Appears when you click Multiplayer VIA Win12Pages
      - HAs: a url field and join and cancel
   - Marketplace
     - Appears When You Click MArketplace
     - Just A tip its all free you'll see what it has.
   - Play Menu
     - Appears When You Click Play In Main Menu
     - Has:
        - Top Bar:
          - Text: Saved Levels
          - A Search Level Box
        - Middle Row
          - A List Of Exsisting Levels
        - Bottom Controlls
          - Create New Level BUtton
            - Enter NAme and Options to then be met wiht yoru world
          - Play Level
            - Play Selected Level
          - Edit Level
            - LEts You Edit Level Options
          - Rename
            - LEts You Rename A LEvel
          - Delete
            - Lets You Delete Levels
          - Back
            - Lets You HEAD Back To MAin MEnu
     - Pause Menu
       - Click esc on your keyboard while playing to find out about it
----------------------------------------------------------
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
- Game Like Menus
- A Full Realistic Weather System
- And A Boss To Defeat

This README documents everything currently implemented.
