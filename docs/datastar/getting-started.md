<!-- Source: https://data-star.dev/guide/getting_started -->

# Getting Started with Datastar

## Overview

Datastar is a lightweight frontend framework that simplifies web development by:
- Providing backend-driven, interactive UIs
- Using a hypermedia-first approach
- Extending and enhancing HTML

## Key Features

1. Modify DOM and state via backend events
2. Build frontend reactivity using standard `data-*` HTML attributes

## Installation

### CDN Method
```html
<script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/[email protected]/bundles/datastar.js"></script>
```

### Self-Hosted Method
```html
<script type="module" src="/path/to/datastar.js"></script>
```

## Core Concepts

### Data Attributes (`data-*`)

Datastar uses HTML data attributes to add reactivity. Example:

```html
<button data-on-click="alert('I'm sorry, Dave. I'm afraid I can't do that.')">
    Open the pod bay doors, HAL.
</button>
```

### Patching Elements

Backends can drive frontend updates by "patching" HTML elements into the DOM. This can be done via:

1. HTTP Responses with HTML content
2. Server-Sent Events (SSE)

#### GET Request Example
```html
<button data-on-click="@get('/endpoint')">
    Open the pod bay doors, HAL.
</button>
<div id="hal"></div>
```

#### SSE Example
```
event: datastar-patch-elements
data: elements <div id="hal">
data: elements     I'm sorry, Dave. I'm afraid I can't do that.
data: elements </div>
```

## Additional Resources

- [Deep Wiki](https://deepwiki.com/starfederation/datastar)
- [Code Samples](https://context7.com/websites/data-star_dev)
- [Single-Page Docs](/docs)

## Development Tools

- VSCode Extension
- IntelliJ Plugin
- Datastar Inspector

## Next Steps

Continue to the [Reactive Signals](/guide/reactive_signals) guide for more in-depth exploration.