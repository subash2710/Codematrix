import { GoogleGenAI } from "@google/genai";

export interface Alert {
  id: string;
  tool: "SIEM" | "EDR" | "IDS";
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  timestamp: string;
  details: Record<string, any>;
}

export interface Incident {
  id: string;
  alerts: Alert[];
  startTime: string;
  endTime: string;
  status: "Open" | "Analyzing" | "Resolved";
}

export interface AnalysisReport {
  classification: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  summary: string;
  rootCause: string;
  timeline: { time: string; event: string }[];
  impact: string;
  recommendations: string[];
}

const severityRank: Record<AnalysisReport["severity"], number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

const getApiKey = () => {
  const processKey =
    typeof process !== "undefined"
      ? (process as any)?.env?.GEMINI_API_KEY
      : undefined;
  const viteKey = (import.meta as any)?.env?.GEMINI_API_KEY || (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  return processKey || viteKey || "";
};

const classifyIncident = (alerts: Alert[]) => {
  const types = alerts.map((a) => a.type.toLowerCase());
  if (types.some((t) => t.includes("ransom")) || types.some((t) => t.includes("encrypt"))) {
    return "Ransomware Activity";
  }
  if (types.some((t) => t.includes("brute force")) && types.some((t) => t.includes("privilege"))) {
    return "Account Compromise and Privilege Escalation";
  }
  if (types.some((t) => t.includes("exfiltration"))) {
    return "Data Exfiltration";
  }
  return "Multi-Stage Security Incident";
};

const getHighestSeverity = (alerts: Alert[]): AnalysisReport["severity"] => {
  const sorted = [...alerts].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  return sorted[0]?.severity || "Low";
};

const createFallbackReport = (incident: Incident): AnalysisReport => {
  const classification = classifyIncident(incident.alerts);
  const severity = getHighestSeverity(incident.alerts);

  return {
    classification,
    severity,
    summary: `Incident ${incident.id} contains ${incident.alerts.length} correlated alerts across ${new Set(
      incident.alerts.map((a) => a.tool)
    ).size} security tools, indicating a likely coordinated attack chain.`,
    rootCause:
      "Initial access appears related to weak identity controls and insufficient preventive policy enforcement (for example MFA, lockout, or privilege hardening).",
    timeline: incident.alerts.map((alert) => ({
      time: alert.timestamp,
      event: `${alert.tool} detected ${alert.type}.`,
    })),
    impact:
      "Potential impact includes account compromise, lateral movement, service disruption, and possible data exposure depending on containment speed.",
    recommendations: [
      "Isolate impacted hosts and disable suspected compromised accounts.",
      "Reset credentials, enforce MFA, and review privileged account assignments.",
      "Block malicious indicators (IP, domains, hashes) and monitor for recurrence.",
      "Perform root-cause remediation and validate with post-incident detection tuning.",
    ],
  };
};

const parseJsonResponse = (rawText: string) => {
  const text = rawText?.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // Continue with extraction attempts below.
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // Continue with brace extraction below.
    }
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }

  return null;
};

const normalizeReport = (report: any, incident: Incident): AnalysisReport => {
  const fallback = createFallbackReport(incident);
  return {
    classification: report?.classification || fallback.classification,
    severity: ["Critical", "High", "Medium", "Low"].includes(report?.severity)
      ? report.severity
      : fallback.severity,
    summary: report?.summary || fallback.summary,
    rootCause: report?.rootCause || fallback.rootCause,
    timeline: Array.isArray(report?.timeline) && report.timeline.length > 0 ? report.timeline : fallback.timeline,
    impact: report?.impact || fallback.impact,
    recommendations:
      Array.isArray(report?.recommendations) && report.recommendations.length > 0
        ? report.recommendations
        : fallback.recommendations,
  };
};

export const analyzeIncident = async (incident: Incident) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return createFallbackReport(incident);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are a Senior SOC Analyst (Tier 3). Analyze the following correlated security incident and provide a structured investigation report.
    
    Incident Data:
    ${JSON.stringify(incident, null, 2)}
    
    The report MUST be in JSON format with the following structure:
    {
      "classification": "Incident Type (e.g., Account Compromise)",
      "severity": "Critical | High | Medium | Low",
      "summary": "A brief 2-3 sentence summary of the incident.",
      "rootCause": "What was the primary entry point or cause?",
      "timeline": [
        { "time": "HH:mm:ss", "event": "Description of the event" }
      ],
      "impact": "Description of the potential or actual damage.",
      "recommendations": [
        "Actionable step 1",
        "Actionable step 2"
      ]
    }
    
    Rules:
    - Return ONLY valid JSON. No markdown, no code fences, no prose outside JSON.
    - Keep timeline events tightly mapped to provided alerts.
    - Be concise and deterministic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      }
    });

    const parsed = parseJsonResponse(response.text || "");
    if (!parsed) {
      return createFallbackReport(incident);
    }
    return normalizeReport(parsed, incident);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return createFallbackReport(incident);
  }
};
