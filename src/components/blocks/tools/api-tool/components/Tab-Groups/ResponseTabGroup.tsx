import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import JsonEditorPane from "../Panes/Json/JsonEditorPane";
import ResponseHeaderPane from "../Panes/ResponseHeader/ResponseHeaderPane";

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
      <TabsList className="bg-zinc-800 border-zinc-700">
        <TabsTrigger value="body" className="data-[state=active]:bg-zinc-700">
          Response Body
        </TabsTrigger>
        <TabsTrigger
          value="headers"
          className="data-[state=active]:bg-zinc-700"
        >
          Response Headers
        </TabsTrigger>
      </TabsList>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg mt-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Sending request...</p>
          </div>
        </div>
      ) : (
        <>
          <TabsContent
            value="body"
            className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
          >
            <JsonEditorPane
              paneValue={doc}
              setPaneValue={setDoc}
              isEditable={false}
            />
          </TabsContent>

          <TabsContent
            value="headers"
            className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
          >
            <ResponseHeaderPane response={response} />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
