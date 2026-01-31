import Link from "next/link"
import Image from "next/image"

interface Props {
  image?: string
  title: string
  slug?: string
  location: string
  date: string
  time: string
}

const FALLBACK_IMAGE = "/images/placeholder.png"

const EventCard = ({ title, image, slug, location, date, time }: Props) => {
  const validImage =
    typeof image === "string" && image.trim().length > 0
      ? image
      : FALLBACK_IMAGE

  if (!slug) return null // prevents /events/undefined

  return (
    <Link href={`/events/${slug}`} id="event-card">
     {image && ( 
      <Image
        src={image}
        alt={title || "Event image"}
        width={410}
        height={300}
        className="poster"
      /> )}

      <div className="flex flex-row gap-2">
        <Image src="/icons/pin.svg" alt="location" width={14} height={14} />
        <p>{location}</p>
      </div>
      <p className="title">{title}</p>

      <div className="datetime">
        <div>
          <Image src="/icons/calendar.svg" alt="date" width={14} height={14} />
          <p>{date}</p>
        </div>
        <div>
          <Image src="/icons/clock.svg" alt="time" width={14} height={14} />
          <p>{time}</p>
        </div>
      </div>

    </Link>
  )
}

export default EventCard