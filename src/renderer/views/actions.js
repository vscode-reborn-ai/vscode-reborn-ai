import React from "react";
import ActionItem from "../components/ActionItem";
import { useAppSelector } from "../hooks";
export default function Actions({ vscode }) {
    const t = useAppSelector((state) => state.app.translations);
    const actions = useAppSelector((state) => state.action.actionList);
    return (React.createElement("div", { className: "h-full overflow-y-auto flex flex-col" },
        React.createElement("ul", { role: "list", className: "relative z-0 divide-y divide-menu" }, actions.map((action, index) => (React.createElement("li", { key: `action-${index}`, className: "bg" },
            React.createElement(ActionItem, { vscode: vscode, action: action })))))));
}
//# sourceMappingURL=actions.js.map