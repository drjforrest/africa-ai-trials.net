#!/usr/bin/env node
/**
 * Notification Helper - Sends notifications for various events
 * Supports desktop notifications (macOS/Linux) and saves to JSON file
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const NOTIFICATION_FILE = path.join(__dirname, '../data/notifications.json');
const CONFIG_FILE = path.join(__dirname, '../config/notification-config.json');

class NotificationHelper {
  /**
   * Load notification configuration
   */
  static loadConfig() {
    const defaultConfig = {
      email: {
        enabled: false,
        to: null,
        from: null,
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false
        }
      },
      remoteDesktop: {
        enabled: false,
        host: null,
        user: null,
        sshKey: null
      }
    };

    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      } catch (e) {
        console.warn('Error reading notification config, using defaults:', e.message);
        return defaultConfig;
      }
    }

    return defaultConfig;
  }

  /**
   * Send a notification
   * @param {Object} notification - { type, title, message, data }
   */
  static async send(notification) {
    // Save to file
    this.saveToFile(notification);
    
    // Send desktop notification (local)
    await this.sendDesktopNotification(notification);
    
    // Send remote notifications
    await this.sendRemoteNotifications(notification);
    
    // Log to console
    console.log(`[${new Date().toISOString()}] 📢 ${notification.title}`);
    console.log(`[${new Date().toISOString()}]    ${notification.message}`);
  }

  /**
   * Send multiple notifications
   * @param {Array} notifications - Array of notification objects
   */
  static async sendBatch(notifications) {
    if (notifications.length === 0) return;
    
    // Save all to file
    notifications.forEach(notif => this.saveToFile(notif));
    
    // Send desktop notification (single notification for batch)
    if (notifications.length === 1) {
      await this.sendDesktopNotification(notifications[0]);
      await this.sendRemoteNotifications(notifications[0]);
    } else {
      const summary = this.createBatchSummary(notifications);
      await this.sendDesktopNotification(summary);
      await this.sendRemoteNotifications(summary);
    }
    
    // Log all to console
    console.log(`[${new Date().toISOString()}] === NOTIFICATIONS (${notifications.length}) ===`);
    notifications.forEach(notif => {
      console.log(`[${new Date().toISOString()}] 📢 ${notif.title}`);
      console.log(`[${new Date().toISOString()}]    ${notif.message}`);
    });
  }

  /**
   * Save notification to JSON file
   */
  static saveToFile(notification) {
    let existing = [];
    
    if (fs.existsSync(NOTIFICATION_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(NOTIFICATION_FILE, 'utf8'));
      } catch (e) {
        existing = [];
      }
    }
    
    // Add timestamp if not present
    if (!notification.timestamp) {
      notification.timestamp = new Date().toISOString();
    }
    
    existing.push(notification);
    
    // Keep only last 100 notifications
    if (existing.length > 100) {
      existing = existing.slice(-100);
    }
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(NOTIFICATION_FILE), { recursive: true });
    fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(existing, null, 2));
  }

  /**
   * Send desktop notification (macOS/Linux)
   */
  static async sendDesktopNotification(notification) {
    if (process.platform === 'darwin') {
      // macOS
      spawn('osascript', [
        '-e',
        `display notification "${notification.message}" with title "${notification.title}" sound name "Glass"`
      ]);
    } else if (process.platform === 'linux') {
      // Linux (requires notify-send)
      spawn('notify-send', [
        notification.title,
        notification.message,
        '--urgency=normal',
        '--expire-time=10000'
      ]);
    }
    // Windows not supported yet
  }

  /**
   * Send remote notifications (email, remote desktop, etc.)
   */
  static async sendRemoteNotifications(notification) {
    const config = this.loadConfig();

    // Send email notification
    if (config.email?.enabled && config.email?.to) {
      await this.sendEmailNotification(notification, config.email);
    }

    // Send remote desktop notification via SSH
    if (config.remoteDesktop?.enabled && config.remoteDesktop?.host) {
      await this.sendRemoteDesktopNotification(notification, config.remoteDesktop);
    }
  }

  /**
   * Send email notification using macOS mail command
   */
  static async sendEmailNotification(notification, emailConfig) {
    try {
      const subject = notification.title;
      const body = `${notification.message}\n\nType: ${notification.type}\nTimestamp: ${notification.timestamp}\n\nView details in: data/notifications.json`;

      // Use macOS mail command (requires mail server configured)
      const mailCommand = `echo "${body}" | mail -s "${subject}" ${emailConfig.to}`;
      
      exec(mailCommand, (error) => {
        if (error) {
          // Fallback: try using sendmail or log error
          console.warn(`[${new Date().toISOString()}] Email notification failed:`, error.message);
          console.warn(`[${new Date().toISOString()}] Notification saved to file instead`);
        } else {
          console.log(`[${new Date().toISOString()}] 📧 Email notification sent to ${emailConfig.to}`);
        }
      });
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Email notification error:`, error.message);
    }
  }

  /**
   * Send desktop notification to remote Mac via SSH
   */
  static async sendRemoteDesktopNotification(notification, remoteConfig) {
    try {
      const user = remoteConfig.user || process.env.USER;
      const host = remoteConfig.host;
      const sshKey = remoteConfig.sshKey ? `-i ${remoteConfig.sshKey}` : '';
      
      // Escape the notification text for shell
      const escapedTitle = notification.title.replace(/"/g, '\\"');
      const escapedMessage = notification.message.replace(/"/g, '\\"');
      
      const sshCommand = `ssh ${sshKey} ${user}@${host} osascript -e 'display notification "${escapedMessage}" with title "${escapedTitle}" sound name "Glass"'`;
      
      exec(sshCommand, { timeout: 5000 }, (error) => {
        if (error) {
          console.warn(`[${new Date().toISOString()}] Remote desktop notification failed:`, error.message);
          console.warn(`[${new Date().toISOString()}] Make sure SSH keys are set up and host is reachable`);
        } else {
          console.log(`[${new Date().toISOString()}] 🖥️  Remote notification sent to ${user}@${host}`);
        }
      });
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Remote notification error:`, error.message);
    }
  }

  /**
   * Create a summary notification for batches
   */
  static createBatchSummary(notifications) {
    const counts = {
      NEW_TRIAL: 0,
      TRIAL_COMPLETED: 0,
      NEW_INSTITUTION: 0,
      NEW_COMPANY: 0,
      PENDING_VERIFICATION: 0
    };
    
    notifications.forEach(notif => {
      if (counts.hasOwnProperty(notif.type)) {
        counts[notif.type]++;
      }
    });
    
    const parts = [];
    if (counts.NEW_TRIAL > 0) parts.push(`${counts.NEW_TRIAL} new trial${counts.NEW_TRIAL > 1 ? 's' : ''}`);
    if (counts.PENDING_VERIFICATION > 0) parts.push(`${counts.PENDING_VERIFICATION} pending verification`);
    if (counts.TRIAL_COMPLETED > 0) parts.push(`${counts.TRIAL_COMPLETED} completed`);
    if (counts.NEW_INSTITUTION > 0) parts.push(`${counts.NEW_INSTITUTION} new institution${counts.NEW_INSTITUTION > 1 ? 's' : ''}`);
    if (counts.NEW_COMPANY > 0) parts.push(`${counts.NEW_COMPANY} new compan${counts.NEW_COMPANY > 1 ? 'ies' : 'y'}`);
    
    return {
      type: 'BATCH_UPDATE',
      title: `${notifications.length} Network Updates`,
      message: parts.join(', '),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create notification for new trials discovered in registries
   */
  static createNewTrialDiscoveredNotification(trial) {
    return {
      type: 'PENDING_VERIFICATION',
      title: `New Trial Discovered: ${trial.title}`,
      message: `Found in ${trial.registry_source} - ${trial.country}. Requires manual verification.`,
      data: trial,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create notification for multiple new trials
   */
  static createMultipleTrialsDiscoveredNotification(count, registrySource) {
    return {
      type: 'PENDING_VERIFICATION',
      title: `${count} New Trial${count > 1 ? 's' : ''} Discovered`,
      message: `Found ${count} new trial${count > 1 ? 's' : ''} in ${registrySource}. Review pending verification list.`,
      data: { count, registrySource },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = NotificationHelper;

