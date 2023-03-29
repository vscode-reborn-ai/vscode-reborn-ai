import React from "react";
import { useAppSelector } from "../hooks";

export default function Options({ vscode }: { vscode: any }) {
  const t = useAppSelector((state: any) => state.app.translations);

  return <div>{t?.options?.title ?? "Options"}</div>;
}
