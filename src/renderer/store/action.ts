import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActionNames } from "../types";

export enum ActionRunState {
  running = "running",
  error = "error",
  success = "success",
  idle = "idle",
}

export interface Action {
  id: string;
  name: string;
  description: string;
  tags: string[];
  state: ActionRunState;
  error?: string;
}

export interface ActionState {
  actionList: Action[];
}

// TODO: i18n
const initialState: ActionState = {
  actionList: [
    {
      id: ActionNames.createReadmeFromPackageJson,
      name: "Generate README.md from package.json",
      description: "Creates a README.md file based on the contents of package.json",
      tags: ["javascript"],
      state: ActionRunState.idle,
    },
    {
      id: ActionNames.createReadmeFromFileStructure,
      name: "Generate README.md from file structure",
      description: "Creates a README.md file based on the files/folders present. Does not open files.",
      tags: [],
      state: ActionRunState.idle,
    },
    {
      id: ActionNames.createGitignore,
      name: "Generate .gitignore",
      description: "Creates a .gitignore file based on the file structure and the package.json if present.",
      tags: ["javascript"],
      state: ActionRunState.idle,
    },
  ],
};

export const appSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setActionError: (state: any, action: PayloadAction<{
      actionId: string;
      error: string;
    }>) => {
      const { actionId, error } = action.payload;
      const actionIndex = state.actionList.findIndex((action: Action) => action.id === actionId);

      state.actionList[actionIndex].state = ActionRunState.error;
      state.actionList[actionIndex].error = error;
    },
    clearActionErrors: (state) => {
      // Remove errors and set all actions to idle
      state.actionList.forEach((action) => {
        if (action.state === ActionRunState.error) {
          action.state = ActionRunState.idle;
          delete action.error;
        }
      });
    },
    clearActionError: (state, action: PayloadAction<string>) => {
      const actionId = action.payload;
      const actionIndex = state.actionList.findIndex((action) => action.id === actionId);

      if (state.actionList[actionIndex].state === ActionRunState.error) {
        state.actionList[actionIndex].state = ActionRunState.idle;
        delete state.actionList[actionIndex].error;
      }
    },
    setActionState: (state, action: PayloadAction<{
      actionId: string;
      state: ActionRunState;
    }>) => {
      const { actionId, state: newState } = action.payload;
      const actionIndex = state.actionList.findIndex((action) => action.id === actionId);

      // Some actions are not in the list (ie set convo title)
      // TODO: Separate UI actions from backend actions
      if (actionIndex >= 0) {
        state.actionList[actionIndex].state = newState;
      }
    },
  },
});

export const {
  setActionError,
  clearActionErrors,
  clearActionError,
  setActionState,
} = appSlice.actions;

export default appSlice.reducer;