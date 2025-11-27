import React, { createContext, useContext, useState, ReactNode } from "react";

interface PreviewContextType {
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
}

const AttachmentPreviewContext = createContext<PreviewContextType | undefined>(
  undefined
);

export const AttachmentPreviewProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <AttachmentPreviewContext.Provider value={{ previewUrl, setPreviewUrl }}>
      {children}
    </AttachmentPreviewContext.Provider>
  );
};

export const usePreview = () => {
  const context = useContext(AttachmentPreviewContext);
  if (!context) {
    throw new Error("usePreview must be used within PreviewProvider");
  }
  return context;
};
