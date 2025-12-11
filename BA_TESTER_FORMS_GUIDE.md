# BA Requirement & Tester Debug Report - Setup Guide

## 📦 Required Package Installation

Run this command to install the rich text editor:

```bash
npm install react-quill @types/react-quill
# or if using bun
bun add react-quill @types/react-quill
```

## 🎯 Features Implemented

### 3 Function Buttons (Above Input Area)
1. **BA Requirement** - Create project requirements
2. **Debug Report** - Report bugs and issues  
3. **AI Assistant** - Coming soon (disabled)

### BA Requirement Form
✅ **Required Fields:**
- Tên dự án / Khách hàng (Project Name - required)
- Danh sách yêu cầu (Requirements list - min 1 item, press Enter to add)
- Người phụ trách (Assignees - min 1 person)

✅ **Optional Fields:**
- Tài liệu đính kèm (Attachments - PDF, DOCX, XLSX, JPG, PNG)
- Tin nhắn liên quan (Related messages - searchable)
- Ghi chú (Notes)

✅ **UX Enhancements:**
- Quick add requirements with Enter key
- Visual file preview with remove button
- Searchable member selection with checkboxes
- Searchable message selection
- Real-time validation feedback
- Professional dark theme UI

### Tester Debug Report Form
✅ **Required Fields:**
- Tên dự án OR Yêu cầu gốc (Project Name OR Related Message - one required)
- Nội dung (Content - Rich text editor)
- Người phụ trách (Assignees - min 1 person)

✅ **Optional Fields:**
- Tài liệu đính kèm (Attachments - screenshots, logs)
- Ghi chú (Notes)
- Đồng bộ Google Sheet (Toggle sync feature)
- Link Drive (Storage link)

✅ **UX Enhancements:**
- Rich text editor with formatting (bold, italic, lists, colors, code blocks)
- Image preview for screenshots
- Toggle between Project Name and Message selection
- Google Sheet sync toggle
- Professional bug report UI with red theme

## 🎨 UI/UX Improvements

### Function Buttons
- Positioned above input area for easy access
- Color-coded: Blue (BA), Red (Debug), Purple (AI)
- Hover effects and smooth transitions
- Icons for quick recognition

### Form Modals
- Full-screen overlay with backdrop blur
- Smooth animations on open/close
- ScrollArea for long forms
- Professional dark theme (#0f1419)
- Clear sections with labels
- Inline validation errors
- Sticky header and footer

### Form Fields
- Auto-focus on first input
- Enter key shortcuts
- Real-time search/filter
- Visual feedback on hover/select
- File preview with remove buttons
- Checkbox selections with avatar display
- Badge display for selected items

## 📝 Data Logging

Both forms log complete data to console on submit:

### BA Requirement Log:
```javascript
{
  projectName: string,
  requirements: string[],
  attachments: File[],
  assignees: string[],
  relatedMessages: string[],
  notes: string
}
```

### Tester Debug Log:
```javascript
{
  projectName: string,
  relatedMessageId?: string,
  content: string (HTML),
  attachments: File[],
  assignees: string[],
  notes: string,
  syncGoogleSheet: boolean,
  driveLink: string
}
```

## 🔄 Integration with MessageInput

Updated `MessageInput.tsx` to:
- Accept `channelMembers` and `channelMessages` props
- Handle BA Requirement submit
- Handle Tester Debug submit
- Display function buttons row
- Open/close form modals

## 🚀 Usage Example

```tsx
<MessageInput
  channelId={channel.id}
  onSend={handleSend}
  channelMembers={members}
  channelMessages={messages}
  // ... other props
/>
```

## 📦 File Structure

```
src/components/blocks/messages/
├── MessageInput.tsx (updated)
├── BARequirementForm.tsx (new)
└── TesterDebugForm.tsx (new)
```

## 🎯 Next Steps

1. Install `react-quill` package
2. Test form validation
3. Integrate with backend API
4. Add Google Sheet sync functionality
5. Implement message type rendering for BA/Debug messages
6. Add AI Assistant feature


