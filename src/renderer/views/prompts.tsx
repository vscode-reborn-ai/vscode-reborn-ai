import React from "react";
import CustomPromptPanel from "../components/CustomPromptPanel";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";

export default function Prompts({ vscode }: { vscode: any }) {
  const t = useAppSelector((state: RootState) => state.app.translations);

  return <CustomPromptPanel />;
}
