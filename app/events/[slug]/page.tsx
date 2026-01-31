import { notFound } from 'next/navigation'
import Image from 'next/image'
import React from 'react'
import BookEvent from '@/components/BookEvent'
import { getSimilarEventsBySlug } from '@/app/lib/actions/event.actions'
import { IEvent } from '@/database/event.model'
import EventCard from '@/components/EventCard'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

function safeParseArray(value: any): string[] {
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [value]
    } catch {
      return [value]
    }
  }

  return []
}

const EventDetailItem = ({
  icon,
  alt,
  label,
}: {
  icon: string
  alt: string
  label: string
}) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={20} height={20} />
    <p>{label}</p>
  </div>
)

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
)

const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
    {tags.map((tag) => (
      <div className="pill" key={tag}>
        {tag}
      </div>
    ))}
  </div>
)

const EventDetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params

  const response = await fetch(`${BASE_URL}/api/events/${slug}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    notFound()
  }

  const data = await response.json()

  if (!data?.event) {
    notFound()
  }

  const {
    description,
    image,
    overview,
    date,
    time,
    location,
    mode,
    agenda,
    audience,
    tags,
    organizer,
  } = data.event

  const bookings = 10
  const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug)
  console.log(similarEvents)

  return (
    <section id="event">
      <div className="header">
        <h1>Event Description</h1>
        <p>{description}</p>
      </div>

      <div className="details">
        {/* Left side */}
        <div className="content">
          <Image
            src={image}
            alt="Event Banner"
            width={800}
            height={800}
            className="Banner"
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event details</h2>
            <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={date} />
            <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
            <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
            <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
            <EventDetailItem
              icon="/icons/audience.svg"
              alt="audience"
              label={audience}
            />
          </section>

          {agenda?.length > 0 && (
            <EventAgenda agendaItems={safeParseArray(agenda)} />
          )}

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>

          {tags?.length > 0 && <EventTags tags={safeParseArray(tags)} />}
        </div>

        {/* Right side */}
        <aside className="booking">
          <p className="text-lg font-semibold">Book event</p>

          <div className="signup-card">
            <h2>Book your spot</h2>

            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have already booked their spot!
              </p>
            ) : (
              <p className="text-sm">Be the first to book your spot!</p>
            )}

            <BookEvent />
          </div>
        </aside>
      </div>

      <div className="flex w-full flex-col gap-2 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.length > 0 && similarEvents.map((similarEvents: IEvent) => (
            <EventCard key={similarEvents.title} {...similarEvents}/>
          ))}
        </div>
      </div>
    </section>
  )
}

export default EventDetailPage
