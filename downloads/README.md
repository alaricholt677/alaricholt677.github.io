# Voxel IRL Simulator — Official README

## Overview

Voxel IRL Simulator is a custom-built Java voxel survival and life-simulation engine.

The game includes:

- Custom 3D voxel renderer
- Startup cinematic with 3D blocks forming ALARICHOLT677
- Special randomized window title splash text
- Live voxel-style menus
- Main menu, play menu, options menu, multiplayer menu, marketplace, and Win12 Pages multiplayer menu
- Full day/night cycle
- Dynamic sky colors
- Weather system with clear skies, rain, snow, and thunder
- Overworld dimension
- Hell dimension
- Procedural terrain
- Chunk-based world rendering
- Crafting table with 3x3 crafting
- Pause menu with 2x2 crafting
- Beds you can craft, place, and sleep in
- Water and pee survival meters
- Humans/NPCs
- Holographic human summon system
- Follower system
- Boss spawner and boss fight support
- Chat system with commands
- Saving and loading
- LAN hosting
- LAN hosted-world downloading
- Marketplace content installer

This README documents the current implemented game systems, menus, controls, blocks, recipes, dimensions, survival mechanics, multiplayer systems, and UI features.

------------------------------------------------------------

# Startup Experience

When the game launches, it starts with a special cinematic.

## Startup Cinematic

The startup cinematic shows 3D voxel blocks flying into place to form:

ALARICHOLT677

After the text forms, the cinematic transitions into a 3D voxel mountain scene.

The camera moves outward from a mountain tunnel and fades into the main menu.

The cinematic can be skipped by clicking or pressing a key if the current build has skip input enabled.

## Main Menu Background

The main menu can use the same 3D mountain-style visual theme from the startup cinematic.

This gives the menus a game-world feel instead of a flat black background.

------------------------------------------------------------

# Window Title System

The game window title uses a special format.

Window title format:

IRL SIMULATOR 3D - player name | random splash saying

The player name comes from the startup argument:

--Name

The version shown in the menu comes from:

--version

The game also includes a title splash system with many random sayings.

Examples include:

- Now with 3D!
- Powered by Java!
- Grox Mode Enabled!
- Hydrate or Diedrate!
- Your GPU is crying.
- Welcome back, explorer!
- Reality is buffering.
- Your chunks have unionized.

The title system helps make every game startup feel different.

------------------------------------------------------------

# Startup Arguments

The game launcher expects startup arguments.

Expected arguments:

--PathToClasses path
--Name playerName
--skinDir directory
--version number

These are used for:

- Class path setup
- Player name
- Skin directory
- Version display
- Boot sequence setup

------------------------------------------------------------

# Controls

## Movement

W — Move forward  
A — Move left  
S — Move backward  
D — Move right  
Mouse drag — Look around  
Number keys 1 through 9 — Select hotbar slot  

## Gameplay Controls

B — Break selected block  
P — Place selected hotbar block  
Right Click — Interact, drink, open crafting, sleep, or spawn boss  
T — Open chat  
ESC — Open pause menu or close crafting  
F5 — Save current level  
F6 — Toggle follower  
F7 — Switch dimension  

## Notes

The selected block is highlighted when the player is looking at a block.

Breaking a block places that block into the selected hotbar slot.

Placing uses the block currently stored in the selected hotbar slot.

Right-click behavior depends on what the player is holding or looking at.

------------------------------------------------------------

# Main Menu

The main menu appears after the startup cinematic.

## Main Menu Buttons

- Play
- Multiplayer
- Marketplace
- Multiplayer via Win12 Pages

## Main Menu Features

The main menu includes:

- Game title
- ALARICHOLT677 edition branding
- Version display
- Menu buttons
- Background visual styling

The main menu can use a mountain-style voxel background.

------------------------------------------------------------

# Play Menu

Clicking Play opens the saved-level menu.

## Play Menu Contents

The play menu includes:

- Saved levels title
- Search level box
- List of existing levels
- Create new level button
- Play selected level button
- Edit level button
- Rename button
- Delete button
- Back button

## Create New Level

To create a level:

1. Click Create new level.
2. Enter a save name.
3. Choose level options.
4. Confirm.
5. The level loads.

## Play Level

The Play level button loads the selected saved level.

## Edit Level

The Edit level button opens the options menu for the selected level.

