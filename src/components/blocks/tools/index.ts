import api from "@/api/Http";

export { Tool1 } from "./Tool1";
export { Tool2 } from "./Tool2";
export { Tool3 } from "./Tool3";
export { ApiTool } from "./api-tool";
export { FortuneSheet } from "./sheet/sheet";

export type ToolType = "tool1" | "tool2" | "tool3" | "apiTool" | "sheet" | null;

export const TOOL_CONFIGS = {
  apiTool: {
    id: "apiTool" as const,
    name: "API Tool",
    description: "Test and debug APIs",
    icon: "🛠️",
  },
  // tool1: {
  //   id: "tool1" as const,
  //   name: "API Tool",
  //   description: "Test and debug APIs",
  //   icon: "🛠️",
  // },
  tool2: {
    id: "tool2" as const,
    name: "Code Snippet Sender",
    description: "Send code snippets for execution",
    icon: "💻",
  },
  tool3: {
    id: "tool3" as const,
    name: "Analytics Dashboard",
    description: "View analytics data",
    icon: "📊",
  },
  sheet: {
    id: "sheet" as const,
    name: "Fortune Sheet",
    description: "Spreadsheet tool",
    icon: "📄",
  },
};
