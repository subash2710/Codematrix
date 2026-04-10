import { Alert } from "../services/aiService";

export interface Scenario {
  name: string;
  description: string;
  alerts: Omit<Alert, "id" | "timestamp">[];
}

export const SCENARIOS: Scenario[] = [
  {
    name: "Account Compromise",
    description: "Brute force followed by privilege escalation and data exfiltration.",
    alerts: [
      {
        tool: "SIEM",
        type: "Brute Force Attempt",
        severity: "Medium",
        details: { user: "admin", source_ip: "192.168.1.50", attempts: 15 }
      },
      {
        tool: "SIEM",
        type: "Successful Login",
        severity: "Low",
        details: { user: "admin", source_ip: "192.168.1.50", location: "Romania" }
      },
      {
        tool: "EDR",
        type: "Privilege Escalation",
        severity: "High",
        details: { user: "admin", process: "powershell.exe", action: "Token Impersonation" }
      },
      {
        tool: "IDS",
        type: "Data Exfiltration",
        severity: "Critical",
        details: { source_ip: "192.168.1.50", destination: "185.220.101.50", volume: "500MB" }
      }
    ]
  },
  {
    name: "Ransomware Attack",
    description: "Suspicious file download followed by mass file encryption.",
    alerts: [
      {
        tool: "IDS",
        type: "Suspicious Download",
        severity: "Medium",
        details: { filename: "update.zip", source: "unknown-server.net" }
      },
      {
        tool: "EDR",
        type: "Mass File Modification",
        severity: "Critical",
        details: { process: "encryptor.exe", extension: ".locked", files_count: 1200 }
      },
      {
        tool: "SIEM",
        type: "Service Account Lockout",
        severity: "High",
        details: { account: "svc_backup", reason: "Multiple failed auth" }
      }
    ]
  },
  {
    name: "Insider Threat",
    description: "Authorized user accessing sensitive data at unusual hours.",
    alerts: [
      {
        tool: "SIEM",
        type: "Unusual Login Time",
        severity: "Low",
        details: { user: "k.smith", time: "03:15 AM", location: "Home Office" }
      },
      {
        tool: "EDR",
        type: "Sensitive File Access",
        severity: "Medium",
        details: { user: "k.smith", path: "/finance/salaries_2024.xlsx" }
      },
      {
        tool: "IDS",
        type: "Cloud Upload Spike",
        severity: "High",
        details: { user: "k.smith", destination: "personal-dropbox.com", volume: "2GB" }
      }
    ]
  }
];