## Rename

The Rename button changes the selected level folder/name.

## Delete

The Delete button removes the selected level after confirmation.

------------------------------------------------------------

# Options Menu

The options menu controls level settings.

## Options

- Occlusion culling
- Chunk streaming
- Chunk meshing experimental toggle
- Render distance in chunks

## Confirm

Confirm saves the selected options and loads the level.

## Cancel

Cancel returns to the level menu.

------------------------------------------------------------

# Multiplayer Menu

The multiplayer menu contains:

- Server IP field
- World URL field
- Join server button
- LAN worlds list
- Manual LAN/URL entry field
- Add button
- Refresh LAN button
- Join selected button
- Back button

## Server IP Field

Used to enter an IP address and port for direct multiplayer joining.

Example:

127.0.0.1:25565

## World URL Field

Used by the direct multiplayer world ZIP flow.

Example:

https://example.com/world.zip

## LAN Worlds List

The LAN list shows detected LAN worlds on the local network.

## Manual LAN Entry

You can manually add:

- A URL
- A host:port LAN address

Examples:

192.168.1.20:25565  
https://example.com/world.zip

------------------------------------------------------------

# LAN Multiplayer

LAN multiplayer supports hosting a world and allowing clients to join.

## Hosting a LAN World

LAN hosting is started from the pause menu.

The host chooses:

- World folder inside configs
- Port number

Example:

World folder: MyWorld  
Port: 25565  

This hosts:

configs/MyWorld

## LAN Server Behavior

When the LAN server starts, it:

- Opens a server socket
- Waits for clients
- Assigns each client a player ID
- Sends player join events
- Sends player leave events
- Receives player state updates
- Broadcasts remote player positions
- Sends the hosted world ZIP if a hosted world folder is set

## Hosted World Upload

The host sends the selected world folder as a ZIP packet.

The hosted folder may include:

- blockdata
- blocks.dat
- playerpos
- playerpos.dat
- humanalive
- entitiesAlive.dat
- level options
- saved terrain data
- saved player data
- saved human/entity data

The hosted world is sent from:

configs/worldName

## Client World Download

When a client joins, the client downloads the hosted world.

The downloaded world extracts to:

client_world

The client can then load:

client_world

This removes the need for the client to manually pick a local world folder when the auto-download join flow is enabled.

## LAN Client Callback

The LAN client has a world-download callback.

When the world ZIP finishes downloading and extracting, the client calls the menu system so it can load the downloaded world.

The intended flow is:

1. Select LAN world.
2. Enter player name.
3. Connect to host.
4. Host sends world ZIP.
5. Client extracts world into client_world.
6. MenuManager loads client_world.
7. Game begins.

## LAN Player Sync

LAN sends player state data.

Player state includes:

- Player ID
- X position
- Y position
- Z position
- Yaw
- Pitch

Remote player hooks allow the engine to:

- Spawn remote players
- Update remote player positions
- Remove remote players when they disconnect

------------------------------------------------------------

# Marketplace

The marketplace is available from the main menu.

## Marketplace Features

- Item grid
- Item detail screen
- Item title
- Item description
- Item icon
- Download and install button
- Back to main menu button

## Marketplace Downloads

Downloaded marketplace ZIP files install into:

configs

The marketplace is intended for free add-ons, worlds, or content packs.

------------------------------------------------------------

# Multiplayer via Win12 Pages

The Multiplayer via Win12 Pages button opens a separate multiplayer interface.

This menu is separate from the normal LAN multiplayer menu.

It is intended for URL-style or Win12 Pages based multiplayer joining.

------------------------------------------------------------

# Pause Menu

Press ESC while playing to open the pause menu.

## Pause Menu Features

The pause menu includes:

- Dark overlay
- Pause Menu title
- Hotbar display
- 2x2 crafting grid
- Crafting output slot
- Quit Game button
- Summon House Human button
- Host LAN World button
- Stop LAN Server button
- LAN hosting status display

## Hotbar Display

The pause menu displays the current hotbar.

Each slot shows the block ID stored in that slot.

If the player is dragging an item, the menu can show the held item.

## 2x2 Pause Crafting

The pause menu includes a smaller 2x2 crafting grid.

This uses the engine’s 2x2 crafting logic.

The player can move items between:

