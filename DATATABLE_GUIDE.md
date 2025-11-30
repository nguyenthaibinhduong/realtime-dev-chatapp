# DataTable Component - Hướng dẫn sử dụng

Component `DataTable` là một bảng dữ liệu tái sử dụng với đầy đủ chức năng CRUD, phân trang, tìm kiếm, và bộ lọc.

## Tính năng

✅ **Phân trang tự động** với các tùy chọn số lượng/trang  
✅ **Tìm kiếm** với debounce 300ms  
✅ **Bộ lọc** linh hoạt (select, text, date)  
✅ **CRUD Operations**: Create, Read, Update, Delete  
✅ **Toggle Active/Inactive** với Switch UI  
✅ **Custom Actions** cho mỗi hàng  
✅ **Modal chi tiết** có thể tùy chỉnh  
✅ **Form Create/Edit** có thể tùy chỉnh  
✅ **Nhiều kiểu cột**: text, image, avatar, switch, badge, badges, date, custom  
✅ **API Integration** tự động hoặc custom handler  

---

## Cấu trúc Props

### DataTableProps

```typescript
interface DataTableProps<T> {
    // === DATA & API ===
    onLoadData: (params: {
        page: number;
        limit: number;
        search: string;
        filters: Record<string, any>;
    }) => Promise<{ data: T[]; total: number }>;
    
    // === CẤU HÌNH CỘT ===
    columns: ColumnConfig<T>[];
    
    // === BỘ LỌC ===
    filters?: FilterConfig[];
    
    // === ACTIONS ===
    onDelete?: (item: T) => Promise<void>;
    onUpdate?: (item: T) => Promise<void>;
    onCreate?: (data: any) => Promise<void>;
    onSelectOne?: (item: T) => void;
    customActions?: Array<{
        label: string;
        icon?: ReactNode;
        onClick: (item: T) => void;
        className?: string;
    }>;
    
    // === API INTEGRATION (TỰ ĐỘNG) ===
    apiEndpoint?: (params: { method: string; [key: string]: any }) => Promise<any>;
    
    // === MODAL CHI TIẾT ===
    detailModalContent?: (item: T) => ReactNode;
    detailModalTitle?: string;
    
    // === FORM TẠO/SỬA ===
    formContent?: (item: T | null, onSubmit: (data: any) => void) => ReactNode;
    
    // === TÙY CHỈNH UI ===
    title?: string;
    icon?: ReactNode;
    description?: string;
    enableCreate?: boolean;
    enableEdit?: boolean;
    enableDelete?: boolean;
    enableView?: boolean;
    enableActiveToggle?: boolean;
    
    // === PHÂN TRANG ===
    defaultLimit?: number;
    limitOptions?: number[];
    
    // === THEME ===
    primaryColor?: string;
}
```

---

## Cấu hình Cột (ColumnConfig)

### Các kiểu cột (ColumnType)

#### 1. **text** - Hiển thị văn bản thông thường

```typescript
{
    key: "username",
    label: "Tên người dùng",
    type: "text",
}
```

#### 2. **image** - Hiển thị ảnh

```typescript
{
    key: "image_url",
    label: "Hình ảnh",
    type: "image",
}
```

#### 3. **avatar** - Hiển thị avatar với fallback

```typescript
{
    key: "avatar",
    label: "Avatar",
    type: "avatar",
    avatarKey: "avatar_url",      // Key chứa URL ảnh
    fallbackKey: "username",       // Key lấy chữ cái đầu
}
```

#### 4. **badge** - Hiển thị badge đơn

```typescript
{
    key: "role",
    label: "Vai trò",
    type: "badge",
    getBadgeConfig: (role) => {
        if (role === "admin") {
            return {
                label: "Admin",
                color: "bg-purple-500/20 text-purple-400 border-purple-500/50",
                variant: "default"
            };
        }
        return {
            label: "User",
            color: "bg-blue-500/20 text-blue-400 border-blue-500/50"
        };
    }
}
```

#### 5. **badges** - Hiển thị nhiều badge (array)

```typescript
{
    key: "tags",
    label: "Tags",
    type: "badges",
    getBadgesConfig: (tags) => tags.map(tag => ({
        label: tag,
        color: "bg-green-500/20 text-green-400 border-green-500/50"
    }))
}
```

#### 6. **switch** - Toggle switch

```typescript
{
    key: "isPublic",
    label: "Công khai",
    type: "switch",
    onToggle: async (item, newValue) => {
        await api.update(item.id, { isPublic: newValue });
    }
}
```

#### 7. **date** - Hiển thị ngày giờ

```typescript
{
    key: "created_at",
    label: "Ngày tạo",
    type: "date",
}
```

#### 8. **custom** - Tùy chỉnh hoàn toàn

```typescript
{
    key: "name",
    label: "Tên",
    type: "custom",
    render: (value, item) => (
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{value}</span>
        </div>
    )
}
```

---

## Cấu hình Bộ lọc (FilterConfig)

### Select filter

```typescript
{
    key: "role",
    label: "Vai trò",
    type: "select",
    options: [
        { label: "Tất cả", value: "" },
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" }
    ]
}
```

### Text filter

```typescript
{
    key: "email",
    label: "Email",
    type: "text"
}
```

### Date filter

```typescript
{
    key: "created_at",
    label: "Ngày tạo",
    type: "date"
}
```

---

## Ví dụ sử dụng

### 1. User Management (Với API tự động)

