# Email Setup Guide (Firebase Trigger Email Extension)

All invite emails (employee setup, driver approval, kitchen approval) write to the `mail` Firestore collection.
To actually send them, install the **Trigger Email** Firebase Extension.

## Steps

1. Go to [Firebase Console](https://console.firebase.google.com) → your project → **Extensions**
2. Search for **"Trigger Email"** and click **Install**
3. During setup, provide your SMTP credentials:
   - **SMTP connection URI**: `smtps://user@gmail.com:password@smtp.gmail.com:465`
   - Or use a transactional email service like **SendGrid**, **Mailgun**, or **Resend**
4. Set **Email documents collection** to: `mail`
5. Set **Default FROM address** to: `noreply@smag.ng` (or your domain)
6. Complete installation

## Using SendGrid (recommended for production)

```
SMTP URI: smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
```

## Using Gmail (for testing only)

1. Enable 2FA on your Google account
2. Create an App Password at https://myaccount.google.com/apppasswords
3. Use: `smtps://your@gmail.com:APP_PASSWORD@smtp.gmail.com:465`

## Firestore `mail` document format

The extension reads documents in this shape (already used by all Cloud Functions):

```json
{
  "to": "recipient@example.com",
  "message": {
    "subject": "Your subject line",
    "html": "<h1>HTML body</h1>"
  }
}
```

## Verify it works

After installing, add a test document to the `mail` collection manually in the Firebase Console.
The extension will process it and update the document with a `delivery` field showing the result.

## Collections that write to `mail`

- `sendEmployeeInvite` — staff setup link
- `approveDriverApplication` — driver approval + setup link
- `rejectDriverApplication` — driver rejection notice
- `approveKitchenApplication` — kitchen approval + setup link
- `rejectKitchenApplication` — kitchen rejection notice
