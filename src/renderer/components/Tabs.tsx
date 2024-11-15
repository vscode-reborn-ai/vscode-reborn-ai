import classNames from "classnames";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { selectVerbosity } from "../store/app";
import {
  addConversation,
  removeConversation,
  selectConversationList,
  selectCurrentConversation,
  selectCurrentConversationId,
  selectCurrentModel,
} from "../store/conversation";
import { Conversation } from "../types";
import Icon from "./Icon";
import TabsDropdown from "./TabsDropdown";

export interface Tab {
  name: string;
  id: string;
  href: string;
}

// Subcomponent for the "Close" button
function TabCloseButton({
  path,
  onClick,
}: {
  path: string;
  onClick: Function;
}) {
  const location = useLocation();
  const t = useAppSelector((state: RootState) => state.app.translations);

  return (
    <button
      className={classNames(
        "ml-2 p-0.5 group-hover:opacity-100 group-focus-within:opacity-100 focus:outline-none hover:bg-opacity-40 hover:bg-button-secondary hover:text-button-secondary focus:bg-button-secondary focus:text-button-secondary rounded",
        location.pathname === path ? "opacity-100" : "opacity-0"
      )}
      onClick={(e) => {
        e.preventDefault();

        onClick(e);
      }}
    >
      <Icon icon="close" className="w-4 h-4" />
      <span className="sr-only">{t?.tabs?.close_tab ?? "Close tab"}</span>
    </button>
  );
}

