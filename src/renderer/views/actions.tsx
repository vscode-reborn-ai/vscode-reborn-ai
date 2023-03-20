import React from "react";

const aiActions = {
  javascript: [
    {
      name: "Create README.md based on package.json",
      reads: ["package.json"],
      writes: ["README.md"],
    },
    {
      name: "Create .gitignore based on package.json",
      reads: ["package.json"],
      writes: [".gitignore"],
    },
  ],
  python: [
    {
      name: "Create README.md based on requirements.txt",
      reads: ["requirements.txt"],
      writes: ["README.md"],
    },
  ],
};

export default function Actions(props: {
  postMessage: (type: string, value: any, language?: string) => void;
}) {
  return (
    <nav className="h-full overflow-y-auto" aria-label="Directory">
      {Object.keys(aiActions).map((category) => (
        <div key={category} className="relative">
          <div className="sticky top-0 z-10 border-t border-b border-menu bg-menu-selection px-6 py-1 text-sm font-medium text-menu">
            <h3>{category}</h3>
          </div>
          <ul role="list" className="relative z-0 divide-y divide-menu">
            {/* @ts-ignore */}
            {aiActions[category].map(
              (
                action: {
                  name: string;
                  reads: string[];
                  writes: string[];
                },
                index: React.Key | null | undefined
              ) => (
                <li key={`action-${index}`} className="bg">
                  <div className="relative flex items-center space-x-3 px-6 py-5 focus-within:ring-2 focus-within:ring-inset hover:bg-menu">
                    <div className="min-w-0 flex-1 flex flex-row gap-x-2">
                      <header className="flex flex-col flex-1">
                        <h3 className="text-md font-medium text-menu my-0">
                          {action.name}
                        </h3>
                        <p className="truncate text-xs text my-0">
                          Reads: [{action.reads.join(", ")}] Writes: [
                          {action.writes.join(", ")}]
                        </p>
                      </header>
                      <div className="">
                        <button
                          type="button"
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-menu bg-menu hover:bg-menu focus:outline-none focus:ring-2 focus:ring-offset-2"
                          onClick={() => props.postMessage("runAction", action)}
                        >
                          Run
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}
