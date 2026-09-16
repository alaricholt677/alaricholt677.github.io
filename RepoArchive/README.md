# RepoArchive: Aurora Edition

**A GitHub-powered repository archive, discovery browser, editor, and historical website explorer with an archive-inspired Aurora interface.**

RepoArchive presents GitHub repositories as preserved digital items. It combines live repository discovery, archive-style item pages, optional authenticated tools, and RepoWayback, a commit-history viewer for replaying older GitHub Pages websites.

Everything runs in the browser using HTML, CSS, JavaScript, and the GitHub REST API.

## Overview

RepoArchive includes three connected experiences:

1. **RepoArchive** for finding, searching, and viewing GitHub repositories.
2. **RepoWayback Showcase** for introducing the historical replay system.
3. **RepoWayback Time Machine** for loading repository files and GitHub Pages snapshots from earlier commits.

The project itself is stored in a GitHub repository and can be hosted through GitHub Pages.

## Folder Structure

```text
/RepoArchive/
├── index.html                 # RepoArchive Aurora Edition
└── wayback/
    ├── index.html             # RepoWayback animated showcase
    └── visit/
        └── index.html         # RepoWayback Time Machine
```

The relative navigation flow is:

```text
RepoArchive → ./wayback/ → ./visit/
```

## RepoArchive Features

### Repository Front Page

- Loads 50 featured public repositories from GitHub
- Ranks the featured results by stars
- Includes a **+1 View all featured repos** card
- Expands the featured shelf to as many as 100 repositories
- Displays repository owner, name, description, language, stars, and forks
- Uses animated repository cards with pointer-responsive lighting

### Repository Search

- Searches GitHub repositories
- Supports repository names, creators, keywords, and topics
- Uses hash-based search routes
- Displays live GitHub results in the RepoArchive card layout

Example route:

```text
#/search?q=voxel
```

### Archive-Style Repository Pages

Each repository can be displayed as an archive item with:

- Repository name and owner
- Description
- Topics
- Creation and update dates
- Primary language
- License
- Stars
- Forks
- Open issue count
- Default branch
- Rendered README
- Root file listing
- Recent commits
- Recent releases
- GitHub link
- ZIP download link
- Optional Star action for authenticated users

Example route:

```text
#/repo/owner/repository
```

## Account States

RepoArchive works without signing in. Public repository browsing and search remain available in read-only mode.

### Signed-Out Menu

- Sign in with access token
- Create a GitHub account
- Open RepoWayback

### Signed-In Menu

- Displays the authenticated GitHub username
- My repositories
- Repository editor
- RepoWayback
- Sign out

### Optional Access Token

A GitHub personal access token can be used for:

- A higher authenticated API request limit
- Access to repositories available to the authenticated user
- Starring repositories
- Loading files into the repository editor
- Creating or updating repository text files

The token:

- Is optional
- Is kept in the current page session
- Is not placed in the URL
- Is not written to localStorage
- Is cleared when the page closes
- Has common pasted formatting removed before use

Use a fine-grained token with only the repository access and permissions you need.

## Repository Editor

Authenticated users can open the built-in editor from the account menu or a repository page.

The editor supports:

- `owner/repository` selection
- Repository-relative file paths
- Loading an existing text file
- Editing text content
- Entering a commit message
- Updating an existing file
- Creating a new text file
- Committing changes through GitHub

The connected token must have permission to write repository contents.

## RepoWayback Showcase

The showcase is located at:

```text
./wayback/
```

It presents RepoWayback with:

- Animated Aurora clouds
- Starfield background
- Cursor-following light
- Animated gradient headings
- Scroll-triggered feature cards
- A 3D pointer-responsive Time Machine preview
- Pulsing timeline nodes
- Neon borders and loading effects
- Responsive layouts
- Reduced-motion support

Every showcase launch button opens:

```text
./visit/
```

The showcase also supports:

```text
Alt + T
```

for launching the Time Machine.

## RepoWayback Time Machine

RepoWayback reconstructs repository content from a selected Git commit.

### Commit History

- Loads up to 1,000 commits
- Displays commit dates, short SHAs, and messages
- Supports selecting commits directly
- Supports finding a commit by local timestamp
- Includes Latest Commit loading
- Provides a visual history timeline

### Commit Search

- Searches commit messages
- Searches full and abbreviated SHAs
- Searches dates, months, and years
- Ranks the top five related results
- Shows results only while the search box is active
- Closes results when clicking outside or pressing Escape

### File Browser

- Lists files present in the selected commit
- Loads repository-relative paths
- Opens HTML, text, code, JSON, CSS, JavaScript, images, audio, and video
- Includes Preview and Code modes
- Shows original source for the selected file

### Historical Page Rendering

RepoWayback prepares historical HTML by:

- Resolving resources against the selected commit
- Rewriting relative asset paths
- Processing inline and external CSS
- Rewriting CSS `url(...)` values
- Loading nested CSS imports
- Loading repository JavaScript
- Rewriting static module imports
- Supporting images, media, posters, source sets, fonts, and backgrounds
- Preserving internal navigation within the selected commit
- Reconstructing same-repository nested frames with `srcdoc`

