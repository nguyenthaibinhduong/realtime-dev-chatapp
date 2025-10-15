import api from "@/api/Http";

export { Tool1 } from "./Tool1";
export { Tool2 } from "./Tool2";
export { Tool3 } from "./Tool3";
export { ApiTool } from "./api-tool";

export type ToolType = "tool1" | "tool2" | "tool3" | "apiTool" | null;

export const TOOL_CONFIGS = {
  tool1: {
    id: "tool1" as const,
    name: "Kiểm thử API",
    description: "Chức năng kiểm thử API",
    icon: "⚙️",
  },
  tool2: {
    id: "tool2" as const,
    name: "Database Manager",
    description: "Manage databases",
    icon: "🗄️",
  },
  tool3: {
    id: "tool3" as const,
    name: "Analytics Dashboard",
    description: "View analytics data",
    icon: "📊",
  },

  apiTool: {
    id: "apiTool" as const,
    name: "API Tool",
    description: "Test and debug APIs",
    icon: "🛠️",
  },
};
