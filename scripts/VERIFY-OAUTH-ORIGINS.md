# Verify OAuth Client ID JavaScript Origins

## Quick Verification Checklist

Go to your OAuth Client ID configuration page:
**Link**: https://console.cloud.google.com/apis/credentials?project=countcard-94c5b

Then click on "Web client (auto created by Google Service)" to open the configuration.

---

## ✅ What Should Be in "Authorized JavaScript Origins"

You should see **ALL** of these origins listed:

### Required Origins:
- [ ] `http://localhost`
- [ ] `http://localhost:5000`
- [ ] `http://localhost:3000` ← **This is the one you just added**
- [ ] `https://countcard-94c5b.firebaseapp.com`
- [ ] `https://countcard.warriorwaypoint.com` ← **This is the one you just added**

### Optional (But Good to Have):
- [ ] `https://countcard-94c5b.web.app` (if using Firebase Hosting)

---

## ✅ What Should Be in "Authorized Redirect URIs"

You should see:

- [ ] `https://countcard-94c5b.firebaseapp.com/_/auth/handler`

**Note**: Firebase automatically handles redirects, so you typically only need the Firebase auth handler URI. However, if you're implementing custom OAuth flows, you might also need:
- [ ] `http://localhost:3000` (for custom development flows)
- [ ] `https://countcard.warriorwaypoint.com` (for custom production flows)

---

## Visual Verification

When you look at the "Authorized JavaScript Origins" section, you should see something like:

```
Authorized JavaScript origins (for requests from a browser)
+ Add URI

http://localhost
http://localhost:5000
http://localhost:3000          ← Should be here
https://countcard-94c5b.firebaseapp.com
https://countcard.warriorwaypoint.com  ← Should be here
```

---

## If Something is Missing

### If `http://localhost:3000` is Missing:
1. Click **"+ Add URI"**
2. Enter: `http://localhost:3000`
3. Click outside the input or press Enter
4. Click **"Save"** at the bottom

### If `https://countcard.warriorwaypoint.com` is Missing:
1. Click **"+ Add URI"**
2. Enter: `https://countcard.warriorwaypoint.com`
3. Click outside the input or press Enter
4. Click **"Save"** at the bottom

---

## After Saving

1. **Wait 1-2 minutes** for changes to propagate
2. **Clear your browser cache** (or use incognito mode)
3. **Test authentication** in your app:
   - Try Google Sign-In on `http://localhost:3000`
   - Try Google Sign-In on `https://countcard.warriorwaypoint.com` (if deployed)

---

## Common Issues After Adding Origins

### Issue: "Still getting origin_mismatch error"
**Solutions**:
- Wait 2-3 minutes for changes to propagate
- Clear browser cache completely
- Try in incognito/private browsing mode
- Double-check the exact URL matches (including `http://` vs `https://`)

### Issue: "Changes not saving"
**Solutions**:
- Make sure you clicked "Save" at the bottom of the page
- Check if you have proper permissions (Owner or Editor role)
- Try refreshing the page and adding again

---

## Quick Test

After verifying the origins are added, test authentication:

1. **Development Test**:
   - Go to `http://localhost:3000/login`
   - Click "Sign in with Google"
   - Should work without "origin_mismatch" error

2. **Production Test** (if deployed):
   - Go to `https://countcard.warriorwaypoint.com/login`
   - Click "Sign in with Google"
   - Should work without "origin_mismatch" error

---

## Still Need Help?

If you want me to verify, you can:
1. Take a screenshot of the "Authorized JavaScript Origins" section
2. Or list the origins you see
3. I can confirm if everything is correct
