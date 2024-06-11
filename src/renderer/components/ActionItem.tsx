import React from "react";
import { useAppDispatch } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import {
  Action,
  ActionRunState,
  clearActionError,
  setActionState,
} from "../store/action";
import Icon from "./Icon";

interface Props {
  vscode: any;
  action: Action;
}

const ActionItem: React.FC<Props> = ({ vscode, action }) => {
  const dispatch = useAppDispatch();
  const backendMessenger = useMessenger(vscode);

  const handleClick = () => {
    // Reset error
    if (action.state === ActionRunState.error) {
      dispatch(clearActionError(action.id));
    }

    if (action.state === ActionRunState.running) {
      dispatch(
        setActionState({ actionId: action.id, state: ActionRunState.idle })
      );

      backendMessenger.sendStopAction(action.id);
    } else if (action.state === ActionRunState.idle) {
      dispatch(
        setActionState({ actionId: action.id, state: ActionRunState.running })
      );

      backendMessenger.sendRunAction(action.id);
    }
  };

  return (
    <div className="relative flex items-center space-x-3 px-6 py-3 focus-within:ring-2 focus-within:ring-inset hover:bg-menu">
      <div className="min-w-0 flex-1 flex sm:flex-row flex-col gap-2">
        <header className="flex flex-col flex-1">
          <h3 className="text-md font-medium text-menu my-0">{action.name}</h3>
          <p className="truncate text-xs text my-0 opacity-75">
            {action.description}
          </p>
          {action.error && (
            <div className="py-1 px-2 bg-red-600 bg-opacity-20 text mt-2 rounded">
              <header className="flex justify-between items-center">
                <p className="font-bold">{action.error}</p>
                <button
                  type="button"
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-button-secondary bg-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2"
                  onClick={() => {
                    dispatch(clearActionError(action.id));
                  }}
                >
                  Hide
                </button>
              </header>
            </div>
          )}
        </header>
        <div className="">
          <button
            type="button"
            className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-button-secondary hover:text-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              action.state === ActionRunState.running
                ? "bg-transparent border border-red-700 hover:bg-red-700 hover:text-white"
                : "bg-button-secondary hover:bg-button-secondary-hover "
            }`}
            onClick={handleClick}
          >
            {action.state === ActionRunState.running ? (
              <div className="flex gap-x-2">
                <Icon icon="ripple" className="animate-spin h-4 w-4" />
                Stop
              </div>
            ) : (
              <div className="flex gap-x-2">
                Run
                <Icon icon="send" className="h-4 w-4" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionItem;
