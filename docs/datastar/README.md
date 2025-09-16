# Datastar Documentation

This folder contains comprehensive documentation for Datastar, a lightweight frontend framework that enables backend-driven, interactive UIs using HTML data attributes.

## Documentation Structure

### Guides
- [Getting Started](./getting-started.md) - Introduction, installation, and core concepts
- [Reactive Signals](./reactive-signals.md) - Signal creation, reactivity patterns, and data binding
- [Datastar Expressions](./datastar-expressions.md) - Expression syntax, operators, and JavaScript integration
- [Backend Requests](./backend-requests.md) - HTTP methods, SSE, and server communication

### Reference Documentation
- [Attributes Reference](./attributes-reference.md) - Complete list of data attributes and their usage
- [Actions Reference](./actions-reference.md) - HTTP actions, utility functions, and options
- [SSE Events Reference](./sse-events-reference.md) - Server-Sent Events for DOM manipulation
- [Security Reference](./security-reference.md) - Security considerations and best practices

### Examples
- [Examples](./examples.md) - Common patterns including click-to-edit, form validation, and active search

## Quick Start

1. **Installation**: Add Datastar via CDN
   ```html
   <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.0-alpha/bundles/datastar.js"></script>
   ```

2. **Basic Usage**: Use data attributes for reactivity
   ```html
   <button data-on-click="@get('/endpoint')">Load Data</button>
   <div data-text="$message"></div>
   ```

3. **Signals**: Create reactive variables with the `$` prefix
   ```html
   <input data-bind-username />
   <div data-text="$username"></div>
   ```

## Key Concepts

- **Hypermedia-First**: Backend drives frontend state changes
- **Data Attributes**: Use `data-*` attributes for all functionality
- **Signals**: Reactive variables denoted with `$` prefix
- **Actions**: Secure functions prefixed with `@` for HTTP requests and utilities
- **SSE**: Server-Sent Events for real-time updates

## Resources

- [Official Website](https://data-star.dev)
- [VSCode Extension](https://marketplace.visualstudio.com/items?itemName=starfederation.datastar-vscode)
- [IntelliJ Plugin](https://plugins.jetbrains.com/plugin/26072-datastar-support)

Last updated: September 15, 2025