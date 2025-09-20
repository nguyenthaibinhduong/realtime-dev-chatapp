import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { Play, Settings, Code, Terminal } from "lucide-react";

const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";

const CodeEditorJudge0 = () => {
  const [language, setLanguage] = useState("cpp17");
  const [code, setCode] = useState(
    `#include <iostream>\nusing namespace std;\nint main(){ cout << "Hello Judge0!"; return 0; }`
  );
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const languageMap = {
    cpp17: {
      id: 54,
      name: "C++17",
      icon: "🔷",
      sample: `#include <iostream>\nusing namespace std;\nint main(){ cout << "Hello World!"; return 0; }`,
    },
    c: {
      id: 50,
      name: "C",
      icon: "⚪",
      sample: `#include <stdio.h>\nint main(){ printf("Hello World!"); return 0; }`,
    },
    java: {
      id: 62,
      name: "Java",
      icon: "☕",
      sample: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}`,
    },
    python3: {
      id: 71,
      name: "Python 3",
      icon: "🐍",
      sample: `print("Hello World!")`,
    },
    javascript: {
      id: 63,
      name: "JavaScript",
      icon: "🟨",
      sample: `console.log("Hello World!");`,
    },
    go: {
      id: 60,
      name: "Go",
      icon: "🔵",
      sample: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello World!")\n}`,
    },
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(languageMap[newLang].sample);
    setOutput("");
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("🔄 Executing code...");

    try {
      const res = await axios.post(
        JUDGE0_API + "?base64_encoded=false&wait=true",
        {
          source_code: code,
          language_id: languageMap[language].id,
          stdin: "",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            "X-RapidAPI-Key":
              "86517e5a9emsh9412eeb29927899p1cf18ejsn0d6df641bde1",
          },
        }
      );

      const result = res.data;

      if (result.stderr) {
        setOutput(`❌ Runtime Error:\n${result.stderr}`);
      } else if (result.compile_output) {
        setOutput(`⚠️ Compilation Error:\n${result.compile_output}`);
      } else {
        setOutput(
          result.stdout || "✅ Program executed successfully (no output)"
        );
      }
    } catch (err) {
      setOutput("🚨 Failed to execute: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d30] border-b border-[#3e3e42]">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-[#007acc]" />
            <span className="text-white font-medium">Code Editor</span>
          </div>

          {/* Language selector */}
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Language:</span>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="appearance-none bg-[#3c3c3c] text-white px-3 py-1.5 pr-8 rounded-md border border-[#5a5a5a] text-sm focus:outline-none focus:ring-2 focus:ring-[#007acc] focus:border-transparent"
              >
                {Object.entries(languageMap).map(([key, lang]) => (
                  <option key={key} value={key} className="bg-[#3c3c3c]">
                    {lang.icon} {lang.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={runCode}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#555] text-white rounded-md transition-colors duration-200 text-sm font-medium"
        >
          <Play className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
          <span>{isRunning ? "Running..." : "Run Code"}</span>
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 border-b border-[#3e3e42]">
        <Editor
          height="100%"
          theme="vs-dark"
          language={
            language === "python3"
              ? "python"
              : language === "cpp17"
                ? "cpp"
                : language
          }
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            fontSize: 14,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: "on",
            lineNumbers: "on",
            renderLineHighlight: "all",
            selectOnLineNumbers: true,
          }}
        />
      </div>

      {/* Output panel */}
      <div className="h-48 bg-[#1e1e1e] border-t border-[#3e3e42] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3e3e42]">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-[#007acc]" />
            <span className="text-white text-sm font-medium">Output</span>
          </div>
          <div className="text-xs text-gray-400">
            {languageMap[language].icon} {languageMap[language].name}
          </div>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
            {output || "Click 'Run Code' to see output here..."}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorJudge0;
