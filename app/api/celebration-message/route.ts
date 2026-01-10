import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { childName, requestType, pointsEarned } = await request.json()

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Generate a short, enthusiastic celebration message for a child named ${childName} who just successfully used the bathroom (${requestType}) and earned ${pointsEarned} points. 
      
      Keep it:
      - Very short (1-2 sentences max)
      - Age-appropriate and encouraging
      - Fun and exciting
      - Use their name
      
      Just return the message, nothing else.`,
      maxTokens: 100,
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("AI message error:", error)
    // Fallback messages if AI fails
    const fallbackMessages = [
      "Amazing job! You're a superstar!",
      "Way to go! You did it!",
      "Incredible! Keep up the great work!",
      "Awesome! You're doing amazing!",
    ]
    const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]
    return NextResponse.json({ message: randomMessage })
  }
}
