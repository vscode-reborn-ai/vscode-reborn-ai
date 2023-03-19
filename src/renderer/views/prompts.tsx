import React from "react";
import CustomPromptPanel from "../components/CustomPromptPanel";
import { getVSCodeAPI } from "../utils";

export default function Prompts() {
  const vscode = getVSCodeAPI();

  return <CustomPromptPanel />;
}
