export const AttachmentViewer = ({ url }: { url: string }) => {
  if (url.includes(".xlsx") || url.includes(".xls")) {
    return (
      <iframe
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${url}`}
        className="h-full w-full"
      ></iframe>
    );
  }
  return (
    <iframe
      src={`https://docs.google.com/gview?url=${url}&embedded=true`}
      className="h-full w-full"
    ></iframe>
  );
};
