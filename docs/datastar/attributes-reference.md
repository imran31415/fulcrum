<!-- Source: https://data-star.dev/reference/attributes -->

# Datastar Attributes Reference

## Overview

Datastar provides a comprehensive set of data attributes that enable reactive web development. These attributes are processed in order, have specific casing rules, and can be used to create dynamic, interactive web interfaces.

## Core Attributes

### `data-attr`
Sets and synchronizes HTML attribute values dynamically.

```html
<div data-attr-title="$foo"></div>
<div data-attr="{title: $foo, disabled: $bar}"></div>
```

### `data-bind`
Creates two-way data binding for form elements.

```html
<input data-bind-foo />
<input data-bind="foo" />
```

### `data-class`
Conditionally adds or removes CSS classes.

```html
<div data-class-hidden="$foo"></div>
<div data-class="{hidden: $foo, 'font-bold': $bar}"></div>
```

### `data-computed`
Creates read-only signals computed from other signals.

```html
<div data-computed-foo="$bar + $baz"></div>
```

### `data-effect`
Executes expressions when signals change.

```html
<div data-effect="$foo = $bar + $baz"></div>
```

### `data-ignore`
Prevents Datastar from processing specific elements.

```html
<div data-ignore data-show-thirdpartylib="">
    Datastar will not process this element.
</div>
```

### `data-on`
Attaches event listeners with reactive expressions.

```html
<button data-on-click="$foo = ''">Reset</button>
```

### `data-signals`
Patches and manages reactive signals.

```html
<div data-signals-foo="1"></div>
<div data-signals="{foo: {bar: 1, baz: 2}}"></div>
```

### `data-text`
Binds element text content to an expression.

```html
<div data-text="$foo"></div>
```

## Pro Attributes

### `data-animate`
Animates element attributes over time. (Pro feature)

### `data-custom-validity`
Adds custom form input validation. (Pro feature)

### `data-persist`
Persists signals to localStorage. (Pro feature)

### `data-query-string`
Syncs signals with URL query parameters. (Pro feature)

## Processing Rules

- Attributes are processed in document order
- Kebab-case attribute names are converted to camelCase for signals
- Use aliasing for custom signal names
- Expressions support JavaScript operators and functions