- Hotbar
- 2x2 pause crafting grid
- Output slot

## Quit Game

The Quit Game button returns the player to the main menu.

## Summon House Human

The Summon House Human button creates a holographic copy of a random human NPC.

The hologram can follow the cursor while the pause menu is open.

## Host LAN World

The Host LAN World button starts a LAN server.

The player enters:

- World folder name inside configs
- Port number

Example:

World folder: MyWorld  
Port: 25565  

The game hosts:

configs/MyWorld

## Stop LAN Server

If a LAN server is already running, the Host LAN World button becomes Stop LAN Server.

Clicking it stops the current LAN server.

## LAN Status

The pause menu displays LAN hosting status.

Example when hosting:

LAN hosting: MyWorld on port 25565

Example when not hosting:

LAN hosting: off

------------------------------------------------------------

# Chat System

Press T to open chat.

Press ENTER to send a message.

Press ESC to close chat.

## Chat Commands

/help  
/pos  
/tp x y z  
/give id  
/dim  
/dimension  
/follower  
/save  
/craft  
/break  
/place  
/weather clear  
/weather rain  
/weather snow  
/weather thunder  
/weather random  

## /help

Shows available commands.

## /pos

Displays the player’s current position.

## /tp x y z

Teleports the player to coordinates.

Example:

/tp 10 5 10

## /give id

Gives the selected hotbar slot a block ID.

Example:

/give 7

## /dim

Switches dimension.

## /dimension

Also switches dimension.

## /follower

Toggles the follower.

## /save

Manually saves the current level.

## /craft

Opens crafting.

## /break

Breaks the selected block.

## /place

Places the selected hotbar block.

## /weather

Changes the weather.

Examples:

/weather clear  
/weather rain  
/weather snow  
/weather thunder  
/weather random  

------------------------------------------------------------

# Block List

ID 0 — Air  
ID 1 — Grass  
ID 2 — Dirt  
ID 3 — Stone  
ID 4 — Torch  
ID 5 — Hellstone  
ID 6 — Bloodrock  
ID 7 — Ash  
ID 8 — Fire  
ID 15 — Boss Spawner  
ID 20 — Crafting Table  
ID 21 — Crafted Block 1  
ID 22 — Crafted Block 2  
ID 24 — Crafted Block 4  
ID 30 — Bed  
ID 36 — Crafted Block 3  
ID 42 — Pee Block  

------------------------------------------------------------

# Block Appearance and Function

## Air

ID: 0  
Function: Empty space  

## Grass

ID: 1  
Color: Green  
Function: Surface terrain and leaf substitute  

## Dirt

ID: 2  
Color: Brown  
Function: Terrain layer and simple trunk material in some generation  
Special: Can be used by the water/pee interaction system in current gameplay logic  

## Stone

ID: 3  
Color: Gray  
Function: Underground terrain, structures, and platforms  

## Torch

ID: 4  
Color: Yellow/orange  
Function: Light source and crafting ingredient  
Emission: High light output  

## Hellstone

ID: 5  
Color: Dark red  
Function: Hell terrain  

## Bloodrock

ID: 6  
Color: Red  
Function: Hell terrain and roof material  

## Ash

ID: 7  
Color: Dark gray  
Function: Hell terrain and crafting ingredient  

## Fire

ID: 8  
Color: Orange/red  
Function: Hell fire visual and light source  
Emission: Bright light  

## Boss Spawner

ID: 15  
Color: Magenta  
Function: Right-click to spawn boss  
Works in: Any dimension  

## Crafting Table

ID: 20  
Color: Brown wood  
Function: Opens 3x3 crafting UI  

## Bed

ID: 30  
Color: Warm beige  
Function: Right-click to sleep  

## Pee Block

ID: 42  
Color: Yellow  
Function: Spawned by pee overflow system  

------------------------------------------------------------

# Crafting System

The game has two crafting systems:

- 3x3 crafting table crafting
- 2x2 pause menu crafting

------------------------------------------------------------

# 3x3 Crafting Table

## How to Use

1. Place or find a crafting table.
2. Right-click the crafting table.
3. A 3x3 crafting grid appears.
4. Drag items from the hotbar into the grid.
5. If the recipe is valid, an output appears.
6. Take the output item.

------------------------------------------------------------

# 2x2 Pause Crafting

