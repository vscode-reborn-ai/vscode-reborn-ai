import React from "react";
import CustomPromptPanel from "../components/CustomPromptPanel";
import { useAppSelector } from "../hooks";

export default function Prompts({ vscode }: { vscode: any }) {
  const t = useAppSelector((state: any) => state.app.translations);

  return <CustomPromptPanel />;
}
