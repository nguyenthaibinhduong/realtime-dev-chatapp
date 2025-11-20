# Message Components - Hướng dẫn sử dụng

## 📁 Cấu trúc thư mục

```
type/
├── messageStyles.ts      # Shared styles, colors, và constants
├── MessageWrapper.tsx    # Wrapper components dùng chung
├── MessageItem.tsx       # Component message text thông thường
├── CodeCardMessage.tsx   # Component hiển thị code card
├── CodeShareMessage.tsx  # Component chia sẻ code từ GitHub
├── ToolShareMessage.tsx  # Component chia sẻ API request
└── NotificationMessage.tsx # Component thông báo hệ thống
```

## 🎨 Chuẩn hóa UX/UI

### 1. **messageStyles.ts** - Shared Styles

File này chứa tất cả các constants, colors, và helper functions dùng chung:

#### Colors
```typescript
import { COLORS } from './messageStyles';

// Background colors
COLORS.bg.me              // Màu nền tin nhắn của mình
COLORS.bg.other           // Màu nền tin nhắn người khác
COLORS.bg.card            // Màu nền card

// Text colors
COLORS.text.primary       // text-white
COLORS.text.secondary     // text-gray-200
COLORS.text.muted         // text-gray-400
COLORS.text.timestamp     // text-gray-400

// Border colors
COLORS.border.default     // border-gray-700
COLORS.border.hover       // border-gray-600
```

#### Typography
```typescript
import { TYPOGRAPHY } from './messageStyles';

TYPOGRAPHY.size.xs        // text-[10px]
TYPOGRAPHY.size.sm        // text-[11px]
TYPOGRAPHY.size.base      // text-[13px]
TYPOGRAPHY.weight.medium  // font-medium
TYPOGRAPHY.weight.semibold // font-semibold
```

#### Layout
```typescript
import { LAYOUT } from './messageStyles';

LAYOUT.maxWidth.message   // max-w-[65%]
LAYOUT.maxWidth.card      // max-w-[600px]
LAYOUT.avatar.sm          // 24px
LAYOUT.avatar.md          // 32px
```

#### Helper Functions
```typescript
import {
  formatMessageTime,           // Format time consistently
  getMessageBubbleClasses,     // Get classes cho message bubble
  getCardClasses,              // Get classes cho card
  getTimestampClasses,         // Get classes cho timestamp
  getUsernameClasses,          // Get classes cho username
  getStatusColorClasses,       // Get color cho HTTP status codes
} from './messageStyles';

// Example usage:
const time = formatMessageTime(message.created_at);
const classes = getMessageBubbleClasses(isMe, isHovered);
```

### 2. **MessageWrapper.tsx** - Wrapper Components

#### MessageWrapper (Base)
```typescript
import { MessageWrapper } from './MessageWrapper';

<MessageWrapper
  messageId={message.id}
  sender={message.sender}
  isMe={isMe}
  showSenderInfo={showSenderInfo}
  hoveredId={hoveredId}
  onHover={onHover}
>
  {/* Your message content */}
</MessageWrapper>
```

#### CardMessageWrapper (For cards)
```typescript
import { CardMessageWrapper } from './MessageWrapper';

<CardMessageWrapper
  messageId={message.id}
  sender={message.sender}
  isMe={isMe}
  showSenderInfo={showSenderInfo}
  maxWidth="card"    // or 'cardLarge', 'message'
  minWidth="card"
>
  {/* Your card content */}
</CardMessageWrapper>
```

#### SimpleMessageWrapper (For simple messages)
```typescript
import { SimpleMessageWrapper } from './MessageWrapper';

<SimpleMessageWrapper
  messageId={message.id}
  sender={message.sender}
  isMe={isMe}
  showSenderInfo={showSenderInfo}
>
  {/* Simple content */}
</SimpleMessageWrapper>
```

## 📝 Quy tắc sử dụng

### 1. Màu sắc
- **LUÔN** sử dụng colors từ `COLORS` constant
- **KHÔNG** hardcode màu trực tiếp trong component
- Sử dụng `cn()` để combine classes

```typescript
// ✅ ĐÚNG
<div className={cn(COLORS.text.primary, COLORS.bg.card)}>

// ❌ SAI
<div className="text-white bg-gray-900">
```

### 2. Typography
- Sử dụng `TYPOGRAPHY.size.*` cho font size
- Sử dụng `TYPOGRAPHY.weight.*` cho font weight

```typescript
// ✅ ĐÚNG
<span className={cn(TYPOGRAPHY.size.xs, TYPOGRAPHY.weight.medium)}>

// ❌ SAI
<span className="text-[10px] font-medium">
```

