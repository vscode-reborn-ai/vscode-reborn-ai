import React from "react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  //   { name: "Options", href: "/options", count: "4" },
  { name: "Prompts", href: "/prompts" },
  { name: "Chat 1", href: "/" },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Tabs() {
  const location = useLocation();
  const [currentTabName, setCurrentTabName] = React.useState(
    tabs.find((tab) => location.pathname === tab.href)?.name
  );

  React.useEffect(() => {
    setCurrentTabName(tabs.find((tab) => location.pathname === tab.href)?.name);
  }, [location]);

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md py-2 pl-3 pr-10 text-base focus:border-tab-active focus:outline-none focus:ring-tab-active sm:text-sm"
          defaultValue={tabs.find((tab) => currentTabName === tab.name)?.name}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b">
          <nav className="-mb-px flex space-x-2" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                to={tab.href}
                className={classNames(
                  currentTabName === tab.name
                    ? "bg-tab border-tab text-tab-active-fg"
                    : "bg-tab-inactive-unfocused border-tab-inactive-border text-tab-inactive-unfocused hover:bg-tab-inactive hover:text-tab-inactive",
                  "flex whitespace-nowrap border-b-2 py-2 px-4 text-xs"
                )}
                aria-current={currentTabName === tab.name ? "page" : undefined}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
