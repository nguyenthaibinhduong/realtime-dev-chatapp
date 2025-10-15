# API Tool - Request History Feature

## Tổng quan

Tính năng lưu lịch sử request vào localStorage đã được triển khai thành công cho API Tool.

## Các tính năng chính

### 1. Lưu trữ lịch sử

- ✅ Tự động lưu mỗi request vào localStorage
- ✅ Lưu đầy đủ thông tin: URL, Method, Headers, Body, Params, Response
- ✅ Giới hạn 100 request gần nhất
- ✅ Lưu cả request thành công và thất bại

### 2. Hiển thị lịch sử

- ✅ Giao diện History Panel với danh sách request
- ✅ Hiển thị thông tin: Method, Status Code, URL, Time, Size
- ✅ Màu sắc theo Method và Status Code
- ✅ Thời gian tương đối (Just now, 5m ago, 2h ago, 3d ago)

### 3. Tìm kiếm và quản lý

- ✅ Tìm kiếm theo URL, Method, hoặc Response data
- ✅ Xóa từng request riêng lẻ
- ✅ Xóa toàn bộ lịch sử (với xác nhận)
- ✅ Refresh danh sách

### 4. Load lại request từ lịch sử

- ✅ Click vào request để load lại vào form
- ✅ Tự động điền URL, Method, Headers, Params, Body
- ✅ Hiển thị lại Response đã lưu
- ✅ Chuyển sang tab Request/Response tự động

## Cấu trúc file

```
src/components/blocks/tools/api-tool/
├── ApiTool.tsx                           # Component chính với Tabs
├── utils/
│   ├── requestHistory.ts                 # Service quản lý localStorage
│   └── helpers.ts                        # Helper functions (updated)
└── components/
    ├── History/
    │   └── HistoryPanel.tsx             # Component hiển thị lịch sử
    └── Workspace/
        └── Request/
            └── RequestPanel.tsx         # Component request (updated)
```

## API của requestHistory service

### `saveRequestToHistory(data)`

Lưu một request vào lịch sử

```typescript
saveRequestToHistory({
  url: string,
  method: string,
  headers: Record<string, string>,
  params: Record<string, string>,
  body: string,
  response: {
    status: number,
    statusText: string,
    headers: Record<string, any>,
    data: any,
    time: string,
    size: string,
  },
});
```

### `getRequestHistory()`

Lấy toàn bộ lịch sử (array)

### `getRequestHistoryById(id)`

Lấy một request theo ID

### `deleteRequestFromHistory(id)`

Xóa một request theo ID

### `clearRequestHistory()`

Xóa toàn bộ lịch sử

### `searchRequestHistory(query)`

Tìm kiếm trong lịch sử

## Cách sử dụng

1. **Gửi request**: Request sẽ tự động được lưu vào localStorage
2. **Xem lịch sử**: Click tab "History" để xem danh sách
3. **Tìm kiếm**: Nhập từ khóa vào ô search
4. **Load lại**: Click nút mũi tên (→) để load request vào form
5. **Xóa**: Click nút thùng rác để xóa request
6. **Xóa tất cả**: Click "Clear All" và xác nhận

## Màu sắc

### HTTP Methods

- GET: Xanh lá (green)
- POST: Xanh dương (blue)
- PUT: Vàng (yellow)
- DELETE: Đỏ (red)
- PATCH: Tím (purple)

### Status Codes

- 2xx: Xanh lá
- 3xx: Xanh dương
- 4xx: Vàng
- 5xx: Đỏ

## Lưu ý kỹ thuật

1. **localStorage key**: `api_tool_request_history`
2. **Max items**: 100 requests
3. **Data format**: JSON array of RequestHistoryItem
4. **ID generation**: `crypto.randomUUID()`
5. **Timestamp**: `Date.now()` (milliseconds)

## Cải tiến có thể thêm

1. Export/Import lịch sử
2. Filter theo Method hoặc Status
3. Sắp xếp theo thời gian/status/method
4. Group theo ngày
5. Favorite/Pin requests
6. Edit và resend requests
7. Sync với cloud storage