The pause menu includes a quick 2x2 crafting grid.

This system is useful for small recipes and pause-menu recipe logic.

------------------------------------------------------------

# Bed Recipe

## Ingredients

3 or more Ash blocks

## Output

Bed  
Block ID: 30  

## Recipe Logic

If the crafting grid contains at least 3 Ash blocks, and the boss spawner torch requirement is not met, the output becomes a bed.

## Bed Appearance

Color: Warm beige  
Shape: Cube block  
Function: Sleep interaction  

------------------------------------------------------------

# Boss Spawner Recipe

## Ingredients

3 or more Ash blocks  
1 or more Torch blocks  

## Output

Boss Spawner  
Block ID: 15  

## Functionality

1. Craft the boss spawner.
2. Place the boss spawner.
3. Look at the boss spawner.
4. Right-click it.
5. A boss spawns.

The boss spawner works in any dimension.

------------------------------------------------------------

# Sleeping System

## How to Sleep

1. Craft or find a bed.
2. Place the bed.
3. Right-click the bed.

## Sleep Effects

When sleeping:

- Camera tilts downward
- Sleep animation plays
- Water meter is converted into pee
- Water resets to 0
- Pee meter increases
- Time jumps toward morning
- A wake-up message appears in chat

Wake-up message:

<System> You wake up feeling... relieved.

## Why Sleep Matters

Sleeping can:

- Skip night
- Change survival meters
- Advance the day/night cycle
- Reset the player into morning gameplay

------------------------------------------------------------

# Day and Night Cycle

The Overworld has a day/night cycle.

## Time Values

0 — Sunrise or morning  
6000 — Day or noon-like time  
12000 — Sunset  
18000 — Night or midnight-like time  
24000 — Wraps back to 0  

## Sky Colors

Sunrise — Orange  
Day — Blue  
Sunset — Red/orange  
Night — Dark blue  
Hell — Red sky  

Hell has its own red sky behavior and does not use the normal Overworld day/night sky cycle.

------------------------------------------------------------

# Weather System

The weather system changes over time and can also be controlled through chat commands.

## Weather Types

Clear  
Rain  
Snow  
Thunder  

## Clear Weather

Clear weather has normal sky color and no weather particles.

## Rain

Rain adds rain visual effects and darkens the sky.

## Snow

Snow adds snow visual effects and changes the sky tint.

## Thunder

Thunder adds rain, darkens the sky, and causes random lightning flashes.

## Weather Commands

/weather clear  
/weather rain  
/weather snow  
/weather thunder  
/weather random  

------------------------------------------------------------

# Dimensions

## Overworld

The Overworld contains:

- Grass terrain
- Dirt
- Stone
- Trees
- Hills
- Mountains
- Cave pockets
- Town near origin
- Crafting table placement
- Humans
- Day/night cycle
- Weather

## Hell

The Hell dimension contains:

- Red sky
- Hellstone
- Bloodrock
- Ash
- Fire
- Ash hills
- Hell trees
- Low caverns
- Boss spawners
- Procedural terrain

## Dimension Switching

Switch dimension with:

F7

or chat:

/dim  
/dimension  

------------------------------------------------------------

# World Generation

Worlds are generated using chunk-based procedural generation.

## Overworld Generation

The Overworld can generate:

- Height-based terrain
- Mountains
- Hills
- Cave pockets
- Trees
- Town near origin
- Crafting table structures
- Boss spawners in mountain areas

## Hell Generation

Hell can generate:

- Red roof layer
- Ash ground
- Bloodrock
- Hellstone
- Fire areas
- Low caverns
- Hell trees
- Boss spawners

------------------------------------------------------------

# Humans and NPCs

Humans are dynamic entities.

## Human Features

- Spawn in the world
- Saved and loaded with worlds
- Rendered as dynamic entities
- Can be used as the source for holographic humans

If no saved humans exist, the engine creates default humans near spawn.

------------------------------------------------------------

# Follower System

The follower can be toggled with:

F6

or chat:

/follower

When enabled, a follower spawns near the player and follows them.

------------------------------------------------------------

# Holographic Human System

The pause menu includes:

Summon House Human

This creates a holographic copy of a random human NPC.

The hologram can follow the cursor while the pause menu is open.

------------------------------------------------------------

# Water and Pee Survival System

The game includes survival meters for water and pee.

