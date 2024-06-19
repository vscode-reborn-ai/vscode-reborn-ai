import React from "react";
import ApiKeySetup from "../components/ApiKeySetup";

export default function OpenAISetup({ vscode }: { vscode: any }) {
  return (
    <div className="overflow-y-auto">
      <ApiKeySetup vscode={vscode} />
    </div>
  );
}
