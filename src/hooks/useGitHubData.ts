"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  private: boolean;
  topics: string[];
  open_issues_count: number;
}

export interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  payload: {
    commits?: { message: string; sha: string }[];
    pull_request?: { title: string; number: number; merged: boolean };
    ref?: string;
    ref_type?: string;
  };
  created_at: string;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
  location: string | null;
  company: string | null;
  created_at: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubData {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  events: GitHubEvent[];
  loading: boolean;
  error: string | null;
  devScore: number;
  streak: number;
  totalCommits: number;
  topLanguages: { name: string; count: number; percentage: number }[];
  contributions: ContributionDay[];
  weeklyActivity: number[];
}

function computeDevScore(
  repos: GitHubRepo[],
  events: GitHubEvent[],
  streak: number,
): number {
  const commitEvents = events.filter((e) => e.type === "PushEvent").length;
  const recentActivity = Math.min(commitEvents * 3, 30);
  const streakScore = Math.min(streak * 2, 30);
  const repoScore = Math.min(repos.filter((r) => !r.private).length * 1.5, 20);
  const starScore = Math.min(
    repos.reduce((acc, r) => acc + r.stargazers_count, 0) * 0.5,
    20,
  );
  const baseScore = recentActivity + streakScore + repoScore + starScore;
  const spamPenalty = computeSpamPenalty(events);
  return Math.max(0, Math.min(Math.round(baseScore - spamPenalty), 100));
}

function computeStreak(events: GitHubEvent[]): number {
  const pushDays = new Set(
    events
      .filter((e) => e.type === "PushEvent")
      .map((e) => e.created_at.split("T")[0]),
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (pushDays.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function computeLanguages(repos: GitHubRepo[]) {
  const counts: Record<string, number> = {};
  repos.forEach((r) => {
    if (r.language) counts[r.language] = (counts[r.language] || 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

function generateContributions(events: GitHubEvent[]): ContributionDay[] {
  const pushByDay: Record<string, number> = {};
  events
    .filter((e) => e.type === "PushEvent")
    .forEach((e) => {
      const day = e.created_at.split("T")[0];
      const commits = e.payload.commits?.length ?? 1;
      pushByDay[day] = (pushByDay[day] || 0) + commits;
    });
  const days: ContributionDay[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    const count = pushByDay[date] || 0;
    const level =
      count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4;
    days.push({ date, count, level: level as 0 | 1 | 2 | 3 | 4 });
  }
  return days;
}

function computeWeeklyActivity(events: GitHubEvent[]): number[] {
  const days = [0, 0, 0, 0, 0, 0, 0];
  events
    .filter((e) => e.type === "PushEvent")
    .forEach((e) => {
      const day = new Date(e.created_at).getDay();
      days[day] += e.payload.commits?.length ?? 1;
    });
  return days;
}

function computeSpamPenalty(events: GitHubEvent[]): number {
  const commitsPerHour: Record<string, number> = {};

  events.forEach((e) => {
    if (e.type !== "PushEvent") return;
    const date = new Date(e.created_at);
    const key = `${date.toISOString().split("T")[0]}-${date.getHours()}`;
    const commits = e.payload.commits?.length ?? 1;
    commitsPerHour[key] = (commitsPerHour[key] || 0) + commits;
  });
  let penalty = 0;

  Object.values(commitsPerHour).forEach((count) => {
    if (count > 10) {
      penalty += Math.floor((count - 10) / 5) * 2;
    }
  });
  return penalty;
}

export function useGitHubData(): GitHubData {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [ghUser, setGhUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const username = (session?.user as { username?: string })?.username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);

    const headers = { Accept: "application/vnd.github+json" };

    Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }).then((r) =>
        r.json(),
      ),
      fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
        { headers },
      ).then((r) => r.json()),
      fetch(`https://api.github.com/users/${username}/events?per_page=100`, {
        headers,
      }).then((r) => r.json()),
    ])
      .then(([user, repoData, eventData]) => {
        if (user.message) {
          setError("GitHub API rate limited or user not found");
          return;
        }
        setGhUser(user);
        setRepos(Array.isArray(repoData) ? repoData : []);
        setEvents(Array.isArray(eventData) ? eventData : []);
      })
      .catch(() => setError("Failed to fetch GitHub data"))
      .finally(() => setLoading(false));
  }, [username]);

  const streak = computeStreak(events);
  const totalCommits = events
    .filter((e) => e.type === "PushEvent")
    .reduce((acc, e) => acc + (e.payload.commits?.length ?? 1), 0);

  return {
    user: ghUser,
    repos,
    events,
    loading,
    error,
    devScore: computeDevScore(repos, events, streak),
    streak,
    totalCommits,
    topLanguages: computeLanguages(repos),
    contributions: generateContributions(events),
    weeklyActivity: computeWeeklyActivity(events),
  };
}
