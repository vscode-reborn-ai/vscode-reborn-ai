import React from "react";
import { useAppSelector } from "../hooks";
import Icon from "./Icon";

export default function ({
  vscode,
  className,
}: {
  vscode: any;
  className?: string;
}) {
  const chatGPTModels = useAppSelector((state: any) => state.app.chatGPTModels);
  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const t = useAppSelector((state: any) => state.app.translations);
  const [ignoreWarningScreen, setIgnoreWarningScreen] = React.useState(true);

  // Ignore warning screen for 3 seconds as the extension gets what models are available
  // and then show the warning screen if there are no models available
  React.useEffect(() => {
    setTimeout(() => {
      setIgnoreWarningScreen(false);
    }, 3000);
  }, []);

  return (
    <div
      className={`flex flex-col justify-start gap-3.5 h-full items-center px-6 pt-2 pb-24 w-full relative login-screen overflow-auto ${className}`}
    >
      <div className="flex flex-row items-center gap-2">
        <Icon icon="zap" className="w-8 h-8" />
        <h2 className="text-lg font-bold">
          {t?.introductionSplash?.features?.title ?? "Features"}
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
      {!settings?.minimalUI && (
        <p className="max-w-sm text-center text-[0.7rem] self-center">
          {t?.introductionSplash?.discontinued1 ??
            "This is an API-only fork of "}{" "}
          <a href="https://github.com/gencay">@gencay's</a>
          {t?.introductionSplash?.discontinued ?? "discontinued"}{" "}
          <a
            className="whitespace-nowrap"
            href="https://github.com/gencay/vscode-chatgpt"
          >
            {t?.introductionSplash?.discontinued2 ??
              "VSCode-ChatGPT extension."}
          </a>
        </p>
      )}
    </div>
  );
}
