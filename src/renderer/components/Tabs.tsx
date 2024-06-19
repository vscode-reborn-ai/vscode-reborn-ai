import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { addConversation, removeConversation } from "../store/conversation";
import { Conversation, Verbosity } from "../types";
import Icon from "./Icon";
import TabsDropdown from "./TabsDropdown";

// TODO: Create sub components to reuse tabs
export default function Tabs({
  conversationList,
  currentConversationId,
}: {
  conversationList: Conversation[];
  currentConversationId: string;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const t = useAppSelector((state: RootState) => state.app.translations);
  const location = useLocation();
  const [tabs, setTabs] = useState(
    [] as {
      name: string;
      id: string;
      href: string;
    }[]
  );
  const [currentConversation, setCurrentConversation] = useState(
    {} as Conversation
  );
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const tabListRef = React.useRef<HTMLUListElement>(null);
  const [showLocalLlmTab, setShowLocalLlmTab] = useState(false);

  useEffect(() => {
    if (location.pathname === "/api") {
      setShowLocalLlmTab(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (conversationList && conversationList.find) {
      setCurrentConversation(
        conversationList.find(
          (conversation) => conversation.id === currentConversationId
        ) ?? conversationList[0]
      );
    } else {
      console.warn(
        "[Reborn AI] conversationList is null",
        JSON.stringify(conversationList)
      );
    }
  }, [currentConversationId, conversationList]);

  useEffect(() => {
    // update the select element
    if (selectRef?.current) {
      selectRef.current.value = currentConversation.title ?? "Chat";
    }
  }, [currentConversation]);

  useEffect(() => {
    if (conversationList && conversationList.map) {
      setTabs([
        // { name: "Prompts", href: "/prompts" id: "prompts" },
        // { name: "Actions", href: "/actions" id: "actions" },
        ...conversationList.map((conversation) => ({
          name: conversation.title ?? "Chat",
          id: conversation.id,
          href: `/chat/${encodeURI(conversation.id)}`,
        })),
      ]);
    } else {
      console.warn(
        "[Reborn AI] conversationList is null",
        JSON.stringify(conversationList)
      );
    }
  }, [conversationList]);

  const createNewConversation = () => {
    let title = "Chat";
    let i = 2;
    while (
      conversationList.find((conversation) => conversation.title === title)
    ) {
      title = `Chat ${i}`;
      i++;
    }

    const newConversation = {
      id: `${title}-${Date.now()}`,
      title,
      messages: [],
      inProgress: false,
      createdAt: Date.now(),
      model: currentConversation.model,
      autoscroll: true,
      verbosity:
        settings?.verbosity ??
        currentConversation?.verbosity ??
        Verbosity.normal,
    } as Conversation;

    dispatch(addConversation(newConversation));

    // switch to the new conversation
    navigate(`/chat/${encodeURI(newConversation.id)}`);

    // scroll all the way to the right on delay to allow the tab to render
    setTimeout(() => {
      if (tabListRef.current) {
        tabListRef.current.scrollLeft = tabListRef.current.scrollWidth;
      }
    }, 100);
  };

  return (
    <>
      {/* Tab layout specifically for a skinny UI (switches to dropdown) or when the tab count exceeds 5 */}
      <div className={`${tabs.length > 5 ? "" : "2xs:hidden"}`}>
        <label htmlFor="tabs" className="sr-only">
          {t?.tabs?.sr_label ?? "Select a tab"}
        </label>
        <div className="flex flex-row divide-x divide-tab border-b border-tab">
          <TabsDropdown
            tabs={tabs}
            currentConversation={currentConversation}
            conversationList={conversationList}
            navigate={navigate}
            createNewConversation={createNewConversation}
            className="flex-grow"
          />
          {/* button for new chat */}
          <button
            className="flex gap-x-2 items-center bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap p-2 pr-3 text-2xs"
            onClick={createNewConversation}
          >
            <Icon icon="plus" className="w-4 h-4" />
            {t?.tabs?.new_chat ?? "New"}
          </button>
        </div>
      </div>
      {/* Wider tab layout */}
      <div className={`${tabs.length > 5 ? "hidden" : "hidden 2xs:block"}`}>
        <nav className="flex justify-between border-b border-tab-editor-focus">
          <ul
            ref={tabListRef}
            className="flex overflow-x-auto divide-x divide-tab"
            aria-label="Tabs"
          >
            {/* /api */}
            <li>
              <Link
                className={classNames(
                  location.pathname === "/api"
                    ? "border-secondary bg-tab-active text-tab-active-unfocused hover:text-tab-active focus-within:text-tab-active focus-within:bg-tab-active"
                    : "border-transparent bg-tab-inactive hover:bg-tab-selection hover:text-tab-inactive text-tab-active-unfocused focus-within:text-tab-inactive focus-within:bg-tab-selection",
                  "h-full flex items-center gap-x-1 py-1 pl-2 pr-1 group whitespace-nowrap text-2xs focus:outline-none",
                  {
                    hidden: !showLocalLlmTab,
                  }
                )}
                to="/api"
                aria-current={location.pathname === "/api" ? "page" : undefined}
              >
                <span className="pt-0.5">⚙️ Local LLM Settings</span>
                {/* close tab button */}
                <button
                  className={classNames(
                    "ml-2 p-0.5 group-hover:opacity-100 group-focus-within:opacity-100 focus:outline-none hover:bg-opacity-40 hover:bg-button-secondary focus:bg-button-secondary rounded",
                    location.pathname === "/api" ? "opacity-100" : "opacity-0"
                  )}
                  onClick={(e) => {
                    e.preventDefault();

                    // If there's no conversations, create a new one
                    if (conversationList.length === 0) {
                      createNewConversation();
                    }

                    // Navigate to the first conversation
                    navigate(`/chat/${encodeURI(conversationList[0].id)}`);

                    // Hide the tab
                    setShowLocalLlmTab(false);
                  }}
                >
                  <Icon icon="close" className="w-4 h-4" />
                  <span className="sr-only">
                    {t?.tabs?.close_tab ?? "Close tab"}
                  </span>
                </button>
              </Link>
            </li>
            {tabs &&
              tabs.map((tab) => (
                <li key={tab.id}>
                  <Link
                    className={classNames(
                      location.pathname === `/chat/${encodeURI(tab.id)}`
                        ? "bg-tab-active focus-within:bg-tab-active"
                        : "bg-tab-inactive hover:bg-tab-selection focus-within:bg-tab-selection",
                      "h-full flex items-center group whitespace-nowrap text-2xs focus:outline-none"
                    )}
                    to={tab.href}
                    aria-current={
                      location.pathname === `/chat/${encodeURI(tab.id)}`
                        ? "page"
                        : undefined
                    }
                  >
                    <span
                      className={classNames(
                        "flex items-center gap-x-1 py-1 pl-2 pr-1",
                        location.pathname === `/chat/${encodeURI(tab.id)}`
                          ? "text-tab-active hover:text-tab-active focus-within:text-tab-active"
                          : "hover:text-tab-inactive text-tab-active-unfocused focus-within:text-tab-inactive"
                      )}
                    >
                      <span className="pt-0.5">{tab.name}</span>
                      {/* close tab button */}
                      {tab.name !== "Prompts" && tab.name !== "Actions" && (
                        <button
                          className={classNames(
                            "ml-2 p-0.5 group-hover:opacity-100 group-focus-within:opacity-100 focus:outline-none hover:bg-opacity-40 hover:bg-button-secondary focus:bg-button-secondary rounded",
                            location.pathname === `/chat/${encodeURI(tab.id)}`
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                          onClick={(e) => {
                            e.preventDefault();

                            // navigate to the first tab
                            // if there's no more chats, create a new one
                            if (conversationList.length === 1) {
                              createNewConversation();
                            } else if (currentConversation.title === tab.name) {
                              navigate(
                                `/chat/${encodeURI(
                                  conversationList[0].id === tab.id
                                    ? conversationList[1].id
                                    : conversationList[0].id
                                )}`
                              );
                            }

                            // remove the tab from the list
                            dispatch(removeConversation(tab.id));
                          }}
                        >
                          <Icon icon="close" className="w-4 h-4" />
                          <span className="sr-only">
                            {t?.tabs?.close_tab ?? "Close tab"}
                          </span>
                        </button>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            {/* create new chat button */}
            <li className="flex items-center sticky right-0">
              <button
                className="flex gap-x-1 bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap py-2 pl-2 pr-3 text-2xs"
                onClick={createNewConversation}
              >
                <Icon icon="plus" className="w-4 h-4" />
                {t?.tabs?.new_chat ?? "New"}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
