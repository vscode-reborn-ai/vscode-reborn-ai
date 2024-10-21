import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import ChatMessageComponent from "../components/ChatMessage";
import IntroductionSplash from "../components/IntroductionSplash";
import QuestionInputField from "../components/QuestionInputField";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import {
  selectCurrentConversation,
  setAutoscroll,
} from "../store/conversation";
import { ChatMessage, Conversation, Role } from "../types";

const DebugComponent = ({ conversation }: { conversation: Conversation }) => {
  return (
    <div className="text-gray-500 text-[10px] font-mono">
      Conversation ID: {conversation?.id}
      <br />
      Conversation Title: {conversation?.title}
      <br />
      Conversation Datetime:{" "}
      {new Date(conversation?.createdAt ?? "").toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
      <br />
      Conversation Model: {conversation.model?.id}
      <br />
      Conversation inProgress: {conversation?.inProgress ? "true" : "false"}
    </div>
  );
};

const MessageList = ({
  conversation,
  conversationListRef,
  vscode,
}: {
  conversation: Conversation;
  conversationListRef: React.RefObject<HTMLDivElement>;
  vscode: any;
}) => {
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );

  return (
    <div ref={conversationListRef}>
      <div
        className={`flex flex-col
          ${settings?.minimalUI ? "pb-20" : "pb-24"}
        `}
      >
        {conversation.messages
          .filter(
            (message: ChatMessage) =>
              debug || (message.role !== Role.system && message.content)
          )
          .map((message: ChatMessage, index: number) => {
            return (
              <ChatMessageComponent
                key={message.id}
                message={message}
                conversation={conversation}
                vscode={vscode}
                index={index}
              />
            );
          })}
        <Tooltip id="message-tooltip" />
      </div>
    </div>
  );
};

export default function Chat({
  conversation,
  conversationList,
  vscode,
}: {
  conversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
}) {
  const dispatch = useAppDispatch();
  const currentConversation = useSelector(selectCurrentConversation);
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const conversationListRef = React.useRef<HTMLDivElement>(null);

  (window as any)?.marked?.setOptions({
    renderer: new ((window as any)?.marked).Renderer(),
    highlight: function (code: any, _lang: any) {
      return (window as any).hljs.highlightAuto(code).value;
    },
    langPrefix: "hljs language-",
    pedantic: false,
    gfm: true,
    breaks: true,
    sanitize: false,
    smartypants: false,
    xhtml: false,
  });

  useEffect(() => {
    if (conversation.autoscroll) {
      conversationListRef.current?.scrollTo({
        top: conversationListRef.current.scrollHeight,
        behavior: "auto",
      });
    }
  }, [conversation.messages]);

  // if the user scrolls up while in progress, disable autoscroll
  const handleScroll = () => {
    if (conversationListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        conversationListRef.current;
      if (scrollTop < scrollHeight - clientHeight && conversation.autoscroll) {
        // disable autoscroll if the user scrolls up
        dispatch(
          setAutoscroll({
            conversationId: conversation.id,
            autoscroll: false,
          })
        );
      } else if (
        !conversation.autoscroll &&
        scrollTop >= scrollHeight - clientHeight
      ) {
        // re-enable autoscroll if the user scrolls to the bottom
        dispatch(
          setAutoscroll({
            conversationId: conversation.id,
            autoscroll: true,
          })
        );
      }
    }
  };

  useEffect(() => {
    // check if the scroll listener is already attached
    if (conversationListRef.current && !conversationListRef.current.onscroll) {
      // attach the scroll listener
      conversationListRef.current.addEventListener("scroll", handleScroll, {
        passive: true, // do not block scrolling
      });
    }
  }, [conversationListRef.current]);

  return (
    <div className="w-full overflow-y-auto flex-grow">
      {debug && <DebugComponent conversation={conversation} />}
      <IntroductionSplash
        className={conversation.messages?.length > 0 ? "hidden" : ""}
        vscode={vscode}
      />
      {currentConversation && (
        <MessageList
          conversation={currentConversation}
          conversationListRef={conversationListRef}
          vscode={vscode}
        />
      )}
      <QuestionInputField vscode={vscode} conversationList={conversationList} />
    </div>
  );
}
