<!-- Source: https://data-star.dev/guide/datastar_expressions -->

# Datastar Expressions Guide

## Overview
Datastar expressions are specialized strings evaluated by `data-*` attributes with unique characteristics:

### Key Characteristics
- Evaluated in a sandboxed context
- Can use JavaScript operators
- Support multiple statements with semicolons
- Provide an `el` variable representing the current element

## Basic Syntax

### Signal Reference
```html
<div data-signals-foo="1">
    <div data-text="$foo"></div>
</div>
```

### Element Reference
```html
<div id="foo" data-text="el.id"></div>
```

## Operators and Conditionals

### Ternary and Logical Operators
```html
<!-- Conditional output -->
<div data-text="$landingGearRetracted ? 'Ready' : 'Waiting'"></div>

<!-- Conditional visibility -->
<div data-show="$landingGearRetracted || $timeRemaining < 10">
    Countdown
</div>

<!-- Conditional action -->
<button data-on-click="$landingGearRetracted && @post('/launch')">
    Launch
</button>
```

### Multiple Statements
```html
<div data-signals-foo="1">
    <button data-on-click="$landingGearRetracted = true; @post('/launch')">
        Force launch
    </button>
</div>
```

## JavaScript Integration

### External Scripts
- Pass data via arguments
- Return results or dispatch custom events
- Use "props down, events up" pattern

### Web Components
- Create encapsulated custom elements
- Pass data via attributes
- Listen for custom events

## Script Execution

### Backend-Sent JavaScript
- Supports execution via `text/javascript` content type
- Can send scripts through Server-Sent Events (SSE)

## Best Practices
- Keep logic in `data-*` attributes
- Encapsulate complex logic in external scripts or web components
- Follow "props down, events up" principle