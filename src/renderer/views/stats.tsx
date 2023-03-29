import React from "react";
import { useAppSelector } from "../hooks";

export default function Stats({ vscode }: { vscode: any }) {
  const t = useAppSelector((state: any) => state.app.translations);

  return <div>{t?.stats?.title ?? "Stats"}</div>;
}
