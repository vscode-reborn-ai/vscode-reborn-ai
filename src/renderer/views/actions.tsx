import React from "react";
import ActionItem from "../components/ActionItem";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";
import { Action } from "../store/action";

export default function Actions({ vscode }: { vscode: any }) {
  const t = useAppSelector((state: RootState) => state.app.translations);
  const actions = useAppSelector((state: RootState) => state.action.actionList);

  return (
    <div className="pt-16 h-full overflow-y-auto flex flex-col">
      <ul role="list" className="relative z-0 divide-y divide-menu">
        {/* @ts-ignore */}
        {actions.map((action: Action, index: React.Key | null | undefined) => (
          <li key={`action-${index}`} className="bg">
            <ActionItem vscode={vscode} action={action} />
          </li>
        ))}
      </ul>
      {/*
      {actionList errors.length > 0 && (
        <div className="fixed bottom-0 w-full p-4 bg-red-600 bg-opacity-20 text">
          <header className="flex justify-between items-center">
            <h2 className="text-lg font-bold">
              Errors <span className="text-xs">({errors.length})</span>
            </h2>
            <button
              type="button"
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-button-secondary bg-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2"
              onClick={() => setErrors([])}
            >
              Close
            </button>
          </header>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      */}
    </div>
  );
}
