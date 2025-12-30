# Setting Up Remote Notifications

The automation runs on the mac-mini, but you can receive notifications on your macbook.

## Option 1: Remote Desktop Notifications (Recommended)

This sends desktop notifications to your macbook via SSH.

### Setup Steps:

1. **Create the config file on mac-mini:**

   ```bash
   cd /Users/jforrest/production/african-ai-trials
   cp config/notification-config.json.example config/notification-config.json
   ```

2. **Edit the config file:**

   ```bash
   nano config/notification-config.json
   ```

3. **Configure it with your macbook details:**

   ```json
   {
     "remoteDesktop": {
       "enabled": true,
       "host": "192.168.1.XXX",
       "user": "drjforrest",
       "sshKey": null
     }
   }
   ```

   - `host`: Your macbook's IP address (find with `ifconfig` or `ipconfig getifaddr en0`)
   - `user`: Your macbook username (`drjforrest`)
   - `sshKey`: Path to SSH key if needed (leave `null` if using password auth or default keys)

4. **Set up SSH access (if not already done):**

   On mac-mini, test SSH connection:

   ```bash
   ssh drjforrest@<macbook-ip>
   ```

   If it works, you're good! If not, you may need to:

   - Enable Remote Login on macbook: System Settings > General > Sharing > Remote Login
   - Set up SSH keys for passwordless access (optional but recommended)

5. **Test it:**
   ```bash
   # On mac-mini, manually trigger a notification
   cd /Users/jforrest/production/african-ai-trials
   node -e "const n = require('./scripts/notification-helper'); n.send({type: 'TEST', title: 'Test Notification', message: 'If you see this, it works!'})"
   ```

## Option 2: Email Notifications

If you prefer email notifications instead:

1. **Edit the config file:**

   ```json
   {
     "email": {
       "enabled": true,
       "to": "your-email@example.com",
       "from": "automation@african-ai-trials.net"
     }
   }
   ```

2. **Configure macOS Mail:**
   - The system uses macOS's built-in `mail` command
   - Make sure Mail is configured on the mac-mini
   - Or set up SMTP in the config for custom email servers

## Option 3: Both

You can enable both email and remote desktop notifications!

## Troubleshooting

**Remote notifications not working:**

- Check SSH connection: `ssh drjforrest@<macbook-ip>`
- Verify macbook IP hasn't changed (check with `ifconfig` on macbook)
- Check firewall settings on macbook
- Look for errors in `/tmp/ai-trials-automation.err`

**Email not working:**

- Verify Mail app is configured on mac-mini
- Check `/tmp/ai-trials-automation.err` for email errors
- Consider using a service like SendGrid or Mailgun for more reliable delivery

## Notes

- Notifications are always saved to `data/notifications.json` regardless of config
- Remote desktop notifications require the macbook to be on the same network
- If macbook is offline, notifications will fail silently (but still be saved to file)