### Historical Navigation

RepoWayback translates common navigation patterns so they remain inside the selected snapshot.

Supported patterns include:

```js
window.location.href = "./page.html";
location.href = path;
window.location = path;
location.assign(path);
location.replace(path);
window.open(path);
history.pushState({}, "", path);
history.replaceState({}, "", path);
```

Normal links, forms, dynamically changed frame sources, and same-site GitHub Pages URLs are also routed through RepoWayback where supported.

### Browser Storage Compatibility

Historical pages can use a simulated storage layer with:

- `localStorage.getItem()`
- `localStorage.setItem()`
- `localStorage.removeItem()`
- `localStorage.clear()`
- `localStorage.key()`
- `localStorage.length`
- `sessionStorage` compatibility

Storage is namespaced by repository so pages and commits within one repository can share their simulated site data.

### PWA Compatibility

RepoWayback prevents historical Progressive Web App code from controlling the host page while allowing the page to continue loading.

It can safely simulate or ignore:

- Web app manifests
- Service worker registration
- Cache API calls
- Push subscriptions
- Background sync
- Periodic sync
- Notification methods
- Installation prompts

Service-worker and manifest files can still be viewed as source.

### Jekyll and Liquid Source

Some older GitHub Pages repositories contain unbuilt Jekyll source such as:

```liquid
{{ post.url }}
{% for post in site.posts %}
```

RepoWayback may display these expressions because it is honestly loading the repository file from that commit. It does not run a complete Ruby and Jekyll build pipeline.

This means RepoWayback can reveal both:

- The generated website visitors saw
- The underlying templates developers worked with

Regular HTML, CSS, and JavaScript repositories replay more directly because they do not require an additional static-site build step.

## Hash Routes

RepoArchive uses client-side hash routing:

```text
#/                         Front page
#/search?q=query           Repository search
#/repo/owner/repository    Repository archive page
#/mine                     Authenticated repositories
```

This keeps navigation compatible with static GitHub Pages hosting.

## Aurora Interface

The interface includes:

- Purple and cyan Aurora backgrounds
- Animated gradients
- Glass-style panels
- Sticky top navigation
- Animated cards
- Pointer-responsive lighting
- Loading spinners
- Account dropdown animations
- Responsive repository grids
- Archive-inspired metadata layouts
- Scroll progress effects
- Mobile layouts
- Reduced-motion accessibility handling

## Custom Favicon

RepoArchive includes a custom SVG page icon embedded as a data URL. It does not require a separate favicon file.

## Deployment

Place the files into the repository using this structure:

```text
RepoArchive/
├── index.html
└── wayback/
    ├── index.html
    └── visit/
        └── index.html
```

When RepoArchive is served from a GitHub Pages repository, the relative links continue to work without hardcoding the repository name or domain.

## Technology

- HTML5
- CSS3
- JavaScript
- GitHub REST API
- Hash routing
- Fetch API
- DOMParser
- iframe `srcdoc`
- postMessage
- MutationObserver
- Local browser storage compatibility layer
- No required backend
- No required framework

## Security Notes

- Public browsing does not require authentication.
- A PAT should be treated like a password.
- Prefer a fine-grained PAT with the smallest necessary permission set.
- The app does not intentionally save the PAT to localStorage or place it in the URL.
- Repository write actions require explicit user interaction.
- Historical pages run inside a restricted viewer environment.
- Service workers and manifests are prevented from taking control of the RepoWayback host.
- External websites may enforce their own iframe, CORS, or content-security restrictions.

## Known Limitations

- GitHub API rate limits still apply.
- The public repository search API may limit the total retrievable result set.
- Private repositories require authentication and suitable token permissions.
- Binary files are viewable only through supported preview types.
- Some external content cannot be embedded because of server security headers.
- Complete Jekyll, Liquid, Ruby, React, Vue, or other build pipelines are not recreated in the browser.
- Highly dynamic or minified redirect code may contain navigation patterns that cannot be translated perfectly.
- Repository editor support is intended for text files rather than arbitrary binary editing.

## Project Philosophy

RepoArchive treats source repositories as historical digital artifacts rather than simple code listings.

RepoWayback extends that idea by letting users move through a repository’s history and experience old pages, experiments, temporary placeholders, forgotten designs, unresolved templates, redirects, and development-era behavior.

The result is a repository archive stored in a repository, hosted by GitHub, powered by GitHub, and capable of exploring its own history.

## Credits

- **Alaric**: creator, developer, and designer
- **Microsoft Copilot**: development and documentation assistance

## License

This project is intended to use the same license as the containing repository. See the repository’s `LICENSE` file for the applicable terms.

## Support

If you enjoy RepoArchive:

- Star the repository
- Explore it through RepoWayback
- Report issues through GitHub
- Suggest repository-viewing and historical-replay improvements
- Fork it and experiment with your own archive interface
