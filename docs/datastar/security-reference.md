<!-- Source: https://data-star.dev/reference/security -->

# Datastar Security Reference

## Overview
Datastar expressions are evaluated in a sandboxed JavaScript context, which requires careful security considerations.

## Key Security Principles

### 1. Escape User Input
- **Golden Rule**: "Never trust user input"
- Critical for preventing Cross-Site Scripting (XSS) attacks
- Always escape user-provided data in Datastar expressions

### 2. Sensitive Data Handling
- Signal values are visible in source code
- Can be modified by users before request transmission
- **Recommendation**:
  - Avoid leaking sensitive information in signals
  - Implement robust backend validation

### 3. Handling Unsafe Input
- Use `data-ignore` attribute to exclude unsafe elements
- Prevents processing of potentially dangerous DOM nodes

### 4. Content Security Policy (CSP)
- Requires `unsafe-eval` for script execution
- Example CSP configuration:
  ```html
  <meta http-equiv="Content-Security-Policy"
      content="script-src 'self' 'unsafe-eval';">
  ```

## Best Practices
- Always validate and sanitize user inputs
- Use backend validation as a primary security mechanism
- Minimize exposure of sensitive data
- Implement strict input handling strategies

## Potential Risks
- JavaScript execution in expressions
- Client-side data manipulation
- Potential XSS vulnerabilities