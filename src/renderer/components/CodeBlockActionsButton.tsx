import React from "react";
import Icon from "./Icon";

export default function CodeBlockActionsButton({
  vscode,
  codeTextContent,
  iconName,
  tooltipContent,
  onClick,
  buttonText,
  buttonSuccessText,
}: {
  vscode: any;
  codeTextContent: string;
  iconName?: string;
  tooltipContent: string;
  onClick: () => void;
  buttonText: string;
  buttonSuccessText: string;
}) {
  const [showSuccess, setShowSuccess] = React.useState(false);

  return (
    <button
      data-tooltip-id="code-actions-tooltip"
      data-tooltip-content={tooltipContent}
      className={`code-element-ext px-1 py-0.5 flex gap-x-1 justify-center items-center rounded border
            bg-menu hover:bg-menu-selection
            ${showSuccess ? "text-green-500 border-green-500" : ""}
          `}
      onClick={() => {
        try {
          onClick();
          setShowSuccess(true);

          setTimeout(() => {
            setShowSuccess(false);
          }, 2000);
        } catch (error) {
          console.error(error);
        }
      }}
    >
      {showSuccess ? (
        <>
          {iconName && <Icon icon="check" className="w-4 h-4" />}
          <span className="mt-0.5 mr-0.5">{buttonSuccessText}</span>
        </>
      ) : (
        <>
          {iconName && <Icon icon={iconName} className="w-4 h-4" />}
          <span className="mt-0.5 mr-0.5">{buttonText}</span>
        </>
      )}
    </button>
  );
}
