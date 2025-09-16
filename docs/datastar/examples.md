<!-- Source: https://data-star.dev/examples/ -->

# Datastar Examples

This document contains key examples from the Datastar documentation to demonstrate common patterns and usage.

## Click To Edit Example

### Overview
The "Click to Edit" pattern allows inline editing of a record without page refresh. It demonstrates a simple contact editing interface using Datastar.

### Frontend HTML

#### View Mode
```html
<div id="demo">
    <p>First Name: John</p>
    <p>Last Name: Doe</p>
    <p>Email: [email protected]</p>
    <div role="group">
        <button
            class="info"
            data-indicator-_fetching
            data-attr-disabled="$_fetching"
            data-on-click="@get('/examples/click_to_edit/edit')"
        >
            Edit
        </button>
        <button
            class="warning"
            data-indicator-_fetching
            data-attr-disabled="$_fetching"
            data-on-click="@patch('/examples/click_to_edit/reset')"
        >
            Reset
        </button>
    </div>
</div>
```

#### Edit Mode
```html
<div id="demo">
    <label>
        First Name
        <input
            type="text"
            data-bind-first-name
            data-attr-disabled="$_fetching"
        >
    </label>
    <label>
        Last Name
        <input
            type="text"
            data-bind-last-name
            data-attr-disabled="$_fetching"
        >
    </label>
    <label>
        Email
        <input
            type="email"
            data-bind-email
            data-attr-disabled="$_fetching"
        >
    </label>
    <div role="group">
        <button
            class="success"
            data-indicator-_fetching
            data-attr-disabled="$_fetching"
            data-on-click="@put('/examples/click_to_edit')"
        >
            Save
        </button>
        <button
            class="error"
            data-indicator-_fetching
            data-attr-disabled="$_fetching"
            data-on-click="@get('/examples/click_to_edit')"
        >
            Cancel
        </button>
    </div>
</div>
```

## Form Data Example

### Form Submission with Checkboxes
```html
<form id="myform">
    foo:<input type="checkbox" name="checkboxes" value="foo" />
    bar:<input type="checkbox" name="checkboxes" value="bar" />
    baz:<input type="checkbox" name="checkboxes" value="baz" />
    <button data-on-click="@get('/endpoint', {contentType: 'form'})">
        Submit GET request
    </button>
    <button data-on-click="@post('/endpoint', {contentType: 'form'})">
        Submit POST request
    </button>
</form>

<button data-on-click="@get('/endpoint', {contentType: 'form', selector: '#myform'})">
    Submit GET request from outside the form
</button>
```

### Form Submit Event
```html
<form data-on-submit="@get('/endpoint', {contentType: 'form'})">
    foo: <input type="text" name="foo" required />
    <button>
        Submit form
    </button>
</form>
```

## Inline Validation Example

### HTML with Real-time Validation
```html
<div id="demo">
    <label>
        Email Address
        <input
            type="email"
            required
            aria-live="polite"
            aria-describedby="email-info"
            data-bind-email
            data-on-keydown__debounce.500ms="@post('/examples/inline_validation/validate')"
        />
    </label>
    <p id="email-info" class="info">The only valid email address is "[email protected]".</p>

    <label>
        First Name
        <input
            type="text"
            required
            aria-live="polite"
            data-bind-first-name
            data-on-keydown__debounce.500ms="@post('/examples/inline_validation/validate')"
        />
    </label>

    <label>
        Last Name
        <input
            type="text"
            required
            aria-live="polite"
            data-bind-last-name
            data-on-keydown__debounce.500ms="@post('/examples/inline_validation/validate')"
        />
    </label>

    <button
        class="success"
        data-on-click="@post('/examples/inline_validation')"
    >
        <i class="material-symbols:person-add"></i>
        Sign Up
    </button>
</div>
```

## Active Search Example

### Real-time Search with Debouncing
```html
<input
    type="text"
    placeholder="Search..."
    data-bind-search
    data-on-input__debounce.200ms="@get('/examples/active_search/search')"
/>
```

### Key Features
- Debounced input (200ms delay)
- Automatic search as user types
- Bound search value
- Backend endpoint triggers search

## Common Patterns

### Loading Indicators
Use `data-indicator` to show request status:
```html
<button
    data-on-click="@get('/endpoint')"
    data-indicator-_fetching
    data-attr-disabled="$_fetching"
>
    Load Data
</button>
```

### Debouncing
Add delays to prevent excessive requests:
```html
<input data-on-input__debounce.500ms="@post('/validate')" />
```

### Form Data Collection
Use `contentType: 'form'` to collect form data:
```html
<button data-on-click="@post('/submit', {contentType: 'form'})">
    Submit
</button>
```