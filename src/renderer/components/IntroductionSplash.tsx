import React from "react";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";
import Icon from "./Icon";

export default function ({ className }: { vscode: any; className?: string }) {
  const t = useAppSelector((state: RootState) => state.app.translations);

  return (
    <div
      className={`flex flex-col justify-center gap-3.5 h-[calc(100vh-12em)] items-center px-6 pt-2 pb-20 w-full relative login-screen overflow-auto ${className}`}
    >
      <div className="w-full flex justify-center flex-row items-center gap-2">
        <Icon icon="logo" className="w-16 h-16 fill-current" />
        <h2 className="text-lg font-bold">
          {/* TODO: remove from translation files */}
          {/* {t?.introductionSplash?.features?.title ?? "Features"} */}
          VSCode <br />
          Reborn AI
        </h2>
      </div>
      <ul className="w-full max-w-lg grid grid-cols-1 xs:grid-cols-2 gap-3.5 text-xs">
        <li className="features-li w-full border p-3 rounded-md text-center">
          {t?.introductionSplash?.features?.feature1 ??
            "Optimize, refactor, and debug your code"}
        </li>
        <li className="features-li w-full border p-3 rounded-md text-center">
          {t?.introductionSplash?.features?.feature2 ??
            "Create tests, READMEs, and more"}
        </li>
        <li className="features-li w-full border p-3 rounded-md text-center">
          {t?.introductionSplash?.features?.feature3 ??
            "Automatic syntax highlighting"}
        </li>
        <li className="features-li w-full border p-3 rounded-md text-center">
          {t?.introductionSplash?.features?.feature4 ??
            "Run multiple chats at once"}
        </li>
      </ul>
    </div>
  );
}
