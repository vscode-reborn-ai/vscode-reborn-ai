enum Author {
  user = "user",
  bot = "bot",
}

interface Message {
  id?: string;
  author: Author;
  text: string;
  date?: string;
  isError?: boolean;
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  messages: Message[];
  title?: string;
  datetime?: string;
  inProgress: boolean;
}

export { Author, Message, Conversation };
