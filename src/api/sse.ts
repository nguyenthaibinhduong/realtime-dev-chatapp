const eventSource = new EventSource("/sse/stream", {
  withCredentials: true,
});

eventSource.onmessage = function (event) {
  console.log("New message:", event.data);
  // Xử lý dữ liệu nhận được
};

eventSource.onerror = function (error) {
  console.error("EventSource failed:", error);
  eventSource.close();
};

export default eventSource;
