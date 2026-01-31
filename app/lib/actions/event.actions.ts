'use server'

import { Event } from "@/database"
import { connectToDatabase } from "@/lib/mongotb"

export const getSimilarEventsBySlug = async (slug: string) => {
  try {
    await connectToDatabase()

    const event = await Event.findOne({ slug }).lean()
    if (!event) return []

    const similarEvents = await Event.find({
      _id: { $ne: event._id },
      tags: { $in: event.tags },
      image: { $exists: true, $ne: "" },
      slug: { $exists: true, $ne: "" } 
    })
      .select("title image slug location date time")
      .lean()

    return similarEvents
  } catch (err) {
    console.error("getSimilarEventsBySlug error:", err)
    return []
  }
}