// Subcomponent for the "Link" tab
function TabLink({
  tab,
  closeTab,
  createNewConversation,
}: {
  tab: Tab;
  closeTab: Function;
  createNewConversation: any;
}) {
  const location = useLocation();

  return (
    <li key={tab.id}>
      <Link
        className={classNames(
          "border-t h-full flex items-center group whitespace-nowrap text-2xs focus:outline-none focus:underline",
          location.pathname === `/chat/${encodeURI(tab.id)}`
            ? "border-t-tab-editor-focus bg-tab-active focus-within:bg-tab-active"
            : "border-t-tab-inactive bg-tab-inactive hover:bg-tab-selection focus-within:bg-tab-selection"
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
          <TabCloseButton
            path={`/chat/${encodeURI(tab.id)}`}
            onClick={closeTab.bind(null, tab)}
          />
        </span>
      </Link>
    </li>
  );
}

export default React.memo(function Tabs({}: {}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const t = useAppSelector((state: RootState) => state.app.translations);
  const location = useLocation();
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const tabListRef = React.useRef<HTMLUListElement>(null);
  const [showLocalLlmTab, setShowLocalLlmTab] = useState(false);
  const [showActionsTab, setShowActionsTab] = useState(false);

  const verbosity = useSelector(selectVerbosity);
  const model = useSelector(selectCurrentModel);
  const currentConversation = useSelector(selectCurrentConversation);
  const currentConversationId = useSelector(selectCurrentConversationId);
  const conversationList = useSelector(selectConversationList);

  // const tabList = useMemo(() => {
  //   return conversationList.map((conversation) => ({
  //     id: conversation.id,
  //     title: conversation.title,
  //   }));
  // }, [conversationList]);
  const [tabList, setTabList] = React.useState<Tab[]>([]);

  // useEffect(() => {
  //   if (conversationList && conversationList.find) {
  //     setCurrentConversation(
  //       conversationList.find(
  //         (conversation) => conversation.id === currentConversationId
  //       ) ?? conversationList[0]
  //     );
  //   } else {
  //     console.warn(
  //       "[Reborn AI] conversationList is null",
  //       JSON.stringify(conversationList)
  //     );
  //   }
  // }, [currentConversationId, conversationList]);

  useEffect(() => {
    if (conversationList?.map) {
      setTabList([
        // { name: "Prompts", href: "/prompts" id: "prompts" },
        // { name: "Actions", href: "/actions" id: "actions" },
        ...conversationList.map(
          (conversation: Conversation) =>
            ({
              name: conversation.title ?? "Chat",
              id: conversation.id,
              href: `/chat/${encodeURI(conversation.id)}`,
            } as Tab)
        ),
      ]);
    } else {
      console.warn(
        "[Reborn AI] conversationList is null",
        JSON.stringify(conversationList)
      );
    }
  }, [conversationList]);

  const createNewConversationHandler = useCallback(() => {
    let title = "Chat";
    let i = 2;
    while (
      conversationList.find(
        (conversation: Conversation) => conversation.title === title
      )
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
      model: model ?? currentConversation?.model,
      autoscroll: true,
      verbosity: currentConversation?.verbosity ?? verbosity,
      tools: {},
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
  }, [
    conversationList,
    dispatch,
    model,
    navigate,
    currentConversation,
    verbosity,
  ]);

  const closeTabHandler = useCallback(
    (tab: Tab) => {
      // navigate to the first tab
      // if there's no more chats, create a new one
      if (tabList.length === 1) {
        createNewConversationHandler();
      } else if (currentConversationId === tab.id) {
        navigate(
          `/chat/${encodeURI(
            conversationList[0].id === tab.id
              ? conversationList[1].id
              : conversationList[0].id
          )}`
        );
      }

      // Remove conversation
      dispatch(removeConversation(tab.id));
    },
    [
      conversationList,
      currentConversationId,
      createNewConversationHandler,
      navigate,
    ]
  );

  useEffect(() => {
    // update the select element
    if (selectRef?.current) {
      selectRef.current.value =
        tabList.find((tab) => tab.id === currentConversationId)?.name ??
        t.tabs?.new_chat ??
        "New";
    }
  }, [currentConversationId, tabList, t.tabs]);

  useEffect(() => {
    if (location.pathname === "/api") {
      setShowLocalLlmTab(true);
    } else if (location.pathname === "/actions") {
      setShowActionsTab(true);
    }
  }, [location.pathname]);

  return (
    <>
      {/* Tab layout specifically for a skinny UI (switches to dropdown) or when the tab count exceeds 5 */}
      <div className={`${tabList.length > 5 ? "" : "2xs:hidden"}`}>
        <label htmlFor="tabs" className="sr-only">
          {t?.tabs?.sr_label ?? "Select a tab"}
        </label>
        <div className="flex flex-row divide-x divide-tab border-b border-tab">
          <TabsDropdown
            tabList={tabList}
            currentTabId={currentConversationId}
            navigate={navigate}
            createNewConversation={createNewConversationHandler}
            className="flex-grow"
          />
          {/* button for new chat */}
          <button
            className="flex gap-x-2 items-center bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap p-2 pr-3 text-2xs"
            onClick={createNewConversationHandler}
          >
            <Icon icon="plus" className="w-4 h-4" />
            {t?.tabs?.new_chat ?? "New"}
          </button>
        </div>
      </div>
      {/* Wider tab layout */}
      <div className={`${tabList.length > 5 ? "hidden" : "hidden 2xs:block"}`}>
        <nav className="flex justify-between border-b border-tab">
          <ul
            ref={tabListRef}
            className="flex overflow-x-auto divide-x divide-tab"
            aria-label="Tabs"
          >
            {/* /api */}
            <li>
              <Link
                className={classNames(
                  "border-t h-full flex items-center gap-x-1 py-1 pl-2 pr-1 group whitespace-nowrap text-2xs focus:outline-none",
                  location.pathname === "/api"
                    ? "border-t-tab-editor-focus bg-tab-active text-tab-active hover:text-tab-active focus-within:text-tab-active focus-within:bg-tab-active"
                    : "border-t-tab-inactive bg-tab-inactive hover:bg-tab-selection hover:text-tab-inactive text-tab-active-unfocused focus-within:text-tab-inactive focus-within:bg-tab-selection",
                  {
                    hidden: !showLocalLlmTab,
                  }
                )}
                to="/api"
                aria-current={location.pathname === "/api" ? "page" : undefined}
              >
                <span className="pt-0.5">
                  ⚙️ {t?.tabs?.llmSettingsTitle ?? "LLM Settings"}
                </span>
                <TabCloseButton
                  path="/api"
                  onClick={() => {
                    // If there's no tabs
                    if (tabList.length === 0) {
                      createNewConversationHandler();
                    }

                    // Navigate to the first conversation
                    navigate(`/chat/${encodeURI(tabList[0].id)}`);

                    // Hide the tab
                    setShowLocalLlmTab(false);
                  }}
                />
              </Link>
            </li>
            {/* /actions */}
            <li>
              <Link
                className={classNames(
                  "border-t h-full flex items-center gap-x-1 py-1 pl-2 pr-1 group whitespace-nowrap text-2xs focus:outline-none",
                  location.pathname === "/actions"
                    ? "border-t-tab-editor-focus bg-tab-active text-tab-active hover:text-tab-active focus-within:text-tab-active focus-within:bg-tab-active"
                    : "border-t-tab-inactive bg-tab-inactive hover:bg-tab-selection hover:text-tab-inactive text-tab-active-unfocused focus-within:text-tab-inactive focus-within:bg-tab-selection",
                  {
                    hidden: !showActionsTab,
                  }
                )}
                to="/actions"
                aria-current={
                  location.pathname === "/actions" ? "page" : undefined
                }
              >
                <span className="pt-0.5">🛠️ Actions</span>
                <TabCloseButton
                  path="/actions"
                  onClick={() => {
                    // If there's no conversations, create a new one
                    if (tabList.length === 0) {
                      createNewConversationHandler();
                    }

                    // Navigate to the first conversation
                    navigate(`/chat/${encodeURI(tabList[0].id)}`);

                    // Hide the tab
                    setShowActionsTab(false);
                  }}
                />
              </Link>
            </li>
            {/* Chats */}
            {tabList.map((tab) => (
              <TabLink
                key={tab.id}
                tab={tab}
                closeTab={closeTabHandler}
                createNewConversation={createNewConversationHandler}
              />
            ))}
            {/* create new chat button */}
            <li className="flex items-center sticky right-0">
              <button
                className="flex gap-x-1 bg-button-secondary text-button-secondary whitespace-nowrap py-2 pl-2 pr-3 text-2xs hover:bg-button-secondary-hover hover:text-button-secondary-hover focus:outline-none focus:bg-button-secondary-hover focus:text-button-secondary-hover"
                onClick={createNewConversationHandler}
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
});
