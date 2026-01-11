# GitHub Copilot Instructions for VSCode Reborn AI Extension

This file provides specific guidelines for GitHub Copilot to ensure consistent, maintainable code generation for the VSCode Reborn AI extension.

## Project Overview

VSCode Reborn AI is a VS Code extension that provides AI-powered coding assistance through a webview interface. The extension uses a dual-process architecture with a backend (Node.js/VS Code Extension API) and frontend (React-based webview).

## Architecture & Communication Patterns

### Dual-Process Architecture
- **Backend Process**: Node.js extension host (`src/main.ts`, `src/entry-point.ts`)
- **Frontend Process**: React webview (`src/renderer/`)
- **Communication**: Message-based IPC between backend and frontend via `webview.postMessage()`

### Message Communication Pattern
**Always follow the established message pattern**:

1. **Backend Message Types**: Defined in `src/renderer/types-messages.ts` with `BackendMessageType` enum
2. **Frontend Message Types**: Defined in `src/renderer/types-messages.ts` with `FrontendMessageType` enum
3. **Message Handlers**: Backend handles messages in `src/main.ts`, frontend in `src/renderer/message-handler.ts`
4. **Messenger Classes**: Use `src/send-to-frontend.ts` (backend) and `src/renderer/send-to-backend.ts` (frontend)

**Example Message Flow**:
```typescript
// Frontend sending to backend
sendMessageToBackend(BackendMessageType.addFreeTextQuestion, {
  conversation,
  question,
  includeEditorSelection
} as AddFreeTextQuestionMessage);

// Backend responding to frontend
this.frontendMessenger.sendAddMessage(chatMessage, conversationId);
```

### State Management Architecture
- **Redux Toolkit**: All frontend state managed through Redux store (`src/renderer/store/`)
- **Three Store Slices**:
  - `app.ts`: Extension settings, API status, models, translations
  - `conversation.ts`: Chat conversations and messages
  - `action.ts`: Smart actions (README generation, gitignore creation)
- **Typed Hooks**: Always use `useAppDispatch` and `useAppSelector` from `src/renderer/hooks.ts`

## File Structure & Naming Conventions

### Core Structure
```
src/
├── entry-point.ts          # Extension activation entry point
├── main.ts                 # Main backend controller (ChatGptViewProvider)
├── helpers.ts              # Backend utility functions
├── openai-api-provider.ts  # AI API abstraction layer
├── smart-action-runner.ts  # Complex AI-powered actions
├── send-to-frontend.ts     # Backend → Frontend messaging
├── renderer/               # React frontend code
│   ├── index.tsx          # React app entry point
│   ├── layout.tsx         # Main layout component
│   ├── hooks.ts           # Typed Redux hooks
│   ├── store.ts           # Redux store configuration
│   ├── types.ts           # Frontend type definitions
│   ├── types-messages.ts  # IPC message type definitions
│   ├── components/        # React components
│   ├── store/            # Redux slices
│   └── views/            # Page-level components
```

### File Naming
- **Components**: PascalCase (e.g., `ChatMessage.tsx`, `ModelSelect.tsx`)
- **Utilities**: kebab-case (e.g., `send-to-backend.ts`, `smart-action-runner.ts`)
- **Views**: lowercase (e.g., `chat.tsx`, `api.tsx`)

## Component & Code Patterns

### React Component Structure
```typescript
// Always use this pattern for components
import React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";

export default function ComponentName({
  prop1,
  prop2,
}: {
  prop1: string;
  prop2: Conversation;
}) {
  const dispatch = useAppDispatch();
  const someState = useAppSelector((state: RootState) => state.app.someValue);

  // Component logic here

  return (
    <div>
      {/* JSX here */}
    </div>
  );
}
```

### Backend Extension Pattern
- **Main Provider**: Extend `vscode.WebviewViewProvider` (see `src/main.ts`)
- **Message Handling**: Use switch statements with message types
- **Error Handling**: Always wrap async operations in try-catch
- **Configuration Access**: Use `vscode.workspace.getConfiguration('chatgpt')`

### Smart Actions Pattern
Smart actions are complex AI-powered operations that follow this pattern:
```typescript
class MyAction extends Action {
  public async run(
    systemContext: string,
    controller: AbortController
  ): Promise<void> {
    // 1. Validate workspace/requirements
    // 2. Gather necessary data
    // 3. Create AI prompt
    // 4. Stream AI response to file
    // 5. Handle completion/errors
  }
}
```

## API & Data Management

### OpenAI API Integration
- **Provider Class**: `ApiProvider` in `src/openai-api-provider.ts`
- **Model Support**: Supports OpenAI, Azure OpenAI, and OpenAI-compatible APIs
- **Streaming**: Uses `ai` SDK for streaming responses
- **Token Counting**: Uses `js-tiktoken` for accurate token estimation

### Configuration Management
- **Extension Settings**: Defined in `package.json` contributes.configuration
- **Type Safety**: Settings interface in `src/renderer/types.ts` must match `package.json`
- **Defaults**: Use `DEFAULT_EXTENSION_SETTINGS` constant for fallbacks

