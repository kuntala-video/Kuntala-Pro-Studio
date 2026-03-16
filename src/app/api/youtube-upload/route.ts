import { NextResponse } from 'next/server';
import { YoutubeService } from '@/lib/youtube';
import { Readable } from 'stream';

export async function POST(req: Request) {
    // Check if OAuth2 credentials are set for the client.
    // In a real app, these credentials would be set after a user completes the OAuth flow.
    if (!YoutubeService.oauth2Client.credentials.access_token) {
        return NextResponse.json({
            error: 'YouTube authentication is not configured.',
            details: 'The server is not configured for YouTube OAuth2. Please complete the authentication flow.'
        }, { status: 501 }); // 501 Not Implemented
    }

    const data = await req.formData();
    const file: File | null = data.get('video') as unknown as File;
    const title = data.get('title') as string | null;
    const description = data.get('description') as string | null;
    const tagsRaw = data.get('tags') as string | null;
    const publishAt = data.get('publishAt') as string | null; // ISO string


    if (!file) {
        return NextResponse.json({ error: 'No video file provided.' }, { status: 400 });
    }

    let tags: string[] = [];
    if (tagsRaw) {
        try {
            // Assumes tags are sent as a JSON string array
            tags = JSON.parse(tagsRaw);
        } catch {
            // Fallback for simple comma-separated string
            tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
        }
    }

    const body = (file.stream as any)();
    const stream = Readable.from(body);
    
    const requestBody: any = {
        snippet: {
            title: title || 'AI Generated Video',
            description: description || 'Created using Kuntala AI Studio',
            tags: tags.length > 0 ? tags : undefined,
        },
        status: {
            privacyStatus: 'public',
        },
    };

    if (publishAt) {
        // For scheduled uploads, privacyStatus must be 'private'.
        requestBody.status.privacyStatus = 'private';
        requestBody.status.publishAt = publishAt;
    }


    try {
        const response = await YoutubeService.client.videos.insert({
            part: ['snippet', 'status'],
            requestBody: requestBody,
            media: {
                body: stream,
            },
        });

        return NextResponse.json({
            status: 'uploaded',
            videoId: response.data.id
        });

    } catch (error: any) {
        console.error("YouTube upload failed:", error.response ? error.response.data : error.message);
        return NextResponse.json({
            error: 'YouTube upload failed.',
            details: error.response ? error.response.data.error.message : error.message
        }, { status: 500 });
    }
}
