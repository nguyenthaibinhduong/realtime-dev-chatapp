import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import JsonEditorPane from "../Panes/Json/JsonEditorPane";
import ResponseHeaderPane from "../Panes/ResponseHeader/ResponseHeaderPane";
import { blockUi } from "@/components/blocks/block-ui";

interface ResponseTabGroupProps {
  doc: string;
  setDoc: React.Dispatch<React.SetStateAction<string>>;
  response: any;
  loading: boolean;
}

export default function ResponseTabGroup({
  doc,
  setDoc,
  response,
  loading,
}: ResponseTabGroupProps) {
  return (
    <Tabs defaultValue="body" className="mt-4">
      <TabsList className="bg-muted border border-border">
        <TabsTrigger value="body" className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground">
          Response Body
        </TabsTrigger>
        <TabsTrigger
          value="headers"
          className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground"
        >
          Response Headers
        </TabsTrigger>
      </TabsList>

      {loading ? (
        <div className={`flex items-center justify-center py-12 mt-4 ${blockUi.sectionMuted}`}>
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sending request...</p>
          </div>
        </div>
      ) : (
        <>
          <TabsContent
            value="body"
            className={`mt-4 p-4 ${blockUi.section}`}
          >
            <JsonEditorPane
              paneValue={doc}
              setPaneValue={setDoc}
              isEditable={false}
            />
          </TabsContent>

          <TabsContent
            value="headers"
            className={`mt-4 p-4 ${blockUi.section}`}
          >
            <ResponseHeaderPane response={response} />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
