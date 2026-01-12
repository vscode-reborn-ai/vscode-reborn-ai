import * as assert from 'assert';
import { DEFAULT_EXTENSION_SETTINGS, Model, ReasoningEffort, Verbosity } from '../types';
import actionReducer, {
  ActionRunState,
  clearActionError,
  clearActionErrors,
  setActionError,
  setActionState,
} from './action';
import appReducer, {
  ApiKeyStatus,
  setApiKeyStatus,
  setDebug,
  setExtensionSettings,
  setModels,
  setTranslations,
  setUseEditorSelection,
  setViewOptions,
  toggleViewOption,
} from './app';
import conversationReducer, {
  addConversation,
  addMessage,
  clearMessages,
  removeMessage,
  setCurrentConversationId,
  setModel,
  setReasoningEffort,
  setVerbosity,
  updateConversationMessages,
  updateConversationTokenCount,
  updateMessage,
  updateMessageContent,
} from './conversation';

const createModel = (id: string): Model => ({
  id,
  owned_by: 0 as any,
  created: Date.now(),
  object: 'model',
});

suite('App reducer', () => {
  test('toggles view options and merges defaults', () => {
    const initial = appReducer(undefined, { type: 'INIT' } as any);

    const toggled = appReducer(initial, toggleViewOption('showMarkdown'));
    assert.strictEqual(toggled.viewOptions.showMarkdown, !initial.viewOptions.showMarkdown);

    const withCustom = appReducer(initial, setViewOptions({ showMarkdown: true }));
    assert.strictEqual(withCustom.viewOptions.showMarkdown, true);
    assert.strictEqual(withCustom.viewOptions.showClear, initial.viewOptions.showClear);
  });

  test('sets top-level flags and settings', () => {
    const state1 = appReducer(undefined, setDebug(true));
    assert.strictEqual(state1.debug, true);

    const state2 = appReducer(state1, setApiKeyStatus(ApiKeyStatus.Valid));
    assert.strictEqual(state2.apiKeyStatus, ApiKeyStatus.Valid);

    const newSettings = { ...DEFAULT_EXTENSION_SETTINGS, custom: 'x' } as any;
    const state3 = appReducer(state2, setExtensionSettings({ newSettings }));
    assert.deepStrictEqual(state3.extensionSettings, newSettings);

    const models = [createModel('m1')];
    const state4 = appReducer(state3, setModels({ models }));
    assert.deepStrictEqual(state4.models, models);

    const state5 = appReducer(state4, setTranslations({ hello: 'world' }));
    assert.deepStrictEqual(state5.translations, { hello: 'world' });

    const state6 = appReducer(state5, setUseEditorSelection(true));
    assert.strictEqual(state6.useEditorSelection, true);
  });
});

suite('Action reducer', () => {
  test('sets and clears errors', () => {
    const initial = actionReducer(undefined, { type: 'INIT' } as any);
    const actionId = initial.actionList[0].id;

    const errored = actionReducer(initial, setActionError({ actionId, error: 'boom' }));
    assert.strictEqual(errored.actionList[0].state, ActionRunState.error);
    assert.strictEqual(errored.actionList[0].error, 'boom');

    const cleared = actionReducer(errored, clearActionError(actionId));
    assert.strictEqual(cleared.actionList[0].state, ActionRunState.idle);
    assert.strictEqual(cleared.actionList[0].error, undefined);

    const resetAll = actionReducer(errored, clearActionErrors());
    assert.strictEqual(resetAll.actionList[0].state, ActionRunState.idle);
  });

  test('updates action state when present', () => {
    const initial = actionReducer(undefined, { type: 'INIT' } as any);
    const actionId = initial.actionList[1].id;

    const updated = actionReducer(initial, setActionState({ actionId, state: ActionRunState.running }));
    assert.strictEqual(updated.actionList[1].state, ActionRunState.running);
  });
});

