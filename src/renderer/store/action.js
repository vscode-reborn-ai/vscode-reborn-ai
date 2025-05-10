import { createSlice } from '@reduxjs/toolkit';
import { ActionNames } from "../types";
export var ActionRunState;
(function (ActionRunState) {
    ActionRunState["running"] = "running";
    ActionRunState["error"] = "error";
    ActionRunState["success"] = "success";
    ActionRunState["idle"] = "idle";
})(ActionRunState || (ActionRunState = {}));
// TODO: i18n
const initialState = {
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
        setActionError: (state, action) => {
            const { actionId, error } = action.payload;
            const actionIndex = state.actionList.findIndex((action) => action.id === actionId);
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
        clearActionError: (state, action) => {
            const actionId = action.payload;
            const actionIndex = state.actionList.findIndex((action) => action.id === actionId);
            if (state.actionList[actionIndex].state === ActionRunState.error) {
                state.actionList[actionIndex].state = ActionRunState.idle;
                delete state.actionList[actionIndex].error;
            }
        },
        setActionState: (state, action) => {
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
export const { setActionError, clearActionErrors, clearActionError, setActionState, } = appSlice.actions;
export default appSlice.reducer;
//# sourceMappingURL=action.js.map