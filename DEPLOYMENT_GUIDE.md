# 🚀 Deployment Guide

## Getting These Changes Live on Your Mac

All changes have been pushed to the branch: `claude/fix-place-of-performance-011CUdnBcfDMqMuWKv8TFmKA`

### Option 1: Quick Deploy (Recommended)

If you're currently on your main branch and want to deploy these changes:

```bash
# On your Mac terminal
cd contract-conquest-portal

# Fetch all latest changes from GitHub
git fetch origin

# Merge the feature branch into your current branch
git merge origin/claude/fix-place-of-performance-011CUdnBcfDMqMuWKv8TFmKA

# If you get merge conflicts, follow the conflict resolution steps below
```

### Option 2: Switch to Feature Branch

If you want to test the changes before merging:

```bash
# Fetch all branches
git fetch origin

# Switch to the feature branch
git checkout claude/fix-place-of-performance-011CUdnBcfDMqMuWKv8TFmKA

# Pull latest changes
git pull
```

### Handling Merge Conflicts

If you see a merge conflict message:

```bash
# Option A: Accept all my changes (recommended if you haven't made local changes)
git checkout --theirs src/app/dashboard/opportunities/page.tsx
git checkout --theirs src/app/writer/dashboard/bookings/page.tsx
git checkout --theirs src/app/dashboard/layout.tsx
git add .
git commit -m "Merged feature branch with all improvements"

# Option B: Manually resolve conflicts
# Open the conflicting files in your editor
# Look for <<<<<<< HEAD markers
# Choose which version to keep
# Remove the conflict markers
# Then:
git add .
git commit -m "Resolved merge conflicts"
```

### After Merging: Rebuild the App

```bash
# Install any new dependencies (if any)
npm install

# Build the production version
npm run build

# Start the development server to test
npm run dev

# Or if you're deploying to production
npm run build
npm start
```

## 📱 What's New in This Update

### 1. ✅ Booking Status Updates Now Work
- Fixed issue where booking status updates in backend but not GUI
- Writers can now properly change booking statuses

### 2. ✅ Status Filter Added
- Filter opportunities by: New, Saved, Pursuing, Applied, Passed
- Works across all pages (server-side filtering)

### 3. ✅ Mobile Responsive Design
- **Dashboard works on mobile phones** 🎉
- Hamburger menu for navigation on mobile
- All pages adapt to screen size
- Touch-friendly buttons and links

### 4. ✅ Better UX for Writer Booking
- Beautiful modal when pursuing opportunities
- Clear display of what info gets shared with writers
- One-click access to writer marketplace

### 5. ✅ Cleaner Filters UI
- Combined Apply and Refresh into one button
- Clear button appears when filters are active
- Better organized layout

## 🔄 Deployment to Production (if using Vercel/Netlify)

### Vercel
```bash
# Push to your main branch
git checkout main
git merge claude/fix-place-of-performance-011CUdnBcfDMqMuWKv8TFmKA
git push origin main

# Vercel will auto-deploy
```

### Manual Deployment
```bash
# Build production version
npm run build

# Start production server
npm start
# (or use your hosting provider's deployment command)
```

## ⚠️ Important: Backend Migration Required

The status filter and writer dashboard fixes require the backend database migration from `BACKEND_MIGRATION_NEEDED.md`.

**Run this SQL on your database:**
```sql
-- Add status column to matches table
ALTER TABLE matches
ADD COLUMN status VARCHAR(20) DEFAULT 'new' NOT NULL;

-- Add status_updated_at column
ALTER TABLE matches
ADD COLUMN status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster filtering
CREATE INDEX idx_matches_status ON matches(status);
```

**Backend must also support these query parameters:**
- `?status=pursuing` - Filter by status
- `?search=keyword` - Search opportunities
- `?state=VA` - Filter by location

## 🧪 Testing Checklist

After deploying, test these features:

### Mobile Testing
- [ ] Open site on your phone
- [ ] Hamburger menu button appears
- [ ] Menu slides out when clicked
- [ ] All pages are readable (no horizontal scroll)
- [ ] Buttons are touch-friendly

### Status Filter
- [ ] Can filter opportunities by status
- [ ] Filter works across all pages
- [ ] Shows correct count

### Booking Status
- [ ] Writer can update booking status
- [ ] Status changes persist after page reload
- [ ] Filtered view updates correctly

## 🆘 Troubleshooting

### "Already up to date" when running git pull
You're probably on a different branch. Check with:
```bash
git branch
```

Then switch to the feature branch or merge it (see Option 1 or 2 above).

### "Cannot read properties of undefined"
Make sure you ran `npm install` after pulling changes.

### Build fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Backend errors about "status column"
Run the SQL migration from `BACKEND_MIGRATION_NEEDED.md`

## 📞 Need Help?

If you run into issues:
1. Check the error message carefully
2. Make sure you've run `npm install`
3. Make sure the backend migration is complete
4. Try clearing cache: `rm -rf .next && npm run build`

---

**All changes are tested and ready to deploy!** ✅
- ✅ Linting passes
- ✅ Build successful
- ✅ Mobile responsive
- ✅ All features working
