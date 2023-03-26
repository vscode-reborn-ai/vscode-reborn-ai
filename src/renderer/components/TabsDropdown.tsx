import React from "react";
import { removeConversation } from "../actions/conversation";
import { useAppDispatch } from "../hooks";
import { Conversation } from "../types";
import Icon from "./Icon";

interface Tab {
  name: string;
  href: string;
}

interface Props {
  tabs: Tab[];
  currentConversation: Conversation;
  navigate: (href: string) => void;
  conversationList: Conversation[];
  createNewConversation: () => void;
  className?: string;
}

const Tabs: React.FC<Props> = ({
  tabs,
  currentConversation,
  navigate,
  conversationList,
  createNewConversation,
  className,
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

  return (
    <div className={`relative ${className}`} ref={parentRef}>
      <button
        className="flex-grow w-full flex items-center p-2 border border-menu text-xs rounded-md cursor-pointer hover:bg-menu-selection focus:outline-none focus:ring-tab-active"
        onClick={handleToggleOptions}
        ref={selectRef}
      >
        <span className="pl-1 flex-grow user-select-none text-start">
          {tabs.find((tab) => currentConversation.title === tab.name)?.name}
        </span>
        {/* down caret */}
        <Icon icon="caret-down" className="w-6 h-6 p-1" />
        <button
          type="button"
          className="block p-1 hover:text-white focus:outline-none hover:bg-opacity-40 hover:bg-red-900 focus:bg-menu-selection rounded-md"
          // Close the tab and remove it from the list
          onClick={(e) => {
            // Prevent the dropdown from opening
            e.stopPropagation();

            // navigate to the first tab
            // if there's no more chats, create a new one
            if (conversationList.length === 1) {
              createNewConversation();
            } else {
              navigate(
                `/chat/${encodeURI(
                  conversationList[0].id === currentConversation.id
                    ? conversationList[1].id
                    : conversationList[0].id
                )}`
              );
            }

            // remove the tab from the list
            dispatch(removeConversation(currentConversation.id));
          }}
        >
          <Icon icon="close" className="w-4 h-4" />
        </button>
      </button>
      {showOptions && (
        <div
          className="absolute z-10 w-full bg-menu shadow-lg border border-menu max-h-60 overflow-auto top-[2.3rem] left-0 rounded-b-md"
          role="menu"
        >
          {tabs.map((tab, index) => (
            <button
              key={index}
              role="menuitem"
              aria-selected={currentConversation.title === tab.name}
              onClick={() => handleSelectChange(tab)}
              ref={selectedTabRef}
              className={`w-full text-start py-2 px-2 text-xs bg-menu hover:bg-menu-selection focus:bg-menu-selection focus:underline cursor-pointer appearance-none ${
                currentConversation.title === tab.name
                  ? "bg-menu-selection font-semibold"
                  : ""
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

export default Tabs;
