import React from "react";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";

export default function Stats({ vscode }: { vscode: any }) {
  const t = useAppSelector((state: RootState) => state.app.translations);

  return <div>{t?.stats?.title ?? "Stats"}</div>;
}
