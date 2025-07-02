# String Management Guidelines

This section outlines the mandatory approach for managing all user-facing text and console messages in the VJ Tam Tam application. User-facing strings must be centralized in `src/constants/strings.js` to ensure maintainability and prepare for future internationalization, while system messages use hardcoded strings for developer efficiency.

### Organization Structure

All centralized strings are organized into three main categories:

- **USER_INTERFACE**: All visible UI text (buttons, labels, tooltips, headings)
- **USER_MESSAGES**: All messages shown to users (toasts, banners, instructions)  
- **TEMPLATES**: Reusable string templates with interpolation

### System Messages Approach

**System messages (console logs, debug info) now use hardcoded strings directly in the code** for the following reasons:

- They are not user-facing and don't need translation
- They are for developers only and benefit from being inline for debugging
- Reduces complexity and improves development experience
- Makes debugging faster by having messages directly in context

### Naming Conventions

- Use **camelCase** for all string keys
- Group by **functionality, not message type**
- Use **descriptive names**: `filePickerFallback` vs `fileAccessError`
- Templates use `{{variableName}}` syntax for interpolation

### Decision Tree for New Strings

When adding any new text to the application, follow this decision process:

1. **Is it visible to end users?**
   - Yes: `USER_INTERFACE` (buttons, labels) or `USER_MESSAGES` (notifications)
   - No: Use **hardcoded strings** directly in console.log/console.error calls

2. **Does it need variables?**
   - For user-facing: Add to `TEMPLATES` or use `{{variable}}` syntax
   - For system messages: Use template literals directly `console.log(\`Processing ${count} files\`)`

3. **Where does it appear?**
   - Fixed UI element: `USER_INTERFACE`
   - Temporary notification: `USER_MESSAGES.notifications`
   - Status/instruction: `USER_MESSAGES.status`
   - Console/debug: **Hardcoded string in place**

### Usage Examples

- Button text: `USER_INTERFACE.buttons.browseFiles`
- Toast message: `USER_MESSAGES.notifications.success.mediaAdded`
- Console log: `console.log('FileSystemFacade initialized successfully')`
- Template: `TEMPLATES.fileCount` ("{{count}} file{{plural}}")

### Implementation Rules

- **No hardcoded strings** for user-facing text anywhere in the codebase
- Use `STRINGS.CATEGORY.subcategory.stringName` for direct access to user strings
- Use `t.get()` helper for user strings requiring interpolation
- Use predefined `t.helper()` functions for common patterns (pluralization, etc.)
- **All console messages must use hardcoded strings directly**
- **All user notifications must come from `USER_MESSAGES.notifications`**
- **Toast notifications are user-facing and must use centralized strings**

### Critical: Toast Notifications

Toast notifications are **user-facing UI elements** and must always use centralized `USER_MESSAGES`:

```javascript
// ✅ Correct - using centralized user message
toastManager.success(t.get('USER_MESSAGES.notifications.success.mediaAdded', { count: 3 }))

// ❌ Wrong - using hardcoded string for user-facing element
toastManager.success('Files added successfully')

// ❌ Wrong - using system message for user-facing element  
toastManager.success(t.get('SYSTEM_MESSAGES.someSystemMessage'))
```

### Interpolation

For dynamic user-facing strings, use the `t.get()` helper:

```javascript
// Template in strings.js
mediaAdded: 'Added {{count}} media file{{plural}} to pool'

// Usage in code
toastManager.success(t.get('USER_MESSAGES.notifications.success.mediaAdded', { count: 3 }))
// Result: "Added 3 media files to pool"
```

For system messages, use template literals directly:

```javascript
// System message - hardcoded with template literal
console.log(`Processing ${files.length} files from ${folderName}`)
console.error(`Failed to initialize ${componentName}: ${error.message}`)
```

### AI Agent Responsibilities

- **Never use hardcoded strings** for user-facing text in any generated code
- **Always use hardcoded strings** for console/debug messages (not centralized)
- **Always check** if a suitable user-facing string already exists before creating new ones
- **Follow the decision tree** when determining string categorization
- **Use descriptive inline messages** for system logs
- **Ensure toast notifications always use centralized USER_MESSAGES**
- **Document any new string patterns** that might be reused