### Model Management
- **Model Types**: Defined in `src/renderer/types.ts`
- **Deprecation**: Handle model deprecation in `src/helpers.ts`
- **Reasoning Models**: Special handling for o1/o3 models (no system prompts, different streaming)

## Styling & UI Guidelines

### CSS Framework
- **TailwindCSS**: All styling uses Tailwind utility classes
- **Configuration**: Custom config in `styles/tailwind.config.js`
- **Theme**: VS Code theme-aware with CSS custom properties

### Component Styling
- **Responsive**: Use Tailwind responsive prefixes (`xs:`, `sm:`, etc.)
- **VS Code Integration**: Use VS Code color tokens (e.g., `text-foreground`, `bg-background`)
- **Consistent Spacing**: Follow existing spacing patterns (e.g., `gap-3.5`, `p-3`)

## Error Handling & Debugging

### Error Patterns
```typescript
// Backend error handling
try {
  await someAsyncOperation();
} catch (error) {
  console.error('[Reborn AI] Error description:', error);
  this.frontendMessenger.sendAddError(id, conversationId, error.message);
}

// Frontend error handling with Redux
catch (error) {
  dispatch(setActionError({
    actionId: actionId,
    error: error.message
  }));
}
```

### Logging Convention
- **Prefix**: Always use `[Reborn AI]` prefix in console logs
- **Structured**: Include operation context and relevant IDs
- **Levels**: Use appropriate console methods (error, warn, log)

## Testing & Build Patterns

### Build System
- **Install**: Use `yarn install --frozen-lockfile` (see `package.json`).
- **Backend**: ESBuild for extension code (`yarn esbuild-base`)
- **Frontend**: Webpack for React code (`yarn build-webview`)
- **Full Build**: `yarn build` chains the two scripts and refreshes `out/` bundles.
- **Watch Mode**: `yarn watch` runs both in parallel
- **Testing**: Use `yarn test` to exercise the VS Code test runner (`@vscode/test-cli`).
- **Headless Testing**: Add `xvfb-run -a` before `yarn test` when running in a headless environment to avoid X server errors.
- **Packaging**: `yarn package` delegates to `npx @vscode/vsce package`; VSCE will call the `vscode:prepublish` script during packaging so `out/` artifacts are rebuilt (see scripts in `package.json`).

### Package Management
- **Yarn**: Use Yarn; see packageManager in package.json and yarn-path in .yarnrc (under .yarn/releases/); avoid npm or pnpm
- **Node**: Match the Node version pinned in `.nvmrc`
- **Scripts**: Defined in `package.json`, use `yarn` prefix for all commands

## Extension-Specific Guidelines

### VS Code Integration
- **Commands**: Register in `package.json` contributes.commands
- **Menus**: Context menus defined in contributes.menus
- **Keybindings**: Defined in contributes.keybindings
- **Views**: Webview container in contributes.viewsContainers

### Localization
- **i18n Files**: Multiple `package.nls.*.json` files for different locales
- **Translation Loading**: `src/localization.ts` handles loading
- **Usage Pattern**: Access via Redux state `state.app.translations`

### Extension Settings
When adding new settings:
1. Add to `package.json` contributes.configuration
2. Update `ExtensionSettings` interface in `src/renderer/types.ts`
3. Update `DEFAULT_EXTENSION_SETTINGS` constant
4. Handle in settings update logic

### Action System
For new smart actions:
1. Add to `ActionNames` enum in `src/renderer/types.ts`
2. Create action class in `src/smart-action-runner.ts`
3. Register in `ActionRunner.getAction()` method
4. Add to Redux action slice in `src/renderer/store/action.ts`

## Security & Best Practices

### API Key Management
- **Storage**: Use VS Code's built-in secret storage
- **Validation**: Always validate API keys before use
- **Error Handling**: Graceful degradation for invalid keys

### Content Security
- **Sanitization**: Use `sanitize-html` for user content
- **XSS Prevention**: Escape HTML in markdown rendering
- **CSP**: Webview has strict content security policy

## Performance Considerations

### Throttling
- **Message Throttling**: Configurable UI update throttling (`settings.throttling`)
- **Streaming**: Use throttled updates for better performance during AI streaming
- **Memory**: Clean up event listeners and abort controllers

### Bundle Optimization
- **Code Splitting**: Separate backend and frontend bundles
- **External Dependencies**: Mark VS Code API as external in build
- **Minification**: Production builds are minified

---

## Common Patterns to Follow

### Adding a New Message Type
1. Define in `types-messages.ts` (both enum and interface)
2. Add handler in backend `main.ts` message switch
3. Add sender method in appropriate messenger class
4. Update frontend message handler if needed

### Adding a New Redux State
1. Define in appropriate store slice (`app.ts`, `conversation.ts`, or `action.ts`)
2. Create typed selectors and actions
3. Update initial state and reducers
4. Use typed hooks in components

### Adding a New Component
1. Create in appropriate folder (`components/`, `views/`)
2. Use PascalCase naming
3. Follow established prop typing patterns
4. Use Redux hooks for state management
5. Apply Tailwind styling consistently

This project follows VS Code extension best practices while maintaining clean separation between backend extension logic and frontend React UI. Always consider the dual-process nature when making changes.
