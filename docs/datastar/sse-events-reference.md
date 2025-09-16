<!-- Source: https://data-star.dev/reference/sse_events -->

# SSE Events Reference for Datastar

## Overview

Server-Sent Events (SSE) in Datastar are responses to backend actions with a `text/event-stream` content type. These events can contain zero or more SSE events for manipulating the DOM and application state.

## Event Types

### `datastar-patch-elements`

Patches one or more elements in the DOM, with default morphing behavior matching top-level elements by ID.

#### Basic Example
```
event: datastar-patch-elements
data: elements <div id="foo">Hello world!</div>
```

#### Patch Modes

| Mode | Description |
|------|-------------|
| `outer` (default) | Morphs the outer HTML of elements |
| `inner` | Morphs the inner HTML of elements |
| `replace` | Replaces the outer HTML of elements |
| `prepend` | Prepends elements to target's children |
| `append` | Appends elements to target's children |
| `before` | Inserts elements before the target as siblings |
| `after` | Inserts elements after the target as siblings |
| `remove` | Removes target elements from DOM |

#### Advanced Example
```
event: datastar-patch-elements
data: mode inner
data: selector #foo
data: useViewTransition true
data: elements <div>Hello world!</div>
```

### `datastar-patch-signals`

Patches signals into existing page signals.

#### Basic Example
```
event: datastar-patch-signals
data: signals {foo: 1, bar: 2}
```

#### Removing Signals
```
event: datastar-patch-signals
data: signals {foo: null, bar: null}
```

#### Optional Parameters
- `onlyIfMissing`: Update signals only if they do not exist

## Notes
- Use IDs on top-level elements for reliable morphing
- SVG morphing requires special handling
- Backend SDKs can help format SSE events