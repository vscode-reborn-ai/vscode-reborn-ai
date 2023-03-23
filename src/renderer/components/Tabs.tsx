import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Conversation, Model } from "../../types";
import Icon from "./Icon";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Tabs({
  vscode,
  conversationList,
  setConversationList,
  currentConversation,
}: {
  vscode: any;
  conversationList: Conversation[];
  setConversationList: React.Dispatch<React.SetStateAction<Conversation[]>>;
  currentConversation: Conversation;
}) {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState([
    // { name: "Prompts", href: "/prompts", id: "prompts" },
    // { name: "Actions", href: "/actions", id: "actions" },
    ...conversationList.map((conversation) => ({
      name: conversation.title,
      id: conversation.id,
      href: `/chat/${encodeURI(conversation.id)}`,
    })),
  ]);

  useEffect(() => {
    setTabs([
      // { name: "Prompts", href: "/prompts" id: "prompts" },
      // { name: "Actions", href: "/actions" id: "actions" },
      ...conversationList.map((conversation) => ({
        name: conversation.title,
        id: conversation.id,
        href: `/chat/${encodeURI(conversation.id)}`,
      })),
    ]);
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
      model: Model.gpt_35_turbo,
    } as Conversation;

    setConversationList((prev: Conversation[]) => {
      if (prev?.length === 0) {
        return [newConversation];
      } else {
        return [...prev, newConversation];
      }
    });

    // switch to the new conversation
    navigate(`/chat/${encodeURI(newConversation.id)}`);
  };

  return (
    <div>
      <div className="2xs:hidden py-1 px-2">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md py-2 pl-3 pr-10 bg-tab-inactive-unfocused border-tab-inactive-border text-tab-inactive-unfocused  focus:border-tab-active focus:outline-none focus:ring-tab-active text-xs"
          defaultValue={
            tabs.find((tab) => currentConversation.title === tab.name)?.name
          }
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden 2xs:block">
        <nav className="border-b">
          <ul
            className="flex divide-tab bg-tab-inactive-unfocused"
            aria-label="Tabs"
          >
            {tabs.map((tab) => (
              <li
                className={classNames(
                  currentConversation.title === tab.name
                    ? "group bg-tab border-tab"
                    : "bg-tab-inactive-unfocused border-tab-inactive-border hover:bg-tab-inactive hover:text-tab-inactive",
                  "flex whitespace-nowrap pt-2 pb-1 pl-2 pr-1 text-xs items-center"
                )}
                key={tab.id}
              >
                <Link
                  to={tab.href}
                  aria-current={
                    currentConversation.title === tab.name ? "page" : undefined
                  }
                >
                  {tab.name}
                </Link>
                {/* close tab button */}
                {tab.name !== "Prompts" && tab.name !== "Actions" && (
                  <button
                    className="ml-2 opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-red focus-within:opacity-100 focus-within:text-red"
                    onClick={() => {
                      // navigate to the first tab
                      // if there's no more chats, create a new one
                      if (conversationList.length === 1) {
                        createNewConversation();
                      } else {
                        navigate(
                          `/chat/${encodeURI(
                            conversationList[0].id === tab.id
                              ? conversationList[1].id
                              : conversationList[0].id
                          )}`
                        );
                      }

                      // remove the tab from the list
                      setConversationList((prev: Conversation[]) => {
                        return prev.filter(
                          (conversation) => conversation.id !== tab.id
                        );
                      });
                    }}
                  >
                    <Icon icon="close" className="w-3 h-3" />
                    <span className="sr-only">Close tab</span>
                  </button>
                )}
              </li>
            ))}
            {/* chats */}
            {/* {conversationList.map(([conversation, setConversation]) => (
              <Link
                key={conversation.id}
                to={`/chat/${conversation.id}`}
                className={classNames(
                  currentTabName === conversation.title
                    ? "bg-tab border-tab text-tab-active-fg"
                    : "bg-tab-inactive-unfocused border-tab-inactive-border text-tab-inactive-unfocused hover:bg-tab-inactive hover:text-tab-inactive",
                  "flex whitespace-nowrap border-b-2 py-2 px-4 text-xs"
                )}
                aria-current={
                  currentTabName === conversation.title ? "page" : undefined
                }
              >
                {conversation.title}
              </Link>
            ))} */}
            {/* create new chat button */}
            <li>
              <button
                className="bg-tab-inactive-unfocused border-tab-inactive-border text-tab-inactive-unfocused hover:bg-tab-inactive hover:text-tab-inactive flex whitespace-nowrap border-b-2 py-2 px-4 text-xs"
                onClick={createNewConversation}
              >
                <Icon icon="plus" className="w-4 h-4 mr-1" />
                New Chat
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
