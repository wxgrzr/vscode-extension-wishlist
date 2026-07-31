<div align="center">

![logo](media/icon.png)

# Extension Wishlist

Bookmark VS Code Marketplace extensions to a wishlist and try them later — without being forced to install and download them now.


[![Version](https://img.shields.io/visual-studio-marketplace/v/wxgrzr.extension-wishlist?style=for-the-badge&label=VERSION&labelColor=1e1e1e&color=2b8a8a)](https://marketplace.visualstudio.com/items?itemName=wxgrzr.extension-wishlist)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/wxgrzr.extension-wishlist?style=for-the-badge&label=RATING&labelColor=1e1e1e&color=2b8a8a)](https://marketplace.visualstudio.com/items?itemName=wxgrzr.extension-wishlist&ssr=false#review-details)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/wxgrzr.extension-wishlist?style=for-the-badge&label=INSTALLS&labelColor=1e1e1e&color=2b8a8a)](https://marketplace.visualstudio.com/items?itemName=wxgrzr.extension-wishlist)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/wxgrzr.extension-wishlist?style=for-the-badge&label=DOWNLOADS&labelColor=1e1e1e&color=2b8a8a)](https://marketplace.visualstudio.com/items?itemName=wxgrzr.extension-wishlist)

</div>

<div align="center">

## What is this?

This is an extension wishlist extension. It allows you to add any given extension to a list without the need to install it. You can also directly install and uninstall extensions from the wishlist instead of through the VSCode Marketplace. It's meant for keeping track of interesting extensions you find but may not want to directly install yet. Or, providing a list of extensions to be toggled on/off as desired for testing purposes. Say you find a cool python extension but aren't sure it fits your current workplace settings since you're currently working on a react app. This extension allows you to "save it for later" where you can swap projects, install the extension for testing purposes, and turn it on/off as needed. If you don't like it, you can simply remove it from the list.

</div>

<div align="center">

## Why use a wishlist?

Installing every extension you come across bloats your setup and slows down VS Code's startup. Extension Wishlist lets you bookmark VS Code extensions the moment you spot them in the Marketplace, in a blog post, in a colleague's recommendation, and decide later whether they're worth installing. Think of it as a reading list for your Extensions view.

</div>

## Features

<div>
<ul>
 <li>Right-click context menu in extension marketplace list now includes "add to wishlist" option.</li>
 <li>Visiting any marketplace page within vscode, clicking on `⚙` icon shows dropdown with "add to wishlist" option.</li>
 <li>Activity bar icon which allows you to navigate to your wishlisted extenstions and perform various actions such as:
  <ul>
   <li>Open in marketplace (opens external link to vscode marketplace webpage for that specific extension id)</li>
   <li>Remove from wishlist with 'x' button</li>
   <li>CLicking on any wishlisted extension opens that extensions page in vscode marketplace directly</li>
   <li>If any wishlisted extensions become 'installed', a green checkmark icon will appear
    <ul>
     <li>From here, you can either right click to uninstall the extension and keep it in the list</li>
     <li>Or, you can simply remove it by clicking the 'x' button, since it is now installed, removing it from the list but keeping it installed</li>
     <li>You'll also notice a trash can icon for any installed extensions, clicking this will uninstall the extension as well</li>
    </ul>
   </li>
   <li>Clicking the three dots gives you the ability to completely whipe out the entire wishlist items and start anew</li>
  </ul>
 </li>
</ul>

</div>

## Full Demo

Here, you can see a full demonstration of (most) features the extension offers:

- Adding a wishlist item from the right click context menu in extensions list.
- Adding a wishlist item from the actual extension page.
- Installing and Uninstalling and extension from the wishlist page.
- Removing all extensions from the list.
- Uninstalling a specific extension, reinstalling it, and removing it from the wishlist.

![feature demo](media/resized-demo.gif)

## Installation

1. Open the Extensions view in Visual Studio Code.
2. Search for "Extension Wishlist".
3. Click **Install**.
4. Reload the editor if prompted.

### Install from a `.vsix` file

Prefer to install a downloaded release directly instead of through the Marketplace?

1. Download the `.vsix` file.
2. Open the Extensions view (`Cmd+Shift+X` / `Ctrl+Shift+X`).
3. Click the `...` (More Actions) menu at the top of the Extensions view and choose **Install from VSIX...**.
4. Select the downloaded file and reload VS Code when prompted.

Or, from the command line:

```
code --install-extension extension-wishlist-0.1.0.vsix
```

## Getting started

1. Install the extension and open the **Extension Wishlist** view from the Activity Bar (the bookmark icon).
2. Browse the built-in **Extensions** view, right-click any extension, and choose **Add to Wishlist**.
3. Your saved extensions appear in the sidebar. Click one to open its page in VS Code and install it whenever you're ready.

Prefer to add something you already know by name? Click **Add by Extension ID** in the wishlist view and enter its id (e.g. `esbenp.prettier-vscode`).

## Commands

| Command                                    | Description                                                |
| ------------------------------------------ | ---------------------------------------------------------- |
| `Extension Wishlist: Add to Wishlist`      | Right-click an extension in the Extensions view to save it |
| `Extension Wishlist: Add by Extension ID`  | Wishlist an extension by its id                            |
| `Extension Wishlist: Open Extension Page`  | Open a wishlisted extension's page in VS Code              |
| `Extension Wishlist: Uninstall Extension`  | Uninstall an installed wishlisted extension                |
| `Extension Wishlist: Remove from Wishlist` | Remove a saved extension                                   |
| `Extension Wishlist: Clear Wishlist`       | Remove everything                                          |

## Feedback & issues

Found a bug or have a feature request? Please [open an issue](https://github.com/wxgrzr/vscode-extension-wishlist/issues).

## License

[MIT](LICENSE) © William Greer
