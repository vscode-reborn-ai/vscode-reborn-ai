import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { addConversation, removeConversation } from "../store/conversation";
import { Conversation, Verbosity } from "../types";
import Icon from "./Icon";
import TabsDropdown from "./TabsDropdown";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Tabs({
  conversationList,
  currentConversationId,
}: {
  conversationList: Conversation[];
  currentConversationId: string;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const t = useAppSelector((state: any) => state.app.translations);
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

  useEffect(() => {
    if (conversationList && conversationList.find) {
      setCurrentConversation(
        conversationList.find(
          (conversation) => conversation.id === currentConversationId
        ) ?? conversationList[0]
      );
    } else {
      console.log("conversationList is null", JSON.stringify(conversationList));
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
      console.log("conversationList is null", JSON.stringify(conversationList));
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
  };

  return (
    <div>
      {/* Tab layout specifically for a skinny UI (switches to dropdown) or when the tab count exceeds 5 */}
      <div className={`py-1 px-2 ${tabs.length > 5 ? "" : "2xs:hidden"}`}>
        <label htmlFor="tabs" className="sr-only">
          {t?.tabs?.sr_label ?? "Select a tab"}
        </label>
        <div className="flex flex-row gap-x-2">
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
            className="flex gap-x-2 items-center bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap rounded p-2 pr-3 text-xs"
            onClick={createNewConversation}
          >
            <Icon icon="plus" className="w-4 h-4" />
            {t?.tabs?.new_chat ?? "New Chat"}
          </button>
        </div>
      </div>
      {/* Wider tab layout */}
      <div className={`${tabs.length > 5 ? "hidden" : "hidden 2xs:block"}`}>
        <nav className="flex justify-between gap-2 py-1 px-1 xs:px-4">
          <ul className="flex gap-2 overflow-x-auto" aria-label="Tabs">
            {tabs &&
              tabs.map((tab) => (
                <li key={tab.id}>
                  <Link
                    // className="flex items-center pb-1 pt-1.5 px-2 text-inherit rounded"

                    className={classNames(
                      currentConversation.title === tab.name
                        ? "bg-tab-active border-secondary text-tab-active-unfocused hover:text-tab-active focus-within:text-tab-active focus-within:bg-tab-active"
                        : "border-transparent hover:bg-tab-selection hover:text-tab-inactive text-tab-inactive-unfocused focus-within:text-tab-inactive focus-within:bg-tab-selection",
                      "flex items-center gap-x-1 py-1 pl-2 pr-1 group whitespace-nowrap border text-xs rounded focus:outline-none"
                    )}
                    to={tab.href}
                    aria-current={
                      currentConversation.title === tab.name
                        ? "page"
                        : undefined
                    }
                  >
                    <span className="pt-0.5">{tab.name}</span>
                    {/* close tab button */}
                    {tab.name !== "Prompts" && tab.name !== "Actions" && (
                      <button
                        className="ml-2 p-1 opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 focus:outline-none hover:bg-opacity-40 hover:bg-red-900 focus:bg-red-900 rounded-md"
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
                  </Link>
                </li>
              ))}
            {/* create new chat button */}
            <li className="flex items-center">
              <button
                className="flex gap-x-1 bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap py-2 pl-2 pr-3 text-xs rounded"
                onClick={createNewConversation}
              >
                <Icon icon="plus" className="w-4 h-4" />
                {t?.tabs?.new_chat ?? "New Chat"}
              </button>
            </li>
          </ul>
          <Link
            className="flex items-center justify-center bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap rounded p-2 pr-3 text-xs"
            to="/actions"
          >
            <Icon icon="zap" className="w-4 h-4" />
            <span className="sr-only">Actions</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
