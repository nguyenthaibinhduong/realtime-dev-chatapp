import { Workbook } from "@fortune-sheet/react";
import type { Sheet } from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {} from "@fortune-sheet/core";
import { UploadApi } from "@/api/api";
import { debounce } from "lodash";
import { post } from "@/api/Http";
import { Loader2 } from "lucide-react";
import {
  FortuneExcelHelper,
  importToolBarItem,
  exportToolBarItem,
} from "@corbe30/fortune-excel";

// Helper function to format data
const formatSheet = (sheet: Sheet) => {
  // Ensure celldata is always defined as an array
  if (!sheet.celldata) {
    sheet.celldata = [];
  }

  // Convert any legacy "data" property to "celldata"
  if (sheet.data) {
    sheet.data.forEach((row: any, rowIndex: number) => {
      row.forEach((cell: any, columnIndex: number) => {
        if (cell !== null) {
          sheet.celldata!.push({
            r: rowIndex,
            c: columnIndex,
            v: cell,
          });
        }
      });
    });
    delete sheet.data;
  }
};

export const FortuneSheet = () => {
  const [data, setData] = useState<Sheet[]>([{ name: "Sheet1", celldata: [] }]);
  const [key, setKey] = useState(0);

  const workbookRef = useRef();
  const sheetRef = useRef();

  const [sheetUrl, setSheetUrl] = useState<string>("");
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isSavingRef = useRef(false);

  const currentChannelId = localStorage.getItem("selectedChannelId");

  //Load sheet data từ server
  useEffect(() => {
    const loadSheet = async () => {
      if (!currentChannelId) return;
      try {
        const response = await UploadApi.getSheetUrl(currentChannelId);
        if (response && response?.data?.sheetUrl) {
          setSheetUrl(response.data.sheetUrl);
          setSignedUrl(response.data.signedUrl);
        }

        console.log("response", response);

        const sheetData = await fetch(response?.data?.sheetUrl, {
          cache: "no-store",
        });
        if (sheetData.ok) {
          const sheetJson = await sheetData.json();
          //Format data
          sheetJson.forEach((sheet: Sheet) => formatSheet(sheet));
          setData(sheetJson);
        }
      } catch (error) {
        console.error("Error loading sheet data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSheet();
  }, [currentChannelId]);

  //Xử lý khi data sheet thay đổi
  const debouncedSave = useMemo(
    () =>
      debounce(async (url: string, newData: Sheet[]) => {
        if (!url || isSavingRef.current) return;
        console.log("here - saving data");

        try {
          isSavingRef.current = true;

          await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newData),
          });
          //   await post(url, newData, {
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //   });

          console.log("Sheet saved successfully");
        } catch (error) {
          console.error("Failed to save sheet:", error);
        } finally {
          isSavingRef.current = false;
        }
      }, 1000),
    [] // Empty dependency - chỉ tạo 1 lần duy nhất
  );

  // Cleanup debounce khi unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleChange = useCallback(
    (newData: Sheet[]) => {
      // setData(newData);
      debouncedSave(signedUrl, newData);
    },
    [signedUrl, debouncedSave]
  );

  return (
    <div className="h-full w-full">
      {isLoading ? (
        <Loader2 className=" text-blue-500 animate-spin mb-4" />
      ) : (
        <>
          <FortuneExcelHelper
            setKey={setKey}
            setSheets={setData}
            sheetRef={sheetRef}
            config={{
              import: { xlsx: true, csv: true },
              export: { xlsx: true, csv: true },
            }}
          />
          <Workbook
            key={key}
            data={data}
            onChange={handleChange}
            ref={workbookRef}
            customToolbarItems={[importToolBarItem(), exportToolBarItem()]}
          />
        </>
      )}
    </div>
  );
};