### 3. Layout & Spacing
- Sử dụng `LAYOUT` constants cho max/min width
- Sử dụng `SPACING` constants cho padding/margin/gap

```typescript
// ✅ ĐÚNG
<div className={cn(LAYOUT.maxWidth.card, SPACING.padding.card)}>

// ❌ SAI
<div className="max-w-[600px] p-4">
```

### 4. Format Time
- **LUÔN** sử dụng `formatMessageTime()` function

```typescript
// ✅ ĐÚNG
import { formatMessageTime } from './messageStyles';
const time = formatMessageTime(message.created_at);

// ❌ SAI
const time = new Date(message.created_at).toLocaleTimeString(...);
```

### 5. Message Wrapper
- **SỬ DỤNG** `MessageWrapper` hoặc variants của nó
- Đảm bảo avatar và username nhất quán

```typescript
// ✅ ĐÚNG - Sử dụng wrapper
<CardMessageWrapper {...commonProps}>
  <YourContent />
</CardMessageWrapper>

// ❌ SAI - Tự implement layout
<div className="flex">
  <Avatar />
  <div>...</div>
</div>
```

## 🔄 Migration Guide

### Cập nhật component hiện có

1. **Import shared styles**
```typescript
import {
  COLORS,
  TYPOGRAPHY,
  LAYOUT,
  formatMessageTime,
  getCardClasses,
} from './messageStyles';
```

2. **Thay thế hardcoded values**
```typescript
// Before:
className="text-white bg-gray-900 text-[14px]"

// After:
className={cn(COLORS.text.primary, COLORS.bg.card, TYPOGRAPHY.size.md)}
```

3. **Sử dụng MessageWrapper**
```typescript
// Before:
<div className="flex my-3">
  {!isMe && <Avatar user={sender} />}
  <div className="flex flex-col">
    <span>{sender.username}</span>
    {children}
  </div>
</div>

// After:
<MessageWrapper {...props}>
  {children}
</MessageWrapper>
```

## ✨ Best Practices

### DO ✅
- Luôn import từ `messageStyles.ts`
- Sử dụng `cn()` để combine classes
- Sử dụng `MessageWrapper` variants
- Format time với `formatMessageTime()`
- Sử dụng semantic color names (primary, secondary, muted)

### DON'T ❌
- Hardcode colors, sizes, spacing
- Tự implement message layout
- Duplicate helper functions
- Inline styles trừ khi cần thiết
- Inconsistent time formatting

## 🎯 Examples

### Example 1: Simple Text Message
```typescript
import { SimpleMessageWrapper, getMessageBubbleClasses } from './messageStyles';

<SimpleMessageWrapper {...props}>
  <div className={getMessageBubbleClasses(isMe, isHovered)}>
    <p>{message.text}</p>
    <span className={getTimestampClasses(isMe)}>
      {formatMessageTime(message.created_at)}
    </span>
  </div>
</SimpleMessageWrapper>
```

### Example 2: Card Message
```typescript
import { CardMessageWrapper, getCardClasses, COLORS } from './messageStyles';

<CardMessageWrapper {...props} maxWidth="card">
  <div className={getCardClasses(isMe, isHovered)}>
    <div className={cn("p-4", COLORS.bg.card)}>
      {/* Card content */}
    </div>
  </div>
</CardMessageWrapper>
```

### Example 3: Code Block
```typescript
import { LANGUAGE_MAP, COLORS, TYPOGRAPHY } from './messageStyles';

const langInfo = LANGUAGE_MAP[language] || LANGUAGE_MAP.plaintext;

<div className={cn(COLORS.bg.overlay, "p-4")}>
  <span className={cn(TYPOGRAPHY.size.xs, langInfo.color)}>
    {langInfo.icon} {langInfo.name}
  </span>
  <pre>{code}</pre>
</div>
```

## 🚀 Performance Tips

1. Import chỉ những gì cần:
```typescript
// ✅ ĐÚNG
import { COLORS, formatMessageTime } from './messageStyles';

// ❌ SAI
import * as styles from './messageStyles';
```

2. Memoize components khi cần:
```typescript
export const YourMessage = memo(({ ... }) => {
  // ...
});
```

3. Sử dụng `cn()` hiệu quả:
```typescript
// Combine multiple utility classes
const classes = cn(
  COLORS.text.primary,
  TYPOGRAPHY.size.base,
  "custom-class"
);
```

## 📞 Support

Nếu cần thêm colors, typography, hoặc helpers mới:
1. Thêm vào `messageStyles.ts`
2. Export và document
3. Update README này

---

**Note**: File này đảm bảo tất cả message components có UX/UI nhất quán, dễ maintain và scale.
