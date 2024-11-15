import React from "react";
import { useAppDispatch } from "../hooks";
import { removeConversation } from "../store/conversation";
import Icon from "./Icon";
import { Tab } from "./Tabs";

const TabsDropdown = ({
  tabList,
  currentTabId,
  navigate,
  createNewConversation,
  className,
}: {
  tabList: Tab[];
  currentTabId: string;
  navigate: (href: string) => void;
  createNewConversation: () => void;
  className?: string;
}) => {
  const dispatch = useAppDispatch();
  const selectedTabRef = React.useRef<HTMLButtonElement>(null);
  const selectRef = React.useRef<HTMLButtonElement>(null);
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = React.useState(false);

  const handleToggleOptions = React.useCallback(() => {
    setShowOptions((prevShowOptions) => !prevShowOptions);

    // put focus inside the select option list
    // hard coded timeout to wait for the dropdown to open
    setTimeout(() => {
      if (selectedTabRef.current) {
        selectedTabRef.current.focus();
      }
    }, 200);
  }, []);

  const handleSelectChange = React.useCallback(
    (selectedTab: Tab) => {
      if (selectedTab) {
        navigate(selectedTab.href);
        setShowOptions(false);
      }
    },
    [navigate]
  );

  const closeTab = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent the dropdown from opening
      e.stopPropagation();

      // navigate to the first tab
      // if there's no more chats, create a new one
      if (tabList.length === 1) {
        createNewConversation();
      } else {
        navigate(
          `/chat/${encodeURI(
            tabList[0].id === currentTabId ? tabList[1].id : tabList[0].id
          )}`
        );
      }

      // remove the tab from the list
      dispatch(removeConversation(currentTabId));
    },
    [dispatch, currentTabId, createNewConversation, navigate]
  );

  return (
    <div className={`relative ${className}`} ref={parentRef}>
      <button
        className="flex-grow w-full flex items-center px-2 py-1 border-b border-menu text-xs cursor-pointer hover:bg-menu-selection focus:outline-none focus:ring-tab-active"
        onClick={handleToggleOptions}
        ref={selectRef}
      >
        <span className="pl-1 flex-grow user-select-none text-start">
          {tabList.find((tab) => currentTabId === tab.name)?.name}
        </span>
        {/* down caret */}
        <Icon icon="caret-down" className="w-6 h-6 p-1" />
        <button
          type="button"
          className="block p-1 hover:text-white focus:outline-none hover:bg-opacity-40 hover:bg-button-secondary focus:bg-button-secondary rounded"
          // Close the tab and remove it from the list
          onClick={closeTab}
        >
          <Icon icon="close" className="w-4 h-4" />
        </button>
      </button>
      {showOptions && (
        <div
          className="absolute z-10 w-full bg-menu shadow-lg border border-menu max-h-60 overflow-auto top-8 left-0"
          role="menu"
        >
          {tabList.map((tab, index) => (
            <button
              key={index}
              role="menuitem"
              aria-selected={currentTabId === tab.id}
              onClick={() => handleSelectChange(tab)}
              ref={selectedTabRef}
              className={`w-full text-start py-2 px-2 text-xs bg-menu hover:bg-menu-selection focus:bg-menu-selection focus:underline cursor-pointer appearance-none ${
                currentTabId === tab.id ? "bg-menu-selection font-semibold" : ""
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabsDropdown;
