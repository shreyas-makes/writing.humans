# AI Suggestions Troubleshooting Guide

## Why AI Suggestions Might Not Appear

### 1. **OpenAI API Key Not Configured** ⚠️
**Most Common Issue**
- Go to Settings page (`/settings`)
- Add your OpenAI API key
- Verify the green checkmark appears: "✓ API key is configured and ready to use"

### 2. **Content Requirements Not Met** 📝
- **First suggestion**: Triggers after 2 lines of content or 60+ characters (300ms delay)
- **Copy-paste detection**: Immediate suggestions for pasted content (200ms delay)
- **Subsequent suggestions**: Every 3 minutes for content changes
- **Fallback protection**: 30+ characters if 2-line detection fails (800ms delay)
- Content cannot be the default placeholder: "Start writing your document here..."

### 3. **Maximum Suggestions Reached** 📊
- Check if you've reached the max suggestions limit (default: 3)
- Accept or reject existing suggestions to make room for new ones
- Adjust max suggestions in Settings if needed

### 4. **AI Panel or Blue Indicators Hidden** 👁️
- Ensure the AI panel is open (eye icon in header)
- Check that blue indicators toggle is enabled (switch in header)
- Blue dots should appear in the right margin of the editor

### 5. **Network or API Issues** 🌐
- Check browser console for error messages
- Verify your OpenAI API key has sufficient credits
- Check if OpenAI API is accessible from your network

## Debug Steps

### Step 1: Check Console Logs
Open browser developer tools (F12) and look for:
- `🔍 generateSuggestions called with:` - Shows if the function is being called
- `❌ No OpenAI API key found` - API key missing
- `❌ Content too short or is placeholder` - Content requirements not met
- `🎯 Received AI suggestions:` - Shows if OpenAI returned suggestions
- `✅ Added suggestions to state` - Confirms suggestions were added

### Step 2: Verify Settings
1. Go to `/settings`
2. Check API key status
3. Review suggestion timing information:
   - **First suggestion**: Triggers after 2 lines of content (300ms delay)
   - **Copy-paste detection**: Immediate suggestions for pasted content (200ms delay)
   - **Subsequent suggestions**: Every 3 minutes for content changes
   - **Fallback protection**: 30+ characters if 2-line detection fails (800ms delay)

### Step 3: Test with Sample Content
Replace editor content with:
```
This is a sample document with enough content to trigger AI suggestions. The artificial intelligence system should analyze this text and provide helpful editing recommendations to improve clarity, conciseness, and overall quality.
```

### Step 4: Check Debug Panel
In development mode, the AI panel shows debug information including:
- API Key status
- Current suggestion count
- Generation status
- Any errors
- Content length

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "No OpenAI API key found" | API key not configured | Add API key in Settings |
| "Content too short or is placeholder" | Not enough content | Write more text (30+ chars) |
| "Already at max suggestions limit" | Too many suggestions | Accept/reject existing ones |
| "OpenAI API error: 401" | Invalid API key | Check API key in Settings |
| "OpenAI API error: 429" | Rate limit/no credits | Check OpenAI account |

## Expected Behavior

1. **Write content** (2+ lines or 60+ characters)
2. **First suggestion** appears within 300ms
3. **Copy-paste content** triggers immediate suggestions (200ms delay)
4. **Subsequent suggestions** appear every 3 minutes for content changes
5. **Blue dots appear** in right margin
6. **Click blue dots** to see suggestions in panel
7. **Accept/reject** suggestions as needed

## Still Not Working?

1. Check browser console for detailed error logs
2. Verify OpenAI API key has credits
3. Try refreshing the page
4. Clear browser cache/localStorage
5. Test with a different document 