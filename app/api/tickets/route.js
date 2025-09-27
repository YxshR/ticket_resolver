import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/app/lib/prisma'
import { broadcastTicketCreated } from '@/app/lib/socketUtils'

// Validation schema for ticket creation
const createTicketSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  issue: z.string().min(1, 'Issue description is required').max(1000, 'Issue description must be less than 1000 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, HIGH, or URGENT' })
  })
})

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filter parameters
    const priorityFilter = searchParams.get('priority')
    const statusFilter = searchParams.get('status')
    
    // Build where clause for filtering
    const where = {}
    
    if (priorityFilter) {
      const priorities = priorityFilter.split(',').filter(p => ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(p))
      if (priorities.length > 0) {
        where.priority = { in: priorities }
      }
    }
    
    if (statusFilter) {
      const statuses = statusFilter.split(',').filter(s => ['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(s))
      if (statuses.length > 0) {
        where.status = { in: statuses }
      }
    }

    // Fetch tickets with filtering and sorting
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: {
        createdAt: 'desc' // Latest first as per requirements
      }
    })

    return NextResponse.json({
      tickets
    })

  } catch (error) {
    console.error('Error fetching tickets:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validationResult = createTicketSchema.safeParse(body)
    
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

    const { name, issue, priority } = validationResult.data

    // Create ticket in database
    const ticket = await prisma.ticket.create({
      data: {
        name,
        issue,
        priority,
        status: 'OPEN' // Default status as per requirements
      }
    })

    // Broadcast ticket creation via WebSocket
    broadcastTicketCreated(ticket)

    return NextResponse.json({
      success: true,
      ticket
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating ticket:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}