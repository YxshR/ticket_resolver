import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/app/lib/prisma'
import { broadcastTicketStatusChanged } from '@/app/lib/socketUtils'

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED'], {
    errorMap: () => ({ message: 'Status must be OPEN, IN_PROGRESS, or CLOSED' })
  })
})

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()

    const validationResult = updateStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { status } = validationResult.data

    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    })

    if (!existingTicket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ticket not found'
        },
        { status: 404 }
      )
    }

    const oldStatus = existingTicket.status

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status }
    })

    broadcastTicketStatusChanged(id, oldStatus, status, ticket)

    return NextResponse.json({
      success: true,
      ticket
    })

  } catch (error) {
    console.error('Error updating ticket:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}