```typescript
import DataTable from "@/components/common/DataTable";
import { SystemAPI } from "@/api/api";

export default function UserManagement() {
    const columns = [
        {
            key: "avatar",
            label: "Avatar",
            type: "avatar",
            avatarKey: "avatar",
            fallbackKey: "username"
        },
        {
            key: "username",
            label: "Tên",
            type: "text"
        },
        {
            key: "role",
            label: "Vai trò",
            type: "badge",
            getBadgeConfig: (role) => ({
                label: role === "admin" ? "Admin" : "User",
                color: role === "admin" 
                    ? "bg-purple-500/20 text-purple-400" 
                    : "bg-blue-500/20 text-blue-400"
            })
        }
    ];

    const loadData = async (params) => {
        const response = await SystemAPI.UsersManagement({
            method: "read-all",
            page: params.page,
            limit: params.limit,
            keySearch: params.search
        });
        return { data: response.data, total: response.total };
    };

    return (
        <DataTable
            title="Quản lý User"
            columns={columns}
            onLoadData={loadData}
            apiEndpoint={SystemAPI.UsersManagement}
            enableActiveToggle={true}
            primaryColor="green"
        />
    );
}
```

### 2. Custom Actions

```typescript
const customActions = [
    {
        label: "Cấp quyền Admin",
        icon: <Shield className="h-4 w-4 mr-2" />,
        onClick: async (user) => {
            await api.grantAdmin(user.id);
        },
        className: "text-purple-400"
    },
    {
        label: "Reset Password",
        icon: <Key className="h-4 w-4 mr-2" />,
        onClick: async (user) => {
            await api.resetPassword(user.id);
        }
    }
];

<DataTable
    customActions={customActions}
    // ... other props
/>
```

### 3. Custom Detail Modal

```typescript
const renderDetailModal = (user) => (
    <div className="space-y-4">
        <div className="flex items-center gap-4">
            <img src={user.avatar} className="h-20 w-20 rounded-full" />
            <div>
                <h3 className="text-xl text-white">{user.username}</h3>
                <p className="text-gray-400">{user.email}</p>
            </div>
        </div>
        <div>
            <p className="text-gray-400">Vai trò</p>
            <p className="text-white">{user.role}</p>
        </div>
    </div>
);

<DataTable
    detailModalContent={renderDetailModal}
    detailModalTitle="Thông tin User"
    enableView={true}
    // ... other props
/>
```

### 4. Custom Form (Create/Edit)

```typescript
const renderForm = (user, onSubmit) => {
    const [formData, setFormData] = useState({
        username: user?.username || "",
        email: user?.email || ""
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
            <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
            <Input
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Button type="submit">Lưu</Button>
        </form>
    );
};

<DataTable
    formContent={renderForm}
    enableCreate={true}
    enableEdit={true}
    // ... other props
/>
```

### 5. Với Filters

```typescript
const filters = [
    {
        key: "role",
        label: "Vai trò",
        type: "select",
        options: [
            { label: "Tất cả", value: "" },
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" }
        ]
    },
    {
        key: "isActive",
        label: "Trạng thái",
        type: "select",
        options: [
            { label: "Tất cả", value: "" },
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" }
        ]
    }
];

<DataTable
    filters={filters}
    // ... other props
/>
```

---

## API Integration

### Cách 1: Sử dụng `apiEndpoint` (Tự động)

```typescript
<DataTable
    apiEndpoint={SystemAPI.UsersManagement}
    // Tự động gọi:
    // - { method: "read-all", page, limit, keySearch } - Load data
    // - { method: "create", ...data } - Tạo mới
    // - { method: "update", id, ...data } - Cập nhật
    // - { method: "delete", id } - Xóa
    // - { method: "toggle-active", id, isActive } - Toggle active
/>
```

### Cách 2: Custom Handlers

```typescript
<DataTable
    onLoadData={async (params) => {
        const res = await api.getUsers(params);
        return { data: res.data, total: res.total };
    }}
    onDelete={async (user) => {
        await api.deleteUser(user.id);
    }}
    onUpdate={async (user) => {
        await api.updateUser(user.id, user);
    }}
    onCreate={async (data) => {
        await api.createUser(data);
    }}
/>
```

---

## Tùy chỉnh Theme

```typescript
<DataTable
    primaryColor="green"   // green, blue, purple, red, orange, yellow
    // Active page button sẽ có màu bg-{primaryColor}-600
/>
```

---

## Props mặc định

```typescript
{
    enableCreate: true,
    enableEdit: true,
    enableDelete: true,
    enableView: false,
    enableActiveToggle: false,
    defaultLimit: 10,
    limitOptions: [10, 20, 50, 100],
    primaryColor: "blue",
    detailModalTitle: "Chi tiết"
}
```

---

## Lưu ý quan trọng

1. **Interface của data phải có `id` và tùy chọn `isActive`**:
   ```typescript
   interface User {
       id: number;
       isActive?: boolean;
       // ... other fields
   }
   ```

2. **onLoadData phải return `{ data: T[], total: number }`**

3. **Debounce search**: 300ms tự động

4. **Search/Filter thay đổi**: Tự động reset về trang 1

5. **Custom render**: Sử dụng `type: "custom"` với `render` function

6. **Badge colors**: Sử dụng Tailwind classes đầy đủ (bg-xxx text-xxx border-xxx)

---

## File liên quan

- Component: `src/components/common/DataTable.tsx`
- Ví dụ User: `src/components/blocks/admin/UserManagementNew.tsx`
- Ví dụ Channel: `src/components/blocks/admin/ChannelManagementNew.tsx`
