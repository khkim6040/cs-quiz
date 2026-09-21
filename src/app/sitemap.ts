import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const topics = await prisma.topic.findMany({ select: { id: true } });

  const topicEntries: MetadataRoute.Sitemap = topics.map((t) => ({
    url: `${SITE_URL}/quiz/${t.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/daily`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/weekly-challenge`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/leaderboard`, changeFrequency: "daily", priority: 0.6 },
    ...topicEntries,
  ];
}
