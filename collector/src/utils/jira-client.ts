import axios from "axios";
import logger from "logger";

import settings from "settings";

interface JiraApproximateCountResponse {
  count: number;
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    created: string;
    updated: string;
    issuelinks?: JiraIssueLink[];
  };
}

export interface JiraIssueLink {
  id: string;
  type: {
    name: string;
    inward: string;
    outward: string;
  };
  inwardIssue?: JiraLinkedIssue;
  outwardIssue?: JiraLinkedIssue;
}

export interface JiraLinkedIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    issuetype: {
      name: string;
    };
    labels?: string[];
  };
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total?: number;
  startAt?: number;
  maxResults?: number;
  nextPageToken?: string;
  isLast?: boolean;
}

export class JiraClient {
  private readonly baseUrl: string;
  private readonly encodedCredentials: string;

  constructor() {
    this.baseUrl = settings.JIRA_BASE_URL;
    this.encodedCredentials = Buffer.from(`${settings.JIRA_EMAIL}:${settings.JIRA_API_TOKEN}`).toString("base64");
  }

  /**
   * Get headers for Jira API requests
   */
  private getHeaders() {
    return {
      Authorization: `Basic ${this.encodedCredentials}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Atlassian-Token": "no-check",
    };
  }

  /**
   * Get approximate issue count based on JQL query
   * @param jql The JQL query string
   * @returns The approximate count of issues matching the query
   */
  async getApproximateIssueCount(jql: string): Promise<number> {
    try {
      const response = await axios.post<JiraApproximateCountResponse>(
        `${this.baseUrl}/rest/api/3/search/approximate-count`,
        { jql },
        { headers: this.getHeaders() },
      );
      return response.data.count;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Jira API Request Failed:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      throw error;
    }
  }

  /**
   * Search for issues using JQL
   * @param jql The JQL query string
   * @param startAt Starting index for pagination
   * @param maxResults Maximum number of results to return
   * @param fields Additional fields to include in the response
   * @returns The search results including issues and total count
   */
  async searchIssues(
    jql: string,
    startAt = 0,
    maxResults = 50,
    fields: string[] = ["key", "summary", "status", "created", "updated"],
    nextPageToken?: string,
  ): Promise<JiraSearchResponse> {
    try {
      // Use the new /rest/api/3/search/jql endpoint with query parameters
      const params = new URLSearchParams({
        jql: jql,
        maxResults: maxResults.toString(),
        fields: fields.join(","),
      });
      
      // Use nextPageToken if provided, otherwise use startAt
      if (nextPageToken) {
        params.append("nextPageToken", nextPageToken);
      } else if (startAt > 0) {
        params.append("startAt", startAt.toString());
      }
      
      const response = await axios.get<any>(
        `${this.baseUrl}/rest/api/3/search/jql?${params.toString()}`,
        { headers: this.getHeaders() },
      );
      
      return {
        issues: response.data.issues || [],
        nextPageToken: response.data.nextPageToken,
        isLast: response.data.isLast,
        startAt: startAt,
        maxResults: maxResults,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Jira API Request Failed:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      throw error;
    }
  }

  /**
   * Get all issues matching JQL query with pagination
   * @param jql The JQL query string
   * @param fields Additional fields to include in the response
   * @returns All issues matching the query
   */
  async getAllIssues(jql: string, fields?: string[]): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    const seenKeys = new Set<string>();
    const maxResults = 100;
    let nextPageToken: string | undefined;
    let isLast = false;
    let hasNewIssues = true;

    do {
      const response = await this.searchIssues(jql, 0, maxResults, fields, nextPageToken);
      nextPageToken = response.nextPageToken;
      isLast = response.isLast ?? false;
      
      // Track how many new issues we actually added
      let newIssuesAdded = 0;
      
      for (const issue of response.issues) {
        if (!seenKeys.has(issue.key)) {
          seenKeys.add(issue.key);
          allIssues.push(issue);
          newIssuesAdded++;
        }
      }
      
      hasNewIssues = newIssuesAdded > 0;
      logger.info(`Fetched ${response.issues.length} issues, ${newIssuesAdded} new (total: ${allIssues.length})`);
      
      // Stop if this is the last page or no new issues were added
    } while (!isLast && hasNewIssues);

    return allIssues;
  }
}
