import React from "react";

export default function ({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-col gap-3.5 h-full justify-center items-center px-6 pb-24 w-full relative login-screen overflow-auto ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        ></path>
      </svg>
      <h2>Features</h2>
      <ul className="w-full max-w-lg grid grid-cols-1 xs:grid-cols-2 gap-3.5 text-xs">
        <li className="features-li w-full border p-3 rounded-md text-center">
          Optimize, refactor, and debug your code
        </li>
        <li className="features-li w-full border p-3 rounded-md text-center">
          Create tests, READMEs, and more
        </li>
        <li className="features-li w-full border p-3 rounded-md text-center">
          Automatic syntax highlighting
        </li>
        <li className="features-li w-full border p-3 rounded-md text-center">
          Run multiple chats at once
        </li>
      </ul>
      <p className="max-w-sm text-center text-[0.7rem] self-center">
        This is an API-only fork of{" "}
        <a href="https://github.com/gencay">@gencay's</a> discontinued{" "}
        <a
          className="whitespace-nowrap"
          href="https://github.com/gencay/vscode-chatgpt"
        >
          VSCode-ChatGPT extension.
        </a>
      </p>
    </div>
  );
}
