import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addConversation, removeConversation } from "../actions/conversation";
import { useAppDispatch } from "../hooks";
import { Conversation } from "../types";
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
    } as Conversation;

    dispatch(addConversation(newConversation));

    // switch to the new conversation
    navigate(`/chat/${encodeURI(newConversation.id)}`);
  };

  return (
    <div>
      <div className="2xs:hidden py-1 px-2">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <div className="flex flex-row gap-x-2">
          {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
          <TabsDropdown
            tabs={tabs}
            currentConversation={currentConversation}
            conversationList={conversationList}
            navigate={navigate}
            createNewConversation={createNewConversation}
            className="flex-grow"
          />
          {/* <select
            id="tabs"
            ref={selectRef}
            name="tabs"
            className="block flex-grow rounded-md py-2 pl-3 pr-10 bg-tab-inactive-unfocused border-tab-inactive-border text-tab-inactive-unfocused  focus:border-tab-active focus:outline-none focus:ring-tab-active text-xs"
            defaultValue={
              tabs.find((tab) => currentConversation.title === tab.name)?.name
            }
            onChange={(e) => {
              const selectedTab = tabs.find(
                (tab) => tab.name === e.target.value
              );
              if (selectedTab) {
                navigate(selectedTab.href);
              }
            }}
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select> */}
          {/* button for new chat */}
          <button
            className="flex items-center bg-tab-inactive-unfocused text-tab-inactive-unfocused hover:bg-tab-inactive hover:text-tab-inactive whitespace-nowrap p-2 text-xs"
            onClick={createNewConversation}
          >
            <Icon icon="plus" className="w-3 h-3" />
            <span className="ml-2">New Chat</span>
          </button>
        </div>
      </div>
      <div className="hidden 2xs:block">
        <nav className="border-b">
          <ul
            className="flex divide-tab bg-tab-inactive-unfocused"
            aria-label="Tabs"
          >
            {tabs &&
              tabs.map((tab) => (
                <li
                  className={classNames(
                    currentConversation.title === tab.name
                      ? "group bg-tab border-tab"
                      : "bg-tab-inactive-unfocused border-tab-inactive-border hover:bg-tab-inactive hover:text-tab-inactive",
                    "flex whitespace-nowrap pt-2 pb-1 pl-4 pr-1 text-xs items-center"
                  )}
                  key={tab.id}
                >
                  <Link
                    to={tab.href}
                    aria-current={
                      currentConversation.title === tab.name
                        ? "page"
                        : undefined
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
                        dispatch(removeConversation(tab.id));
                      }}
                    >
                      <Icon icon="close" className="w-3 h-3" />
                      <span className="sr-only">Close tab</span>
                    </button>
                  )}
                </li>
              ))}
            {/* create new chat button */}
            <li>
              <button
                className="bg-tab-inactive-unfocused text-tab-inactive-unfocused hover:bg-tab-inactive hover:text-tab-inactive flex whitespace-nowrap py-2 px-4 text-xs"
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
