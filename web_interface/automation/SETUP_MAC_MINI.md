# Setup Instructions for Mac Mini

## Quick Setup Steps

1. **Copy the LaunchAgent plist file:**
   ```bash
   cp /Users/jforrest/production/african-ai-trials/automation/com.ai-trials-africa.automation.plist ~/Library/LaunchAgents/
   ```
   
   **Important:** Before loading, check that the node path in the plist is correct:
   ```bash
   which node
   ```
   
   If it's different, edit the plist:
   ```bash
   nano ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
   ```
   
   Update the path in `ProgramArguments[0]` to match your `which node` output.

2. **Load the LaunchAgent:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
   ```

3. **Verify it's loaded:**
   ```bash
   launchctl list | grep ai-trials-africa
   ```

4. **Check the logs:**
   ```bash
   tail -f /tmp/ai-trials-automation.out
   tail -f /tmp/ai-trials-automation.err
   ```

## What It Does

- Runs automatically **every 24 hours** (86400 seconds)
- Scans ClinicalTrials.gov for new AI diagnostic trials
- Saves new trials to `data/pending-verification.json`
- Sends desktop notifications when new trials are found
- Updates database and frontend data automatically

## Manual Commands

**Test the automation manually:**
```bash
cd /Users/jforrest/production/african-ai-trials
npm run automation:run
```

**Check registries only:**
```bash
npm run registry:check
```

**Verify pending trials:**
```bash
npm run verify:trials
```

## Managing the Service

**Stop the automation:**
```bash
launchctl unload ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
```

**Restart the automation:**
```bash
launchctl unload ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
launchctl load ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
```

**Check if it's running:**
```bash
launchctl list | grep ai-trials-africa
```

## Change Frequency

To change how often it runs, edit the plist:
```bash
nano ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
```

Change `StartInterval`:
- `3600` = every hour
- `86400` = every day (current)
- `604800` = every week

Then reload:
```bash
launchctl unload ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
launchctl load ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
```

## Troubleshooting

**If automation isn't running:**
1. Check logs: `tail -f /tmp/ai-trials-automation.err`
2. Verify node path is correct in the plist
3. Make sure the working directory path is correct
4. Try running manually first: `npm run automation:run`

**If notifications aren't working:**
- Check System Preferences > Notifications
- Notifications are also saved to `data/notifications.json`