## Water Meter

Water can:

- Increase when drinking or interacting
- Drain over time
- Convert into pee when sleeping
- Drain when pee overflow happens

## Pee Meter

Pee can:

- Increase naturally
- Increase when drinking
- Increase when sleeping
- Reach 100
- Trigger pee overflow

## Pee Overflow

When pee reaches 100:

- Pee resets
- Water drains
- A pee block spawns in front of the player
- A chat message appears

Overflow message:

<System> You couldn't hold it...

------------------------------------------------------------

# Saving System

The game supports autosaving and manual saving.

## Manual Save

Use:

F5

or chat:

/save

## Saved Data

The save system stores:

- Player position
- Selected hotbar slot
- Hotbar item IDs
- Water meter
- Pee meter
- Time of day
- Overworld block data
- Human/entity data

## Save Folder Layout

Worlds are stored in:

configs/worldName

Block data is stored in:

blockdata/blocks.dat

Player data is stored in:

playerpos/playerpos.dat

Human/entity data is stored in:

humanalive/entitiesAlive.dat

Hell is procedural and may not be saved the same way as the Overworld.

------------------------------------------------------------

# Renderer

The game uses a custom Java software renderer.

## Renderer Features

- BufferedImage frame rendering
- Triangle mesh rendering
- Perspective camera
- Simple lighting and shading
- Dynamic sky color
- Entity rendering
- Chunk mesh rendering
- Selection highlight rendering
- Weather overlays

The renderer draws:

- World chunks
- Blocks
- Entities
- Bosses
- Humans
- Followers
- Holograms
- Weather effects
- Sky colors

------------------------------------------------------------

# UI and Menus

## Main Menu

Contains:

- Play
- Multiplayer
- Marketplace
- Multiplayer via Win12 Pages
- Version display
- Special background styling

## Play Menu

Contains:

- Saved levels list
- Search box
- Create new level
- Play level
- Edit level
- Rename
- Delete
- Back

## Options Menu

Contains:

- Occlusion culling
- Chunk streaming
- Chunk meshing experimental
- Render distance chunks
- Confirm
- Cancel

## Multiplayer Menu

Contains:

- Server IP field
- World URL field
- Join server
- LAN worlds list
- Manual LAN/URL entry
- Refresh LAN
- Join selected
- Back

## Marketplace

Contains:

- Marketplace item grid
- Item detail page
- Description
- Icon
- Download and install button
- Back to main menu button

## Pause Menu

Contains:

- Hotbar display
- 2x2 crafting grid
- Output slot
- Quit Game
- Summon House Human
- Host LAN World
- Stop LAN Server
- LAN status

------------------------------------------------------------

# Boss System

The boss system is connected to the Boss Spawner block.

## Boss Spawner

ID: 15  
Color: Magenta  
Function: Right-click to spawn boss  

## Crafting

3 Ash plus 1 Torch creates a Boss Spawner.

## Usage

1. Craft boss spawner.
2. Place boss spawner.
3. Right-click it.
4. Boss spawns.

------------------------------------------------------------

# Current Known Notes

## Boss Spawner ID

The Boss Spawner is:

ID 15

## Bed ID

The Bed is:

ID 30

If older notes say the spawner is ID 30, that is outdated.

## Chat Command Notes

Older documentation may mention commands like:

/time set day  
/time set night  
/spawn  
/hell  
/overworld  

The currently implemented command set uses:

/help  
/pos  
/tp  
/give  
/dim  
/dimension  
/follower  
/save  
/craft  
/break  
/place  
/weather  

------------------------------------------------------------

# Conclusion

Voxel IRL Simulator currently includes:

- Custom voxel rendering
- Startup cinematic
- Special randomized window title
- Main menu
- Play menu
- Options menu
- Multiplayer menu
- Win12 Pages multiplayer menu
- Marketplace
- Pause menu
- LAN hosting
- LAN hosted-world downloading
- Remote player sync hooks
- Survival mechanics
- Water and pee meters
- Crafting
- Beds and sleeping
- Weather
- Day/night cycle
- Hell dimension
- Humans and NPCs
- Holographic humans
- Follower
- Boss spawner
- Boss encounter support
- Saving and loading
- Chat commands
- Procedural terrain

This README documents the current major systems and gameplay mechanics of the engine.
