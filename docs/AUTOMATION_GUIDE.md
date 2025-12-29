# Automated Registry Monitoring Guide

This guide explains how to use the automated registry monitoring system that implements the Living Systematic Review Platform (LSRP) described in the protocol.

## Overview

The system automatically scans clinical trial registries to discover new AI diagnostic trials in Sub-Saharan Africa, following the exact search strategies from the protocol (SUPPLEMENTARY_METHODS.md).

## Components

### 1. Registry Monitor (`registry-monitor-n11.js`)
- Scans ClinicalTrials.gov, PACTR, and WHO ICTRP
- Uses protocol search strategies
- Saves new trials for manual verification

### 2. Master Automation (`master-automation-n11.js`)
- Orchestrates the full workflow
- Checks registries → Saves for verification → Updates database → Updates frontend

### 3. Manual Verification Tool (`verify-trials.js`)
- Implements dual-reviewer verification workflow
- Checks inclusion criteria per protocol
- Adds verified trials to database

### 4. Database Monitor (`monitor-database.js`)
- Watches for database changes
- Updates JSON data automatically
- Sends notifications

## Quick Start

### Run Registry Check
```bash
npm run registry:check
```

This will:
1. Check ClinicalTrials.gov for new trials
2. Check PACTR (when API available)
3. Check WHO ICTRP (when API available)
4. Save new trials to `data/pending-verification.json`

### Verify Trials Manually
```bash
npm run verify:trials
```

This interactive tool guides you through verifying each pending trial against the protocol's inclusion criteria.

### Run Full Automation
```bash
npm run automation:run
```

This runs the complete workflow:
1. Check registries
2. Process database changes
3. Update frontend JSON data

## Workflow

### Step 1: Automatic Registry Scanning

The system scans registries using the exact search strategies from the protocol:

**ClinicalTrials.gov:**
```
(artificial intelligence OR machine learning OR deep learning OR neural network OR 
computer vision OR AI OR ML OR DL) AND (diagnostic OR diagnosis OR screening OR 
detection OR test) AND [Sub-Saharan African country]
```

**PACTR:**
- Multiple individual searches (PACTR doesn't support Boolean)
- "artificial intelligence" + "diagnostic"
- "machine learning" + "screening"
- etc.

**WHO ICTRP:**
- Intervention: AI keywords
- Countries: Sub-Saharan Africa

### Step 2: Manual Verification

Per protocol Section 1, two independent reviewers verify each trial:

**Inclusion Criteria:**
1. ✅ Conducted entirely or partially in Sub-Saharan Africa
2. ✅ Evaluates AI diagnostic technology as primary intervention
3. ✅ Involves prospective human participants
4. ✅ Registered in recognized clinical trial registry
5. ✅ Sufficient documentation to extract institutional relationships

**Exclusion Criteria:**
- Non-diagnostic application (e.g., treatment optimization)
- Insufficient Sub-Saharan African presence
- Withdrawn before enrollment
- Insufficient documentation

### Step 3: Database Update

Verified trials are added to the database, and the frontend JSON is automatically updated.

## Configuration

Edit `config/registry-config.json`:

```json
{
  "checkIntervalHours": 24,
  "registries": {
    "clinicalTrials": {
      "enabled": true,
      "baseUrl": "https://clinicaltrials.gov/api/v2/studies"
    },
    "pactr": {
      "enabled": true
    },
    "whoIctrp": {
      "enabled": true
    }
  },
  "verification": {
    "requireManualReview": true,
    "autoAddVerified": false
  }
}
```

## Scheduled Automation

### macOS (LaunchAgent)

Create `~/Library/LaunchAgents/com.ai-trials-africa.automation.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ai-trials-africa.automation</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/path/to/web_interface/scripts/master-automation-n11.js</string>
  </array>
  <key>StartInterval</key>
  <integer>86400</integer>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.ai-trials-africa.automation.plist
```

### Linux (systemd)

Create `/etc/systemd/system/ai-trials-automation.service`:

```ini
[Unit]
Description=AI Trials Africa Registry Automation
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/web_interface
ExecStart=/usr/bin/node scripts/master-automation-n11.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl enable ai-trials-automation.service
sudo systemctl start ai-trials-automation.service
```

## Files

- `data/pending-verification.json` - Trials awaiting manual verification
- `data/verified-trials.json` - History of verified trials
- `data/.registry-last-check` - Timestamp of last registry check
- `config/registry-config.json` - Configuration

## Protocol Compliance

This system implements:

✅ **Quarterly automated searches** (configurable interval)  
✅ **Registry-specific search strategies** (exact syntax from protocol)  
✅ **Manual verification workflow** (dual-reviewer)  
✅ **Quality assurance procedures** (inclusion/exclusion criteria)  
✅ **Version control** (Git tracking of changes)  
✅ **Audit trail** (verification history)

## Troubleshooting

**No trials found:**
- Check registry API availability
- Verify search terms match protocol
- Check network connectivity

**Trials not adding to database:**
- Run manual verification: `npm run verify:trials`
- Check database exists: `ls data/network.db`
- Verify trial meets all inclusion criteria

**API rate limiting:**
- Adjust `rateLimit` in config
- Increase delays between requests
- Check registry API terms of service

## Next Steps

1. **Set up scheduled automation** (see above)
2. **Configure registry APIs** (PACTR, WHO ICTRP may require credentials)
3. **Train reviewers** on inclusion/exclusion criteria
4. **Monitor first few runs** to ensure accuracy
5. **Document any protocol deviations**

---

**Status:** ✅ Implemented per protocol  
**Last Updated:** December 29, 2024

