export type NotificationDetails = {
    from: string
    to: string | string[]
    subject: string
} & Partial<{
    text: string
    html: string
}>