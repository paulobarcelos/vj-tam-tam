# String Management Guidelines

This section outlines the mandatory approach for managing all user-facing text and console messages in the VJ Tam Tam application. All strings must be centralized in `src/constants/strings.js` to ensure maintainability and prepare for future internationalization.

### Organization Structure

All strings are organized into four main categories:

- **USER_INTERFACE**: All visible UI text (buttons, labels, tooltips, headings)
- **USER_MESSAGES**: All messages shown to users (toasts, banners, instructions)  
- **SYSTEM_MESSAGES**: All console/log messages for developers (debug, info, warnings, errors)
- **TEMPLATES**: Reusable string templates with interpolation

### Naming Conventions

- Use **camelCase** for all string keys
- Group by **functionality, not message type**
- Use **descriptive names**: `filePickerFallback` vs `fileAccessError`
- Templates use `{{variableName}}` syntax for interpolation

### Decision Tree for New Strings

When adding any new text to the application, follow this decision process:

1. **Is it visible to end users?**
   - Yes: `USER_INTERFACE` (buttons, labels) or `USER_MESSAGES` (notifications)
   - No: `SYSTEM_MESSAGES` (console logs, debug info)

2. **Does it need variables?**
   - Yes: Add to `TEMPLATES` or use `{{variable}}` syntax
   - No: Add as simple string

3. **Where does it appear?**
   - Fixed UI element: `USER_INTERFACE`
   - Temporary notification: `USER_MESSAGES.notifications`
   - Status/instruction: `USER_MESSAGES.status`
   - Console/debug: `SYSTEM_MESSAGES`

### Usage Examples

- Button text: `USER_INTERFACE.buttons.browseFiles`
- Toast message: `USER_MESSAGES.notifications.success.mediaAdded`
- Console log: `SYSTEM_MESSAGES.fileSystemAccess.initialized`
- Template: `TEMPLATES.fileCount` ("{{count}} file{{plural}}")

### Implementation Rules

- **No hardcoded strings** anywhere in the codebase
- Use `STRINGS.CATEGORY.subcategory.stringName` for direct access
- Use `t.get()` helper for strings requiring interpolation
- Use predefined `t.helper()` functions for common patterns (pluralization, etc.)
- All console messages must come from `SYSTEM_MESSAGES`
- All user notifications must come from `USER_MESSAGES.notifications`

### Interpolation

For dynamic strings, use the `t.get()` helper:

```javascript
// Template in strings.js
mediaAdded: 'Added {{count}} media file{{plural}} to pool'

// Usage in code
console.log(t.get('USER_MESSAGES.notifications.success.mediaAdded', { count: 3 }))
// Result: "Added 3 media files to pool"
```

### AI Agent Responsibilities

- **Never use hardcoded strings** in any generated code
- **Always check** if a suitable string already exists before creating new ones
- **Follow the decision tree** when determining string categorization
- **Use descriptive key names** that clearly indicate the string's purpose
- **Document any new string patterns** that might be reused
