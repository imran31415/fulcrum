<!-- Source: https://data-star.dev/reference/actions -->

# Datastar Actions Reference

## Overview

Datastar provides a set of secure actions prefixed with `@` that can be used in expressions. These actions are executed in a sandboxed environment using `Function()` constructors to prevent arbitrary JavaScript execution.

## Utility Actions

### `@peek()`
- Syntax: `@peek(callable: () => any)`
- Allows accessing signals without subscribing to their changes
- Example:
  ```html
  <div data-text="$foo + @peek(() => $bar)"></div>
  ```

### `@setAll()`
- Syntax: `@setAll(value: any, filter?: {include: RegExp, exclude?: RegExp})`
- Sets values for matching signals
- Examples:
  ```html
  <!-- Sets all signals starting with 'user.' -->
  <button data-on-click="@setAll('johnny', {include: /^user\./})"></button>
  ```

### `@toggleAll()`
- Syntax: `@toggleAll(filter?: {include: RegExp, exclude?: RegExp})`
- Toggles boolean values of matching signals
- Examples:
  ```html
  <!-- Toggles signals starting with 'is' -->
  <button data-on-click="@toggleAll({include: /^is/})"></button>
  ```

## Backend HTTP Actions

### HTTP Methods
- `@get(uri: string, options={})`
- `@post(uri: string, options={})`
- `@put(uri: string, options={})`
- `@patch(uri: string, options={})`
- `@delete(uri: string, options={})`

### Common Options
- `contentType`: `json` or `form`
- `filterSignals`: Regex to include/exclude signals
- `headers`: Custom request headers
- `openWhenHidden`: Keep connection open in background
- `requestCancellation`: Control request cancellation behavior

### Response Handling
Supports multiple response types:
- `text/event-stream`
- `text/html`
- `application/json`
- `text/javascript`

### Events
- `started`
- `finished`

## Security Features
- Actions are executed in sandboxed environment
- Uses `Function()` constructors to prevent arbitrary code execution
- Built-in protection against common security vulnerabilities