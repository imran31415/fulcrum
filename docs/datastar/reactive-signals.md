<!-- Source: https://data-star.dev/guide/reactive_signals -->

# Reactive Signals Guide

## Overview

Datastar uses signals to manage frontend state, which are reactive variables that automatically track and propagate changes in expressions. Signals are denoted using the `$` prefix.

## Key Concepts

### Signal Creation Methods

1. **Automatic Creation**
   - Signals can be created on-the-fly using attributes like `data-bind` and `data-computed`
   - If a signal is used without being explicitly created, it will be automatically created with an empty string value

2. **Explicit Creation**
   - Use `data-signals` attribute to create and patch signals
   - Supports nested signals using dot notation
   - Can create multiple signals simultaneously

### Data Attributes for Signals

#### `data-bind`
- Sets up two-way data binding for input elements
- Creates a reactive signal synchronized with element value

```html
<input data-bind-foo />
```

#### `data-text`
- Sets element text content based on a signal
- Supports JavaScript expressions

```html
<div data-text="$foo.toUpperCase()"></div>
```

#### `data-computed`
- Creates read-only signals derived from reactive expressions
- Automatically updates when source signals change

```html
<div data-computed-repeated="$foo.repeat(2)" data-text="$repeated"></div>
```

#### `data-show`
- Conditionally shows/hides elements based on expressions

```html
<button data-show="$foo != ''">Save</button>
```

#### `data-class`
- Dynamically adds/removes CSS classes based on expressions

```html
<button data-class-success="$foo != ''">Save</button>
```

#### `data-attr`
- Binds HTML attributes to expressions
- Supports setting multiple attributes

```html
<button data-attr-disabled="$foo == ''">Save</button>
```

### Frontend Reactivity

Datastar enables declarative signals through data attributes, allowing reactive interactions without complex JavaScript.

### Signal Patching

Signals can be patched (added, updated, removed) from the backend using:
- JSON responses
- Server-Sent Events (SSE)

Example SSE signal patch:
```
event: datastar-patch-signals
data: signals {"foo": "new value", "bar": {"nested": "data"}}
```