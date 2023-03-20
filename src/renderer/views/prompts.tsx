import React from "react";
import CustomPromptPanel from "../components/CustomPromptPanel";

export default function Prompts(props: {
  postMessage: (type: string, value: any, language?: string) => void;
}) {
  return <CustomPromptPanel />;
}
