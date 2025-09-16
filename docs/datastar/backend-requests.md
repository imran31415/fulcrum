<!-- Source: https://data-star.dev/guide/backend_requests -->

# Datastar Backend Requests Guide

## Key Concepts

Datastar enables hypermedia-driven applications where the backend drives frontend state. The core principles include:

- Sending all signals with every backend request
- Supporting nested signals
- Providing multiple backend request methods
- Enabling Server-Sent Events (SSE) for dynamic updates

## Sending Signals

### Signal Transmission Rules
- All signals (except local signals starting with `_`) are sent automatically
- For `GET` requests, signals are sent as a `datastar` query parameter
- For other methods, signals are sent as JSON body

### Nested Signals Example
```html
<div data-signals="{menu: {isOpen: {desktop: false, mobile: false}}}">
    <button data-on-click="@toggleAll({include: /^menu\.isOpen\./})">
        Open/close menu
    </button>
</div>
```

## Backend Request Methods

Datastar supports multiple HTTP methods:
- `@get()`
- `@post()`
- `@put()`
- `@patch()`
- `@delete()`

## Server-Sent Events (SSE)

SSE allows streaming multiple events from server to browser. Example pattern:

```python
async def endpoint():
    return DatastarResponse([
        SSE.patch_elements('<div id="question">What do you put in a toaster?</div>'),
        SSE.patch_signals({"response": "", "answer": "bread"})
    ])
```

## Loading Indicators

Use `data-indicator` to show request status:

```html
<button
    data-on-click="@get('/actions/quiz')"
    data-indicator-fetching
>
    Fetch a question
</button>
<div data-class-loading="$fetching" class="indicator"></div>
```

## Key Benefits

- Backend drives frontend state
- Multiple events can be sent in single response
- Reactive and dynamic user interfaces
- Simplified state management