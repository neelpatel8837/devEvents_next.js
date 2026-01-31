import { connectToDatabase } from "@/lib/mongotb";
import { v2 } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { Event } from "@/database/event.model";



export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const formData = await req.formData();

        let event;

        try {
            event = Object.fromEntries(formData.entries());
        } catch (e) {
            return NextResponse.json({ message: 'Invalid JSON data format'}, { status: 400 })
        }

        const file = formData.get('image') as File;

        if(!file) return NextResponse.json({ message: 'Image is required'}, { status: 400 })

        let tags = JSON.parse(formData.get('tags') as string);
        let agenda = JSON.parse(formData.get('agenda') as string);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            v2.uploader.upload_stream({ resource_type: 'image',folder: 'DevEvent' }, (error, results) => {
                if (error) reject(error);
                resolve(results);
            }).end(buffer);
        })

        event.image = (uploadResult as { secure_url: string }).secure_url;

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });

        return NextResponse.json({ message: 'Event created successfully', event: createdEvent }, { status: 201 })

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Event creation failed', error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
    }
}

export async function GET(){
    try {
        await connectToDatabase();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message : 'Events fetching failed', error: e }, { status: 500 });
    }
}

