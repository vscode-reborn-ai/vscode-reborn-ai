import React, { Suspense, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import ChatMessageComponent from "../components/ChatMessage";
import IntroductionSplash from "../components/IntroductionSplash";
import QuestionInputField from "../components/QuestionInputField";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { selectMinimalUI } from "../store/app";
import {
  selectAutoscroll,
  selectCurrentConversationId,
  selectCurrentMessages,
  setAutoscroll,
} from "../store/conversation";
import { ChatMessage, Role } from "../types";

const LazyDebugConversation = React.lazy(
  () => import("../components/DebugConversation")
);

const MessageList = ({
  conversationId,
  conversationListRef,
  vscode,
}: {
  conversationId: string;
  conversationListRef: React.RefObject<HTMLDivElement>;
  vscode: any;
}) => {
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const minimalUI = useSelector(selectMinimalUI);
  const messages = useAppSelector(
    (state: RootState) =>
      state.conversation.conversations[conversationId]?.messages ?? []
  );

  const messageList = useMemo(() => {
    return messages.filter(
      (message: ChatMessage) =>
        debug || (message.role !== Role.system && message.content)
    );
  }, [messages, debug]);

  return (
    <div ref={conversationListRef}>
      <div
        className={`flex flex-col
          ${minimalUI ? "pb-20" : "pb-24"}
        `}
      >
        {messageList.map((message: ChatMessage, index: number) => {
          return (
            <ChatMessageComponent
              key={message.id}
              message={message}
              conversationId={conversationId}
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

export default function Chat({ vscode }: { vscode: any }) {
  const dispatch = useAppDispatch();
  const conversationId = useSelector(selectCurrentConversationId);
  const autoscroll = useSelector(selectAutoscroll);
  const messages = useSelector(selectCurrentMessages);
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
    if (autoscroll) {
      conversationListRef.current?.scrollTo({
        top: conversationListRef.current.scrollHeight,
        behavior: "auto",
      });
    }
  }, [messages]);

  // if the user scrolls up while in progress, disable autoscroll
  const handleScroll = () => {
    if (conversationListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        conversationListRef.current;
      if (scrollTop < scrollHeight - clientHeight && autoscroll) {
        // disable autoscroll if the user scrolls up
        dispatch(
          setAutoscroll({
            conversationId,
            autoscroll: false,
          })
        );
      } else if (!autoscroll && scrollTop >= scrollHeight - clientHeight) {
        // re-enable autoscroll if the user scrolls to the bottom
        dispatch(
          setAutoscroll({
            conversationId,
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
      <Suspense fallback={<div>...</div>}>
        {debug && <LazyDebugConversation conversationId={conversationId} />}
      </Suspense>
      <IntroductionSplash
        className={messages?.length > 0 ? "hidden" : ""}
        vscode={vscode}
      />
      {conversationId && (
        <MessageList
          conversationId={conversationId}
          conversationListRef={conversationListRef}
          vscode={vscode}
        />
      )}
      <QuestionInputField vscode={vscode} />
    </div>
  );
}