suite('Conversation reducer', () => {
  const baseState = conversationReducer(undefined, { type: 'INIT' } as any);
  const conversationId = baseState.currentConversationId!;

  test('adds messages and keeps current conversation in sync', () => {
    const message = { id: 'm1', role: 'user', content: 'hi', rawContent: 'hi' } as any;
    const state1 = conversationReducer(baseState, addMessage({ conversationId, message }));

    assert.strictEqual(state1.conversations[conversationId].messages.length, 1);
    assert.strictEqual(state1.currentConversation?.messages.length, 1);
  });

  test('updates conversation-level fields', () => {
    const model = createModel('model-1');
    const state1 = conversationReducer(baseState, setModel({ conversationId, model }));
    assert.deepStrictEqual(state1.conversations[conversationId].model, model);

    const state2 = conversationReducer(state1, setReasoningEffort({ conversationId, reasoningEffort: ReasoningEffort.Low }));
    assert.strictEqual(state2.conversations[conversationId].reasoningEffort, ReasoningEffort.Low);

    const state3 = conversationReducer(state2, setVerbosity({ conversationId, verbosity: Verbosity.normal }));
    assert.strictEqual(state3.conversations[conversationId].verbosity, Verbosity.normal);
  });

  test('updates message lists in bulk and clears', () => {
    const messages = [
      { id: 'm1', role: 'user', content: 'hi', rawContent: 'hi' } as any,
      { id: 'm2', role: 'assistant', content: 'yo', rawContent: 'yo' } as any,
    ];

    const state1 = conversationReducer(baseState, updateConversationMessages({ conversationId, messages }));
    assert.strictEqual(state1.conversations[conversationId].messages.length, 2);

    const state2 = conversationReducer(state1, clearMessages({ conversationId }));
    assert.strictEqual(state2.conversations[conversationId].messages.length, 0);
  });

  test('switches current conversation id', () => {
    const newConversation = { ...baseState.currentConversation!, id: 'other', messages: [] } as any;
    const state1 = conversationReducer(baseState, addConversation(newConversation));
    const state2 = conversationReducer(state1, setCurrentConversationId({ conversationId: 'other' }));

    assert.strictEqual(state2.currentConversationId, 'other');
    assert.strictEqual(state2.currentConversation?.id, 'other');
  });

  test('updateMessage updates existing message by id', () => {
    const initialMessage = { id: 'm1', role: 'user', content: 'hi', rawContent: 'hi' } as any;
    const state1 = conversationReducer(baseState, addMessage({ conversationId, message: initialMessage }));

    const updated = { ...initialMessage, content: 'hello' } as any;
    const state2 = conversationReducer(state1, updateMessage({ conversationId, message: updated }));

    assert.strictEqual(state2.conversations[conversationId].messages[0].content, 'hello');
    assert.strictEqual(state2.currentConversation?.messages[0].content, 'hello');
  });

  test('updateMessageContent sets rawContent/done and flips inProgress', () => {
    const message = { id: 'm1', role: 'assistant', content: 'draft', rawContent: 'draft' } as any;
    const state1 = conversationReducer(baseState, addMessage({ conversationId, message }));

    const state2 = conversationReducer(state1, updateMessageContent({ conversationId, messageId: 'm1', content: 'stream', rawContent: 'stream', done: false }));
    assert.strictEqual(state2.conversations[conversationId].messages[0].content, 'stream');
    assert.strictEqual(state2.conversations[conversationId].messages[0].rawContent, 'stream');
    assert.strictEqual(state2.conversations[conversationId].inProgress, true);

    const state3 = conversationReducer(state2, updateMessageContent({ conversationId, messageId: 'm1', content: 'final', rawContent: 'final', done: true }));
    assert.strictEqual(state3.conversations[conversationId].messages[0].done, true);
    assert.strictEqual(state3.conversations[conversationId].inProgress, false);
  });

  test('removeMessage deletes by id and keeps current conversation in sync', () => {
    const msg1 = { id: 'm1', role: 'user', content: 'hi', rawContent: 'hi' } as any;
    const msg2 = { id: 'm2', role: 'assistant', content: 'yo', rawContent: 'yo' } as any;
    const state1 = conversationReducer(baseState, updateConversationMessages({ conversationId, messages: [msg1, msg2] }));

    const state2 = conversationReducer(state1, removeMessage({ conversationId, messageId: 'm1' }));
    assert.deepStrictEqual(state2.conversations[conversationId].messages.map(m => m.id), ['m2']);
    assert.deepStrictEqual(state2.currentConversation?.messages.map(m => m.id), ['m2']);
  });

  test('updateConversationTokenCount stores token metrics', () => {
    const tokenCount = { messages: 10, userInput: 3, minTotal: 13 };
    const state1 = conversationReducer(baseState, updateConversationTokenCount({ conversationId, tokenCount }));
    assert.deepStrictEqual(state1.conversations[conversationId].tokenCount, tokenCount);
  });
});
