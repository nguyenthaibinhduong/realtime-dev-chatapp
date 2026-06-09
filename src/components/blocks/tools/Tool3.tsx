import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Bug, Circle, Clock, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatAPI } from "@/api/api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimeHelper } from "@/lib/utils";
import { blockUi } from "@/components/blocks/block-ui";

interface BARequirement {
  id: string;
  projectName: string;
  status: 'open' | 'in_progress' | 'completed';
  requirements: string[];
  assignees: string[];
  created_at: string;
}

interface TesterReport {
  id: string;
  content: string;
  status: 'open' | 'in_progress' | 'completed';
  projectName?: string;
  assignees: string[];
  created_at: string;
}

export const Tool3 = () => {
  const [baRequirements, setBaRequirements] = useState<BARequirement[]>([]);
  const [testerReports, setTesterReports] = useState<TesterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannelId] = useState(localStorage.getItem("selectedChannelId") || "");

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedChannelId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch BA Requirements
        const baResponse = await ChatAPI.searchMessagesByKeyword({
            key: "BA Requirement",
            channelId: selectedChannelId,
            limit: 10000,
        });

        // Fetch Tester Reports
        const testerResponse = await ChatAPI.searchMessagesByKeyword({
            channelId: selectedChannelId,
            key: "Debug Report",
            limit: 10000,
        });

        // Parse BA data
        const baData: BARequirement[] = (baResponse?.data?.items || []).map((msg: any) => ({
          id: msg.id,
          projectName: msg.json_data?.projectName || "No Project",
          status: msg.json_data?.status || "open",
          requirements: msg.json_data?.requirements || [],
          assignees: msg.json_data?.assignees || [],
          created_at: msg.created_at || msg.send_at,
        }));

        // Parse Tester data
        const testerData: TesterReport[] = (testerResponse?.data?.items || []).map((msg: any) => ({
          id: msg.id,
          content: msg.json_data?.content || msg.text || "",
          status: msg.json_data?.status || "open",
          projectName: msg.json_data?.projectName,
          assignees: msg.json_data?.assignees || [],
          created_at: msg.created_at || msg.send_at,
        }));

        setBaRequirements(baData);
        setTesterReports(testerData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedChannelId]);

  // Calculate statistics
  const baStats = {
    total: baRequirements.length,
    open: baRequirements.filter((r) => r.status === "open").length,
    in_progress: baRequirements.filter((r) => r.status === "in_progress").length,
    completed: baRequirements.filter((r) => r.status === "completed").length,
  };

  const testerStats = {
    total: testerReports.length,
    open: testerReports.filter((r) => r.status === "open").length,
    in_progress: testerReports.filter((r) => r.status === "in_progress").length,
    completed: testerReports.filter((r) => r.status === "completed").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Circle className="h-3.5 w-3.5 text-blue-400" />;
      case "in_progress":
        return <Clock className="h-3.5 w-3.5 text-yellow-400" />;
      case "completed":
        return <CheckCircle className="h-3.5 w-3.5 text-green-400" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Chờ thực hiện";
      case "in_progress":
        return "Đang thực hiện";
      case "completed":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background text-foreground">
      <div className="p-4 space-y-4">
        {/* Header */}
        <Card className={blockUi.dialogPanel}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Project Management Dashboard
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Thống kê BA Requirements và Tester Reports
            </p>
          </CardHeader>
        </Card>

        {/* BA Requirements Section */}
        <Card className={blockUi.dialogPanel}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <FileText className="h-4 w-4 text-blue-400" />
              BA Requirements
              <Badge variant="outline" className={`ml-auto ${blockUi.chip}`}>
                {baStats.total} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* BA Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Circle className="h-3.5 w-3.5 text-blue-400" />
                  <p className="text-xs text-muted-foreground">Chờ thực hiện</p>
                </div>
                <p className="text-2xl font-semibold text-blue-400">{baStats.open}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-yellow-400" />
                  <p className="text-xs text-muted-foreground">Đang thực hiện</p>
                </div>
                <p className="text-2xl font-semibold text-yellow-400">{baStats.in_progress}</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                  <p className="text-xs text-muted-foreground">Hoàn thành</p>
                </div>
                <p className="text-2xl font-semibold text-green-400">{baStats.completed}</p>
              </div>
            </div>

            {/* BA Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tiến độ hoàn thành</span>
                <span>
                  {baStats.total > 0
                    ? Math.round((baStats.completed / baStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{
                    width: `${baStats.total > 0 ? (baStats.completed / baStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Recent BA Requirements */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Yêu cầu gần đây
              </h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {baRequirements.slice(0, 10).map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-muted/40 rounded-lg border border-border hover:border-blue-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-foreground truncate flex-1">
                          {req.projectName}
                        </p>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(req.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(req.status)}
                            {getStatusLabel(req.status)}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {req.requirements.length} requirements
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTimeHelper()(req.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {baRequirements.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Chưa có BA Requirements
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Tester Reports Section */}
        <Card className={blockUi.dialogPanel}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <Bug className="h-4 w-4 text-red-400" />
              Tester Reports
              <Badge variant="outline" className={`ml-auto ${blockUi.chip}`}>
                {testerStats.total} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tester Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Circle className="h-3.5 w-3.5 text-red-400" />
                  <p className="text-xs text-muted-foreground">Bug mới</p>
                </div>
                <p className="text-2xl font-semibold text-red-400">{testerStats.open}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-yellow-400" />
                  <p className="text-xs text-muted-foreground">Đang fix</p>
                </div>
                <p className="text-2xl font-semibold text-yellow-400">{testerStats.in_progress}</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                  <p className="text-xs text-muted-foreground">Đã fix</p>
                </div>
                <p className="text-2xl font-semibold text-green-400">{testerStats.completed}</p>
              </div>
            </div>

            {/* Tester Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tiến độ fix bug</span>
                <span>
                  {testerStats.total > 0
                    ? Math.round((testerStats.completed / testerStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-500"
                  style={{
                    width: `${testerStats.total > 0 ? (testerStats.completed / testerStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Recent Tester Reports */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Bug reports gần đây
              </h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {testerReports.slice(0, 10).map((report) => (
                    <div
                      key={report.id}
                      className="p-3 bg-muted/40 rounded-lg border border-border hover:border-red-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">
                          {report.content
                            .replace(/<[^>]*>/g, "")
                            .slice(0, 60)}
                          {report.content.length > 60 ? "..." : ""}
                        </p>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(report.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            {getStatusLabel(report.status)}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {report.projectName || "No project"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTimeHelper()(report.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {testerReports.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Chưa có Tester Reports
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className={blockUi.dialogPanel}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <p className="text-3xl font-bold text-blue-400">{baStats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total BA Requirements</p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <p className="text-3xl font-bold text-red-400">{testerStats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Bug Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
