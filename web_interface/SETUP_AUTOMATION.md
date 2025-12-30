# Setting Up Automated Registry Scanning

This guide will help you set up the automated registry scanning system that continuously monitors clinical trial registries and notifies you when new trials are discovered.

## What It Does

The automation system:
1. **Scans registries** (ClinicalTrials.gov, PACTR, WHO ICTRP) for new AI diagnostic trials in Sub-Saharan Africa
2. **Saves new trials** to `data/pending-verification.json` for manual review
3. **Sends notifications** when new trials are discovered (desktop notifications + saved to `data/notifications.json`)
4. **Updates the database** when you verify and add trials
5. **Regenerates frontend data** automatically

## Quick Setup

### macOS (LaunchAgent)

1. **Copy the LaunchAgent plist file:**
   ```bash
   cp web_interface/automation/com.ai-trials-africa.automation.plist ~/Library/LaunchAgents/
   ```

2. **Edit the plist file** to update the paths:
   ```bash
   nano ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
   ```
   
   Update:
   - `WorkingDirectory` - should point to your `web_interface` directory
   - `ProgramArguments[0]` - path to `node` (check with `which node`)

3. **Load the LaunchAgent:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
   ```

4. **Check if it's running:**
   ```bash
   launchctl list | grep ai-trials-africa
   ```

5. **View logs:**
   ```bash
   tail -f /tmp/ai-trials-automation.out
   tail -f /tmp/ai-trials-automation.err
   ```

6. **To stop:**
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
   ```

### Linux (systemd)

1. **Copy the service file:**
   ```bash
   sudo cp web_interface/automation/ai-trials-automation.service /etc/systemd/system/
   ```

2. **Edit the service file:**
   ```bash
   sudo nano /etc/systemd/system/ai-trials-automation.service
   ```
   
   Update:
   - `User` - your username
   - `WorkingDirectory` - path to your `web_interface` directory
   - `ExecStart` - path to `node` (check with `which node`)

3. **Create a timer for daily runs:**
   ```bash
   sudo nano /etc/systemd/system/ai-trials-automation.timer
   ```
   
   Add:
   ```ini
   [Unit]
   Description=Run AI Trials Automation Daily
   Requires=ai-trials-automation.service
   
   [Timer]
   OnCalendar=daily
   Persistent=true
   
   [Install]
   WantedBy=timers.target
   ```

4. **Enable and start:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable ai-trials-automation.timer
   sudo systemctl start ai-trials-automation.timer
   ```

5. **Check status:**
   ```bash
   sudo systemctl status ai-trials-automation.timer
   sudo systemctl list-timers | grep ai-trials
   ```

## Manual Testing

Before setting up automation, test it manually:

```bash
cd web_interface
npm run automation:run
```

This will:
- Check registries for new trials
- Save any new trials to `data/pending-verification.json`
- Send notifications if new trials are found
- Update database and frontend data

## Configuration

Edit `web_interface/config/registry-config.json` to customize:

- `checkIntervalHours` - How often to check (default: 24 hours)
- Enable/disable specific registries
- Rate limiting settings

## Notifications

Notifications are sent when:
- **New trials discovered** in registries (saved for verification)
- **Trials added to database** (after verification)
- **Trials completed**
- **New institutions/companies** join the network

Notifications are:
- **Desktop notifications** (macOS/Linux)
- **Saved to** `web_interface/data/notifications.json`
- **Logged to console**

## Verification Workflow

When new trials are discovered:

1. **Review pending trials:**
   ```bash
   npm run verify:trials
   ```

2. **Check the pending file:**
   ```bash
   cat data/pending-verification.json
   ```

3. **Verify each trial** against inclusion criteria (see `AUTOMATION_GUIDE.md`)

4. **Add verified trials** to the database using the verification tool

5. **Database monitor** will automatically detect changes and update frontend data

## Troubleshooting

### Automation not running

**macOS:**
```bash
# Check if loaded
launchctl list | grep ai-trials-africa

# Check logs
tail -f /tmp/ai-trials-automation.out
tail -f /tmp/ai-trials-automation.err

# Reload if needed
launchctl unload ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
launchctl load ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
```

**Linux:**
```bash
# Check timer status
sudo systemctl status ai-trials-automation.timer

# Check service logs
sudo journalctl -u ai-trials-automation.service -f

# Manually trigger
sudo systemctl start ai-trials-automation.service
```

### No notifications

- Check that desktop notifications are enabled in your OS settings
- Check `data/notifications.json` - notifications are always saved there
- On Linux, ensure `notify-send` is installed: `sudo apt-get install libnotify-bin`

### Registry API errors

- ClinicalTrials.gov API is public and should work
- PACTR and WHO ICTRP may require API credentials (see `AUTOMATION_GUIDE.md`)

## Schedule Customization

### Change frequency (macOS)

Edit the plist file and change `StartInterval`:
- `3600` = every hour
- `86400` = every day (default)
- `604800` = every week

### Change frequency (Linux)

Edit the timer file and change `OnCalendar`:
- `OnCalendar=hourly` = every hour
- `OnCalendar=daily` = every day (default)
- `OnCalendar=weekly` = every week
- `OnCalendar=monthly` = every month

## Next Steps

1. ✅ Set up scheduled automation (see above)
2. ⏳ Get API credentials for PACTR and WHO ICTRP (if needed)
3. ⏳ Test the full workflow manually first
4. ⏳ Monitor the first few automated runs
5. ⏳ Review and verify discovered trials regularly

---

**Status:** ✅ Ready to use - just needs to be set up and activated!

